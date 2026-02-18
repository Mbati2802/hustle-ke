'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  FileText,
  Download,
  Eye,
  Calendar,
  DollarSign,
  Loader2,
  Receipt,
  X,
  Printer,
  Hash,
  Building2,
  User,
  CheckCircle2,
} from 'lucide-react'

interface EscrowRecord {
  id: string
  amount: number
  service_fee: number
  status: string
  created_at: string
  released_at?: string
  job_id: string
  freelancer_id: string
  client_id: string
  jobs?: { id: string; title: string } | null
  freelancer?: { full_name: string; email: string; phone: string; county: string } | null
  client?: { full_name: string; email: string; phone: string; county: string } | null
}

interface InvoiceData {
  invoiceNumber: string
  date: string
  dueDate: string
  from: { name: string; email: string; phone: string; county: string }
  to: { name: string; email: string; phone: string; county: string }
  project: string
  amount: number
  serviceFee: number
  vat: number
  netAmount: number
  status: string
  escrowId: string
}

export default function InvoicesPage() {
  const { profile } = useAuth()
  const [escrows, setEscrows] = useState<EscrowRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  const fetchEscrows = useCallback(async () => {
    try {
      const res = await fetch('/api/escrow')
      const data = await res.json()
      if (data.escrows) {
        setEscrows(data.escrows.filter((e: EscrowRecord) => e.status === 'Released' || e.status === 'Completed'))
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchEscrows() }, [fetchEscrows])

  const generateInvoice = (escrow: EscrowRecord): InvoiceData => {
    const isFreelancer = profile?.role === 'Freelancer'
    const serviceFee = escrow.service_fee || escrow.amount * 0.06
    const vatRate = 0.16
    const vat = serviceFee * vatRate
    const netAmount = escrow.amount - serviceFee - vat

    const date = escrow.released_at || escrow.created_at
    const invoiceNumber = `INV-${new Date(date).getFullYear()}-${escrow.id.slice(0, 8).toUpperCase()}`

    return {
      invoiceNumber,
      date: new Date(date).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' }),
      dueDate: 'Paid',
      from: isFreelancer
        ? { name: escrow.freelancer?.full_name || profile?.full_name || '', email: escrow.freelancer?.email || profile?.email || '', phone: escrow.freelancer?.phone || profile?.phone || '', county: escrow.freelancer?.county || profile?.county || '' }
        : { name: escrow.client?.full_name || '', email: escrow.client?.email || '', phone: escrow.client?.phone || '', county: escrow.client?.county || '' },
      to: isFreelancer
        ? { name: escrow.client?.full_name || 'Client', email: escrow.client?.email || '', phone: escrow.client?.phone || '', county: escrow.client?.county || '' }
        : { name: escrow.freelancer?.full_name || 'Freelancer', email: escrow.freelancer?.email || '', phone: escrow.freelancer?.phone || '', county: escrow.freelancer?.county || '' },
      project: escrow.jobs?.title || 'Project',
      amount: escrow.amount,
      serviceFee,
      vat,
      netAmount,
      status: escrow.status,
      escrowId: escrow.id,
    }
  }

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <html><head><title>Invoice</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #111; }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .logo { font-size: 24px; font-weight: bold; color: #16a34a; }
            .invoice-num { color: #666; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #eee; }
            th { background: #f9fafb; font-size: 12px; text-transform: uppercase; color: #666; }
            .total { font-weight: bold; font-size: 18px; }
            .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
            .paid { background: #dcfce7; color: #16a34a; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; text-align: center; }
          </style></head><body>
          ${printRef.current.innerHTML}
          </body></html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    }
  }

  const handleDownloadCSV = () => {
    const invoices = escrows.map(e => generateInvoice(e))
    const headers = ['Invoice #', 'Date', 'Project', 'Gross Amount', 'Service Fee', 'VAT', 'Net Amount', 'Status']
    const rows = invoices.map(inv => [
      inv.invoiceNumber, inv.date, inv.project,
      inv.amount.toString(), inv.serviceFee.toFixed(2), inv.vat.toFixed(2),
      inv.netAmount.toFixed(2), inv.status,
    ])
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hustleke-invoices-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-6 xl:p-8 animate-pulse">
        <div className="h-7 w-32 bg-gray-200 rounded-lg mb-2" />
        <div className="h-4 w-56 bg-gray-100 rounded mb-6" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 h-20" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 xl:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500 mt-0.5">Auto-generated from completed escrow payments</p>
        </div>
        {escrows.length > 0 && (
          <button
            onClick={handleDownloadCSV}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" /> Export All CSV
          </button>
        )}
      </div>

      {/* Invoices list */}
      {escrows.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase">Invoice #</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase">Date</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase hidden sm:table-cell">Project</th>
                  <th className="text-right px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase">Amount</th>
                  <th className="text-right px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase hidden md:table-cell">Net</th>
                  <th className="text-center px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-right px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {escrows.map(escrow => {
                  const inv = generateInvoice(escrow)
                  return (
                    <tr key={escrow.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono font-medium text-gray-900">{inv.invoiceNumber}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{inv.date}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 truncate max-w-[200px] hidden sm:table-cell">{inv.project}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right whitespace-nowrap">KES {inv.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600 text-right whitespace-nowrap hidden md:table-cell">KES {inv.netAmount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                          <CheckCircle2 className="w-3 h-3" /> Paid
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="text-green-600 hover:text-green-700 text-xs font-medium"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Receipt className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <h3 className="font-bold text-gray-900 mb-1">No invoices yet</h3>
          <p className="text-sm text-gray-500">Invoices are automatically generated when escrow payments are completed.</p>
        </div>
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
              <h3 className="font-bold text-gray-900">{selectedInvoice.invoiceNumber}</h3>
              <div className="flex items-center gap-2">
                <button onClick={handlePrint} className="text-gray-500 hover:text-green-600 p-2 rounded-lg hover:bg-gray-100">
                  <Printer className="w-4 h-4" />
                </button>
                <button onClick={() => setSelectedInvoice(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div ref={printRef} className="p-6">
              {/* Invoice header */}
              <div className="flex items-start justify-between mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">H</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">HustleKE</span>
                  </div>
                  <p className="text-xs text-gray-400">Kenya&apos;s Freelance Marketplace</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">INVOICE</p>
                  <p className="font-mono font-bold text-gray-900">{selectedInvoice.invoiceNumber}</p>
                  <p className="text-xs text-gray-500 mt-1">{selectedInvoice.date}</p>
                  <span className="inline-block mt-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-100 text-green-700">Paid</span>
                </div>
              </div>

              {/* From / To */}
              <div className="grid sm:grid-cols-2 gap-6 mb-8">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-semibold mb-2">From</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedInvoice.from.name}</p>
                  {selectedInvoice.from.email && <p className="text-xs text-gray-500">{selectedInvoice.from.email}</p>}
                  {selectedInvoice.from.phone && <p className="text-xs text-gray-500">{selectedInvoice.from.phone}</p>}
                  {selectedInvoice.from.county && <p className="text-xs text-gray-500">{selectedInvoice.from.county}, Kenya</p>}
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-semibold mb-2">To</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedInvoice.to.name}</p>
                  {selectedInvoice.to.email && <p className="text-xs text-gray-500">{selectedInvoice.to.email}</p>}
                  {selectedInvoice.to.phone && <p className="text-xs text-gray-500">{selectedInvoice.to.phone}</p>}
                  {selectedInvoice.to.county && <p className="text-xs text-gray-500">{selectedInvoice.to.county}, Kenya</p>}
                </div>
              </div>

              {/* Line items */}
              <table className="w-full mb-6">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-[10px] font-semibold text-gray-400 uppercase">Description</th>
                    <th className="text-right py-2 text-[10px] font-semibold text-gray-400 uppercase">Amount (KES)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-3 text-sm text-gray-900">{selectedInvoice.project}</td>
                    <td className="py-3 text-sm text-gray-900 text-right">{selectedInvoice.amount.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-sm text-gray-500">Service Fee</td>
                    <td className="py-3 text-sm text-red-500 text-right">-{selectedInvoice.serviceFee.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-sm text-gray-500">VAT (16%)</td>
                    <td className="py-3 text-sm text-red-500 text-right">-{selectedInvoice.vat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-900">
                    <td className="py-3 text-sm font-bold text-gray-900">Net Amount</td>
                    <td className="py-3 text-lg font-bold text-green-600 text-right">KES {selectedInvoice.netAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tfoot>
              </table>

              {/* Footer */}
              <div className="border-t border-gray-200 pt-4 text-center">
                <p className="text-[10px] text-gray-400">Payment processed via HustleKE M-Pesa Escrow</p>
                <p className="text-[10px] text-gray-400">Escrow ID: {selectedInvoice.escrowId}</p>
                <p className="text-[10px] text-gray-400 mt-1">HustleKE — www.hustleke.com</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
