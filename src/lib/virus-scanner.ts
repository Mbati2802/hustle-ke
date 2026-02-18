/**
 * Virus Scanning Utilities
 * Scan uploaded files for malware using ClamAV or VirusTotal
 */

import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const adminClient = createClient(supabaseUrl, supabaseServiceKey)

// VirusTotal API configuration
const VIRUSTOTAL_API_KEY = process.env.VIRUSTOTAL_API_KEY
const VIRUSTOTAL_API_URL = 'https://www.virustotal.com/api/v3'

// File size limits (in bytes)
const MAX_SCAN_SIZE = 32 * 1024 * 1024 // 32MB for VirusTotal
const SUSPICIOUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.scr', '.pif',
  '.vbs', '.js', '.jar', '.msi', '.dll', '.sys',
  '.sh', '.app', '.deb', '.rpm'
]

interface ScanResult {
  status: 'clean' | 'infected' | 'suspicious' | 'error' | 'pending'
  threatName?: string
  details?: Record<string, unknown>
  scannerName: string
  scanDurationMs: number
}

interface FileUploadRecord {
  id: string
  userId: string
  profileId: string
  fileName: string
  filePath: string
  fileSize: number
  fileType?: string
  uploadType: string
  relatedId?: string
}

/**
 * Check if file extension is suspicious
 */
export function isSuspiciousExtension(fileName: string): boolean {
  const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
  return SUSPICIOUS_EXTENSIONS.includes(ext)
}

/**
 * Calculate file hash (SHA-256)
 */
export function calculateFileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

/**
 * Scan file using VirusTotal
 */
async function scanWithVirusTotal(fileBuffer: Buffer, fileName: string): Promise<ScanResult> {
  const startTime = Date.now()

  if (!VIRUSTOTAL_API_KEY) {
    console.warn('[Virus Scanner] VirusTotal API key not configured')
    return {
      status: 'error',
      details: { error: 'VirusTotal not configured' },
      scannerName: 'virustotal',
      scanDurationMs: Date.now() - startTime,
    }
  }

  if (fileBuffer.length > MAX_SCAN_SIZE) {
    return {
      status: 'error',
      details: { error: 'File too large for VirusTotal (max 32MB)' },
      scannerName: 'virustotal',
      scanDurationMs: Date.now() - startTime,
    }
  }

  try {
    // Calculate file hash
    const fileHash = calculateFileHash(fileBuffer)

    // Check if file was already scanned
    const lookupResponse = await fetch(`${VIRUSTOTAL_API_URL}/files/${fileHash}`, {
      headers: {
        'x-apikey': VIRUSTOTAL_API_KEY,
      },
    })

    if (lookupResponse.ok) {
      const data = await lookupResponse.json()
      const stats = data.data?.attributes?.last_analysis_stats || {}
      const malicious = stats.malicious || 0
      const suspicious = stats.suspicious || 0

      if (malicious > 0) {
        return {
          status: 'infected',
          threatName: 'Malware detected',
          details: { stats, hash: fileHash },
          scannerName: 'virustotal',
          scanDurationMs: Date.now() - startTime,
        }
      } else if (suspicious > 0) {
        return {
          status: 'suspicious',
          details: { stats, hash: fileHash },
          scannerName: 'virustotal',
          scanDurationMs: Date.now() - startTime,
        }
      } else {
        return {
          status: 'clean',
          details: { stats, hash: fileHash },
          scannerName: 'virustotal',
          scanDurationMs: Date.now() - startTime,
        }
      }
    }

    // File not in database, upload for scanning
    const formData = new FormData()
    formData.append('file', new Blob([new Uint8Array(fileBuffer)]), fileName)

    const uploadResponse = await fetch(`${VIRUSTOTAL_API_URL}/files`, {
      method: 'POST',
      headers: {
        'x-apikey': VIRUSTOTAL_API_KEY,
      },
      body: formData,
    })

    if (!uploadResponse.ok) {
      throw new Error('VirusTotal upload failed')
    }

    // Return pending status - actual results need to be polled
    return {
      status: 'pending',
      details: { hash: fileHash, message: 'Scan in progress' },
      scannerName: 'virustotal',
      scanDurationMs: Date.now() - startTime,
    }
  } catch (error) {
    console.error('[Virus Scanner] VirusTotal error:', error)
    return {
      status: 'error',
      details: { error: String(error) },
      scannerName: 'virustotal',
      scanDurationMs: Date.now() - startTime,
    }
  }
}

