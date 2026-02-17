'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Shield, Key, Copy, Check, AlertTriangle, Loader2, Download } from 'lucide-react'

interface MFAStatus {
  enabled: boolean
  verified_at?: string
  backup_codes_remaining: number
  backup_codes_used: number
}

interface SetupData {
  secret: string
  qrCode: string
  backupCodes: string[]
}

export default function MFASettingsPage() {
  const { profile } = useAuth()
  const [status, setStatus] = useState<MFAStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [setupData, setSetupData] = useState<SetupData | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [disableCode, setDisableCode] = useState('')
  const [regenerateCode, setRegenerateCode] = useState('')
  const [newBackupCodes, setNewBackupCodes] = useState<string[] | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/mfa/status')
      const data = await res.json()
      setStatus(data)
    } catch (err) {
      console.error('Failed to fetch MFA status:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSetup = async () => {
    setActionLoading(true)
    setError('')
    try {
      const res = await fetch('/api/mfa/setup', { method: 'POST' })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to setup MFA')
      }
      
      setSetupData(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleEnable = async () => {
    if (!setupData || !verificationCode) {
      setError('Please enter the verification code')
      return
    }

    setActionLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/mfa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: setupData.secret,
          token: verificationCode,
          backupCodes: setupData.backupCodes,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to enable MFA')
      }

      setSuccess('Two-factor authentication enabled successfully!')
      setSetupData(null)
      setVerificationCode('')
      await fetchStatus()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDisable = async () => {
    if (!disableCode) {
      setError('Please enter your verification code')
      return
    }

    setActionLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/mfa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: disableCode }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to disable MFA')
      }

      setSuccess('Two-factor authentication disabled successfully')
      setDisableCode('')
      await fetchStatus()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleRegenerateBackupCodes = async () => {
    if (!regenerateCode) {
      setError('Please enter your verification code')
      return
    }

    setActionLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/mfa/backup-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: regenerateCode }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to regenerate backup codes')
      }

      setNewBackupCodes(data.backup_codes)
      setSuccess('Backup codes regenerated successfully!')
      setRegenerateCode('')
      await fetchStatus()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const downloadBackupCodes = (codes: string[]) => {
    const text = `HustleKE Backup Codes\n\nSave these codes in a safe place. Each code can only be used once.\n\n${codes.join('\n')}\n\nGenerated: ${new Date().toLocaleString()}`
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'hustleke-backup-codes.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Two-Factor Authentication</h1>
        <p className="text-gray-600">Add an extra layer of security to your account</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* MFA Status */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Shield className={`w-6 h-6 ${status?.enabled ? 'text-green-600' : 'text-gray-400'}`} />
            <div>
              <h2 className="text-xl font-semibold">Status</h2>
              <p className="text-sm text-gray-600">
                {status?.enabled ? 'Two-factor authentication is enabled' : 'Two-factor authentication is disabled'}
              </p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            status?.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {status?.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        {status?.enabled && (
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Backup Codes Remaining</p>
                <p className="text-lg font-semibold">{status.backup_codes_remaining}</p>
              </div>
              <div>
                <p className="text-gray-600">Backup Codes Used</p>
                <p className="text-lg font-semibold">{status.backup_codes_used}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Setup MFA */}
      {!status?.enabled && !setupData && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Enable Two-Factor Authentication</h2>
          <p className="text-gray-600 mb-4">
            Protect your account with an authenticator app like Google Authenticator, Authy, or 1Password.
          </p>
          <button
            onClick={handleSetup}
            disabled={actionLoading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
            Get Started
          </button>
        </div>
      )}

      {/* Setup Process */}
      {setupData && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Setup Two-Factor Authentication</h2>
          
          <div className="space-y-6">
            {/* Step 1: Scan QR Code */}
            <div>
              <h3 className="font-semibold mb-2">Step 1: Scan QR Code</h3>
              <p className="text-sm text-gray-600 mb-4">
                Open your authenticator app and scan this QR code:
              </p>
              <div className="flex justify-center mb-4">
                <img src={setupData.qrCode} alt="QR Code" className="border rounded-lg p-4" />
              </div>
              <p className="text-xs text-gray-500 text-center">
                Can't scan? Enter this key manually: <code className="bg-gray-100 px-2 py-1 rounded">{setupData.secret}</code>
              </p>
            </div>

            {/* Step 2: Verify */}
            <div>
              <h3 className="font-semibold mb-2">Step 2: Verify Code</h3>
              <p className="text-sm text-gray-600 mb-4">
                Enter the 6-digit code from your authenticator app:
              </p>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full px-4 py-2 border rounded-lg mb-4"
                maxLength={6}
              />
              <button
                onClick={handleEnable}
                disabled={actionLoading || verificationCode.length !== 6}
                className="w-full px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Enable Two-Factor Authentication
              </button>
            </div>

            {/* Step 3: Backup Codes */}
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-2">Step 3: Save Backup Codes</h3>
              <p className="text-sm text-gray-600 mb-4">
                Save these backup codes in a safe place. Each code can only be used once if you lose access to your authenticator app.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-2">
                  {setupData.backupCodes.map((code, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white px-3 py-2 rounded border">
                      <code className="text-sm font-mono">{code}</code>
                      <button
                        onClick={() => copyToClipboard(code, `setup-${idx}`)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {copiedCode === `setup-${idx}` ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => downloadBackupCodes(setupData.backupCodes)}
                className="flex items-center gap-2 text-green-600 hover:text-green-700"
              >
                <Download className="w-4 h-4" />
                Download Backup Codes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage MFA */}
      {status?.enabled && (
        <>
          {/* Regenerate Backup Codes */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Regenerate Backup Codes</h2>
            <p className="text-gray-600 mb-4">
              Generate new backup codes. This will invalidate all existing backup codes.
            </p>
            
            {newBackupCodes ? (
              <div>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 gap-2">
                    {newBackupCodes.map((code, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white px-3 py-2 rounded border">
                        <code className="text-sm font-mono">{code}</code>
                        <button
                          onClick={() => copyToClipboard(code, `new-${idx}`)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {copiedCode === `new-${idx}` ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => downloadBackupCodes(newBackupCodes)}
                  className="flex items-center gap-2 text-green-600 hover:text-green-700 mb-4"
                >
                  <Download className="w-4 h-4" />
                  Download Backup Codes
                </button>
                <button
                  onClick={() => setNewBackupCodes(null)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Close
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  value={regenerateCode}
                  onChange={(e) => setRegenerateCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  className="w-full px-4 py-2 border rounded-lg mb-4"
                  maxLength={6}
                />
                <button
                  onClick={handleRegenerateBackupCodes}
                  disabled={actionLoading || regenerateCode.length !== 6}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                  Regenerate Codes
                </button>
              </div>
            )}
          </div>

          {/* Disable MFA */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4 text-red-600">Disable Two-Factor Authentication</h2>
            <p className="text-gray-600 mb-4">
              Disabling two-factor authentication will make your account less secure.
            </p>
            <input
              type="text"
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit code to confirm"
              className="w-full px-4 py-2 border rounded-lg mb-4"
              maxLength={6}
            />
            <button
              onClick={handleDisable}
              disabled={actionLoading || disableCode.length !== 6}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              Disable Two-Factor Authentication
            </button>
          </div>
        </>
      )}
    </div>
  )
}
