import { NextRequest } from 'next/server'
import { requireAdmin, jsonResponse, errorResponse } from '@/lib/api-utils'
import { getScanStatistics } from '@/lib/virus-scanner'

// GET /api/admin/virus-scans — Get virus scan statistics (admin only)
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  try {
    const url = new URL(req.url)
    const daysBack = parseInt(url.searchParams.get('days') || '30')

    const stats = await getScanStatistics(daysBack)

    if (!stats) {
      return errorResponse('Failed to fetch scan statistics', 500)
    }

    // Get recent infected files
    const { data: infectedFiles } = await auth.supabase
      .from('file_uploads')
      .select('id, file_name, file_type, scan_status, scanned_at, profile_id, profiles(full_name, email)')
      .eq('scan_status', 'infected')
      .order('scanned_at', { ascending: false })
      .limit(10)

    // Get recent quarantined files
    const { data: quarantinedFiles } = await auth.supabase
      .from('file_uploads')
      .select('id, file_name, file_type, quarantined_at, profile_id, profiles(full_name, email)')
      .eq('quarantined', true)
      .order('quarantined_at', { ascending: false })
      .limit(10)

    return jsonResponse({
      statistics: stats,
      infected_files: infectedFiles || [],
      quarantined_files: quarantinedFiles || [],
    })
  } catch (error) {
    console.error('[Admin Virus Scans] Error:', error)
    return errorResponse('Failed to fetch virus scan data', 500)
  }
}