/**
 * Basic heuristic scan (fallback when no scanner available)
 */
function heuristicScan(fileName: string, fileBuffer: Buffer): ScanResult {
  const startTime = Date.now()

  // Check for suspicious extensions
  if (isSuspiciousExtension(fileName)) {
    return {
      status: 'suspicious',
      details: { reason: 'Suspicious file extension' },
      scannerName: 'heuristic',
      scanDurationMs: Date.now() - startTime,
    }
  }

  // Check for executable signatures
  const header = fileBuffer.slice(0, 4).toString('hex')
  const executableSignatures = ['4d5a9000', '7f454c46', 'cafebabe', 'feedface']
  
  if (executableSignatures.includes(header)) {
    return {
      status: 'suspicious',
      details: { reason: 'Executable file detected' },
      scannerName: 'heuristic',
      scanDurationMs: Date.now() - startTime,
    }
  }

  // Default to clean if no issues found
  return {
    status: 'clean',
    scannerName: 'heuristic',
    scanDurationMs: Date.now() - startTime,
  }
}

/**
 * Record file upload in database
 */
export async function recordFileUpload(record: FileUploadRecord): Promise<string | null> {
  try {
    const { data, error } = await adminClient
      .from('file_uploads')
      .insert({
        user_id: record.userId,
        profile_id: record.profileId,
        file_name: record.fileName,
        file_path: record.filePath,
        file_size: record.fileSize,
        file_type: record.fileType,
        upload_type: record.uploadType,
        related_id: record.relatedId,
        scan_status: 'pending',
      })
      .select('id')
      .single()

    if (error) {
      console.error('[Virus Scanner] Record upload error:', error)
      return null
    }

    return data.id
  } catch (error) {
    console.error('[Virus Scanner] Record upload exception:', error)
    return null
  }
}

/**
 * Scan uploaded file
 */
export async function scanFile(
  fileUploadId: string,
  fileName: string,
  fileBuffer: Buffer
): Promise<ScanResult> {
  let result: ScanResult

  // Try VirusTotal first if configured
  if (VIRUSTOTAL_API_KEY) {
    result = await scanWithVirusTotal(fileBuffer, fileName)
  } else {
    // Fallback to heuristic scan
    result = heuristicScan(fileName, fileBuffer)
  }

  // Update file upload record
  await adminClient
    .from('file_uploads')
    .update({
      scan_status: result.status,
      scan_result: result.details || {},
      scanned_at: new Date().toISOString(),
      quarantined: result.status === 'infected',
      quarantined_at: result.status === 'infected' ? new Date().toISOString() : null,
    })
    .eq('id', fileUploadId)

  // Log scan result
  await adminClient.from('virus_scan_log').insert({
    file_upload_id: fileUploadId,
    scanner_name: result.scannerName,
    scan_result: result.status,
    threat_name: result.threatName,
    threat_details: result.details || {},
    scan_duration_ms: result.scanDurationMs,
  })

  return result
}

/**
 * Get file upload status
 */
export async function getFileUploadStatus(fileUploadId: string) {
  try {
    const { data, error } = await adminClient
      .from('file_uploads')
      .select('*')
      .eq('id', fileUploadId)
      .single()

    if (error) {
      console.error('[Virus Scanner] Get status error:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('[Virus Scanner] Get status exception:', error)
    return null
  }
}

/**
 * Get scan statistics
 */
export async function getScanStatistics(daysBack: number = 30) {
  try {
    const { data, error } = await adminClient.rpc('get_scan_statistics', {
      days_back: daysBack,
    })

    if (error) {
      console.error('[Virus Scanner] Get statistics error:', error)
      return null
    }

    return data?.[0] || null
  } catch (error) {
    console.error('[Virus Scanner] Get statistics exception:', error)
    return null
  }
}

/**
 * Quarantine infected file
 */
export async function quarantineFile(fileUploadId: string): Promise<boolean> {
  try {
    const { error } = await adminClient
      .from('file_uploads')
      .update({
        quarantined: true,
        quarantined_at: new Date().toISOString(),
      })
      .eq('id', fileUploadId)

    if (error) {
      console.error('[Virus Scanner] Quarantine error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[Virus Scanner] Quarantine exception:', error)
    return false
  }
}
