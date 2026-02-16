import { NextRequest } from 'next/server'
import { requireAuth, errorResponse } from '@/lib/api-utils'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import ExcelJS from 'exceljs'

// GET /api/reports/financial?format=pdf|excel&organization_id=xxx
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const url = new URL(req.url)
  const format = url.searchParams.get('format') || 'pdf'
  const orgId = url.searchParams.get('organization_id')

  // ── Gather all financial data ──────────────────────────────────────

  let escrows: Record<string, unknown>[] = []
  let walletTransactions: Record<string, unknown>[] = []
  let walletBalance = 0
  let reportTitle = ''
  let reportSubtitle = ''
  let entityName = auth.profile.full_name || 'User'
  let entityEmail = ''

  if (orgId) {
    // Verify org membership
    const { data: mem } = await auth.adminDb
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', auth.profile.id)
      .single()
    if (!mem) return errorResponse('Not an organization member', 403)

    // Get org info
    const { data: org } = await auth.adminDb
      .from('organizations')
      .select('id, name, slug, industry, owner_id')
      .eq('id', orgId)
      .single()
    if (!org) return errorResponse('Organization not found', 404)

    entityName = org.name
    reportTitle = `${org.name} — Financial Report`
    reportSubtitle = `Organization Financial Statement`

    // Org escrows (via org jobs)
    const { data: orgJobs } = await auth.adminDb.from('jobs').select('id').eq('organization_id', orgId)
    const orgJobIds = (orgJobs || []).map((j: { id: string }) => j.id)

    if (orgJobIds.length > 0) {
      const { data: esc } = await auth.adminDb
        .from('escrow_transactions')
        .select('*, job:jobs!job_id(id, title, status), client:profiles!client_id(id, full_name), freelancer:profiles!freelancer_id(id, full_name)')
        .in('job_id', orgJobIds)
        .order('initiated_at', { ascending: false })
      escrows = esc || []
    }

    // Org wallet transactions
    const { data: orgWallet } = await auth.adminDb
      .from('organization_wallets')
      .select('id, balance')
      .eq('organization_id', orgId)
      .single()

    if (orgWallet) {
      walletBalance = orgWallet.balance || 0
      const { data: txns } = await auth.adminDb
        .from('organization_wallet_transactions')
        .select('*, job:jobs!job_id(id, title)')
        .eq('wallet_id', orgWallet.id)
        .order('created_at', { ascending: false })
      walletTransactions = txns || []
    }
  } else {
    // Personal report
    reportTitle = `${auth.profile.full_name} — Financial Report`
    reportSubtitle = `Personal Financial Statement`

    // Get user email
    const { data: { user: authUser } } = await auth.adminDb.auth.getUser()
    entityEmail = authUser?.email || ''

    // Personal escrows
    const { data: esc } = await auth.adminDb
      .from('escrow_transactions')
      .select('*, job:jobs!job_id(id, title, status), client:profiles!client_id(id, full_name), freelancer:profiles!freelancer_id(id, full_name)')
      .or(`client_id.eq.${auth.profile.id},freelancer_id.eq.${auth.profile.id}`)
      .order('initiated_at', { ascending: false })
    escrows = esc || []

    // Personal wallet
    const { data: wallet } = await auth.adminDb
      .from('wallets')
      .select('id, balance')
      .eq('user_id', auth.profile.id)
      .single()

    if (wallet) {
      walletBalance = wallet.balance || 0
      const { data: txns } = await auth.adminDb
        .from('wallet_transactions')
        .select('*, job:jobs!job_id(id, title)')
        .eq('wallet_id', wallet.id)
        .order('created_at', { ascending: false })
      walletTransactions = txns || []
    }
  }

  // ── Compute summaries ──────────────────────────────────────────────

  const now = new Date()
  const reportDate = now.toLocaleDateString('en-KE', { dateStyle: 'long' })
  const reportTime = now.toLocaleTimeString('en-KE', { timeStyle: 'short' })

  const escrowHeld = escrows.filter((e: any) => e.status === 'Held')
  const escrowReleased = escrows.filter((e: any) => e.status === 'Released')
  const escrowRefunded = escrows.filter((e: any) => e.status === 'Refunded')
  const escrowPending = escrows.filter((e: any) => e.status === 'Pending')

  const totalHeld = escrowHeld.reduce((s: number, e: any) => s + (e.amount || 0), 0)
  const totalReleased = escrowReleased.reduce((s: number, e: any) => s + (e.amount || 0), 0)
  const totalRefunded = escrowRefunded.reduce((s: number, e: any) => s + (e.amount || 0), 0)
  const totalFees = escrowReleased.reduce((s: number, e: any) => s + (e.service_fee || 0) + (e.tax_amount || 0), 0)
  const totalPending = escrowPending.reduce((s: number, e: any) => s + (e.amount || 0), 0)

  const deposits = walletTransactions.filter((t: any) => t.type === 'Deposit' || t.type === 'M-Pesa')
  const withdrawals = walletTransactions.filter((t: any) => t.type === 'Withdrawal')
  const totalDeposits = deposits.reduce((s: number, t: any) => s + Math.abs(t.amount || 0), 0)
  const totalWithdrawals = withdrawals.reduce((s: number, t: any) => s + Math.abs(t.amount || 0), 0)

  const fmtKES = (n: number) => `KES ${n.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
  const fmtDateTime = (d: string) => d ? new Date(d).toLocaleString('en-KE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
  const shortId = (id: string) => id ? id.slice(0, 8).toUpperCase() : '—'

  // ── Generate PDF ───────────────────────────────────────────────────

  if (format === 'pdf') {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const margin = 15
    let y = 15

    const addHeader = () => {
      // Green header bar
      doc.setFillColor(22, 163, 74) // green-600
      doc.rect(0, 0, pageW, 32, 'F')

      // Logo text
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('HustleKE', margin, 14)

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text('Secure Freelance Marketplace', margin, 20)

      // Report title on right
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('FINANCIAL REPORT', pageW - margin, 14, { align: 'right' })
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text(`Generated: ${reportDate} at ${reportTime}`, pageW - margin, 20, { align: 'right' })
      doc.text(`Ref: FR-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`, pageW - margin, 25, { align: 'right' })

      y = 38
    }

    const addSectionTitle = (title: string) => {
      if (y > 260) { doc.addPage(); addHeader() }
      doc.setFillColor(243, 244, 246) // gray-100
      doc.rect(margin, y, pageW - margin * 2, 8, 'F')
      doc.setTextColor(17, 24, 39) // gray-900
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(title, margin + 3, y + 5.5)
      y += 12
    }

    const addKeyValue = (key: string, value: string, bold = false) => {
      if (y > 275) { doc.addPage(); addHeader() }
      doc.setTextColor(107, 114, 128) // gray-500
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text(key, margin + 3, y)
      doc.setTextColor(17, 24, 39)
      doc.setFont('helvetica', bold ? 'bold' : 'normal')
      doc.text(value, margin + 60, y)
      y += 5
    }

    const addFooter = (pageNum: number) => {
      const pageH = doc.internal.pageSize.getHeight()
      doc.setDrawColor(229, 231, 235)
      doc.line(margin, pageH - 15, pageW - margin, pageH - 15)
      doc.setTextColor(156, 163, 175)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.text('This is a system-generated financial report from HustleKE. For queries, contact support@hustleke.co.ke', margin, pageH - 10)
      doc.text(`Page ${pageNum}`, pageW - margin, pageH - 10, { align: 'right' })
    }

    // ── Page 1: Cover + Summary ──
    addHeader()

    // Entity info box
    doc.setFillColor(249, 250, 251)
    doc.setDrawColor(229, 231, 235)
    doc.roundedRect(margin, y, pageW - margin * 2, orgId ? 20 : 24, 3, 3, 'FD')
    doc.setTextColor(17, 24, 39)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(entityName, margin + 5, y + 7)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(107, 114, 128)
    doc.text(reportSubtitle, margin + 5, y + 13)
    if (entityEmail) {
      doc.text(entityEmail, margin + 5, y + 18)
      y += 28
    } else {
      y += 24
    }

    // ── Financial Summary ──
    addSectionTitle('FINANCIAL SUMMARY')

    // Summary grid
    const summaryData = [
      ['Current Wallet Balance', fmtKES(walletBalance)],
      ['Total Deposits (M-Pesa)', fmtKES(totalDeposits)],
      ['Total Withdrawals', fmtKES(totalWithdrawals)],
      ['', ''],
      ['Escrow — Currently Held', fmtKES(totalHeld)],
      ['Escrow — Total Released', fmtKES(totalReleased)],
      ['Escrow — Total Refunded', fmtKES(totalRefunded)],
      ['Escrow — Pending', fmtKES(totalPending)],
      ['Total Service Fees & Tax Paid', fmtKES(totalFees)],
    ]

    for (const [key, value] of summaryData) {
      if (!key) { y += 2; continue }
      addKeyValue(key, value, key.includes('Balance'))
    }

    y += 5

    // ── Escrow Transactions Table ──
    addSectionTitle(`ESCROW TRANSACTIONS (${escrows.length})`)

    if (escrows.length > 0) {
      const escrowRows = escrows.map((e: any) => [
        shortId(e.id),
        (e.job?.title || 'Untitled').slice(0, 25),
        e.status,
        fmtKES(e.amount || 0),
        fmtKES(e.service_fee || 0),
        fmtKES(e.tax_amount || 0),
        (e.freelancer?.full_name || '—').slice(0, 18),
        fmtDate(e.initiated_at),
        e.released_at ? fmtDate(e.released_at) : '—',
      ])

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['Ref', 'Job', 'Status', 'Amount', 'Fee', 'Tax', 'Freelancer', 'Created', 'Released']],
        body: escrowRows,
        styles: { fontSize: 6.5, cellPadding: 1.5, textColor: [17, 24, 39] },
        headStyles: { fillColor: [22, 163, 74], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 6.5 },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles: {
          0: { cellWidth: 16 },
          1: { cellWidth: 30 },
          2: { cellWidth: 14 },
          3: { cellWidth: 22, halign: 'right' },
          4: { cellWidth: 18, halign: 'right' },
          5: { cellWidth: 18, halign: 'right' },
          6: { cellWidth: 22 },
          7: { cellWidth: 20 },
          8: { cellWidth: 20 },
        },
        didDrawPage: () => { y = (doc as any).lastAutoTable?.finalY || y },
      })
      y = (doc as any).lastAutoTable?.finalY + 8 || y + 8
    } else {
      doc.setTextColor(156, 163, 175)
      doc.setFontSize(8)
      doc.text('No escrow transactions found.', margin + 3, y)
      y += 8
    }

    // ── Wallet Deposits Table ──
    if (y > 240) { doc.addPage(); addHeader() }
    addSectionTitle(`DEPOSITS & TOP-UPS (${deposits.length})`)

    if (deposits.length > 0) {
      const depositRows = deposits.map((t: any) => [
        shortId(t.id),
        t.type || 'Deposit',
        fmtKES(Math.abs(t.amount || 0)),
        t.description || '—',
        t.metadata?.mpesa_receipt || t.metadata?.receipt_number || '—',
        fmtDateTime(t.created_at),
      ])

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['Ref', 'Type', 'Amount', 'Description', 'M-Pesa Receipt', 'Date & Time']],
        body: depositRows,
        styles: { fontSize: 7, cellPadding: 1.5, textColor: [17, 24, 39] },
        headStyles: { fillColor: [22, 163, 74], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles: {
          0: { cellWidth: 18 },
          1: { cellWidth: 18 },
          2: { cellWidth: 25, halign: 'right' },
          3: { cellWidth: 40 },
          4: { cellWidth: 28 },
          5: { cellWidth: 32 },
        },
      })
      y = (doc as any).lastAutoTable?.finalY + 8 || y + 8
    } else {
      doc.setTextColor(156, 163, 175)
      doc.setFontSize(8)
      doc.text('No deposits found.', margin + 3, y)
      y += 8
    }

    // ── Wallet Withdrawals Table ──
    if (y > 240) { doc.addPage(); addHeader() }
    addSectionTitle(`WITHDRAWALS (${withdrawals.length})`)

    if (withdrawals.length > 0) {
      const withdrawalRows = withdrawals.map((t: any) => [
        shortId(t.id),
        fmtKES(Math.abs(t.amount || 0)),
        t.description || '—',
        t.metadata?.phone_number || '—',
        t.metadata?.mpesa_receipt || '—',
        fmtDateTime(t.created_at),
      ])

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['Ref', 'Amount', 'Description', 'Phone', 'M-Pesa Receipt', 'Date & Time']],
        body: withdrawalRows,
        styles: { fontSize: 7, cellPadding: 1.5, textColor: [17, 24, 39] },
        headStyles: { fillColor: [22, 163, 74], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles: {
          0: { cellWidth: 18 },
          1: { cellWidth: 25, halign: 'right' },
          2: { cellWidth: 40 },
          3: { cellWidth: 28 },
          4: { cellWidth: 28 },
          5: { cellWidth: 32 },
        },
      })
      y = (doc as any).lastAutoTable?.finalY + 8 || y + 8
    } else {
      doc.setTextColor(156, 163, 175)
      doc.setFontSize(8)
      doc.text('No withdrawals found.', margin + 3, y)
      y += 8
    }

    // ── All Wallet Transactions Table ──
    if (y > 220) { doc.addPage(); addHeader() }
    addSectionTitle(`ALL WALLET TRANSACTIONS (${walletTransactions.length})`)

    if (walletTransactions.length > 0) {
      const txRows = walletTransactions.map((t: any) => [
        shortId(t.id),
        t.type || '—',
        (t.amount || 0) >= 0 ? fmtKES(t.amount) : `(${fmtKES(Math.abs(t.amount))})`,
        (t.job?.title || '—').slice(0, 22),
        t.description || '—',
        fmtDateTime(t.created_at),
      ])

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['Ref', 'Type', 'Amount', 'Job', 'Description', 'Date & Time']],
        body: txRows,
        styles: { fontSize: 7, cellPadding: 1.5, textColor: [17, 24, 39] },
        headStyles: { fillColor: [22, 163, 74], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles: {
          0: { cellWidth: 18 },
          1: { cellWidth: 20 },
          2: { cellWidth: 25, halign: 'right' },
          3: { cellWidth: 28 },
          4: { cellWidth: 42 },
          5: { cellWidth: 32 },
        },
      })
    }

    // Add footers to all pages
    const totalPages = (doc as any).getNumberOfPages?.() || (doc.internal as any).getNumberOfPages?.() || 1
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      addFooter(i)
    }

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    const filename = orgId
      ? `HustleKE_Org_Financial_Report_${now.toISOString().slice(0, 10)}.pdf`
      : `HustleKE_Financial_Report_${now.toISOString().slice(0, 10)}.pdf`

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  }

  // ── Generate Excel ─────────────────────────────────────────────────

  if (format === 'excel') {
    const wb = new ExcelJS.Workbook()
    wb.creator = 'HustleKE'
    wb.created = now

    const greenFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF16A34A' } }
    const lightGrayFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } }
    const headerFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
    const titleFont: Partial<ExcelJS.Font> = { bold: true, size: 14, color: { argb: 'FF16A34A' } }
    const subtitleFont: Partial<ExcelJS.Font> = { bold: true, size: 11, color: { argb: 'FF374151' } }
    const thinBorder: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
    }

    // ── Summary Sheet ──
    const summarySheet = wb.addWorksheet('Summary', { properties: { tabColor: { argb: 'FF16A34A' } } })
    summarySheet.columns = [
      { width: 35 },
      { width: 30 },
      { width: 20 },
    ]

    // Title
    summarySheet.mergeCells('A1:C1')
    const titleCell = summarySheet.getCell('A1')
    titleCell.value = 'HustleKE Financial Report'
    titleCell.font = titleFont

    summarySheet.mergeCells('A2:C2')
    summarySheet.getCell('A2').value = reportTitle
    summarySheet.getCell('A2').font = subtitleFont

    summarySheet.mergeCells('A3:C3')
    summarySheet.getCell('A3').value = `Generated: ${reportDate} at ${reportTime}`
    summarySheet.getCell('A3').font = { size: 9, color: { argb: 'FF6B7280' } }

    // Summary data
    const summaryRows = [
      ['', '', ''],
      ['FINANCIAL SUMMARY', '', ''],
      ['Current Wallet Balance', fmtKES(walletBalance), ''],
      ['Total Deposits (M-Pesa)', fmtKES(totalDeposits), `${deposits.length} transactions`],
      ['Total Withdrawals', fmtKES(totalWithdrawals), `${withdrawals.length} transactions`],
      ['', '', ''],
      ['ESCROW SUMMARY', '', ''],
      ['Escrow — Currently Held', fmtKES(totalHeld), `${escrowHeld.length} escrows`],
      ['Escrow — Total Released', fmtKES(totalReleased), `${escrowReleased.length} escrows`],
      ['Escrow — Total Refunded', fmtKES(totalRefunded), `${escrowRefunded.length} escrows`],
      ['Escrow — Pending', fmtKES(totalPending), `${escrowPending.length} escrows`],
      ['Total Service Fees & Tax', fmtKES(totalFees), ''],
      ['', '', ''],
      ['Total Escrow Transactions', String(escrows.length), ''],
      ['Total Wallet Transactions', String(walletTransactions.length), ''],
    ]

    summaryRows.forEach((row) => {
      const r = summarySheet.addRow(row)
      if (row[0] && (row[0].includes('SUMMARY') || row[0].includes('ESCROW SUMMARY'))) {
        r.font = { bold: true, size: 10, color: { argb: 'FF16A34A' } }
        r.fill = lightGrayFill
      }
      if (row[0] === 'Current Wallet Balance') {
        r.getCell(2).font = { bold: true, size: 11 }
      }
    })

    // ── Escrow Sheet ──
    const escrowSheet = wb.addWorksheet('Escrow Transactions', { properties: { tabColor: { argb: 'FF3B82F6' } } })
    const escrowHeaders = ['Reference', 'Job Title', 'Status', 'Amount (KES)', 'Service Fee (KES)', 'Tax (KES)', 'Net Amount (KES)', 'Client', 'Freelancer', 'Created Date', 'Released Date', 'Job Status']
    const escrowHeaderRow = escrowSheet.addRow(escrowHeaders)
    escrowHeaderRow.eachCell(cell => {
      cell.fill = greenFill
      cell.font = headerFont
      cell.border = thinBorder
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
    })
    escrowSheet.getRow(1).height = 22

    escrowSheet.columns = [
      { width: 14 }, { width: 30 }, { width: 12 }, { width: 16 },
      { width: 16 }, { width: 14 }, { width: 16 }, { width: 22 },
      { width: 22 }, { width: 18 }, { width: 18 }, { width: 14 },
    ]

    escrows.forEach((e: any, idx: number) => {
      const net = (e.amount || 0) - (e.service_fee || 0) - (e.tax_amount || 0)
      const row = escrowSheet.addRow([
        shortId(e.id),
        e.job?.title || 'Untitled',
        e.status,
        e.amount || 0,
        e.service_fee || 0,
        e.tax_amount || 0,
        net,
        e.client?.full_name || '—',
        e.freelancer?.full_name || '—',
        fmtDateTime(e.initiated_at),
        e.released_at ? fmtDateTime(e.released_at) : '—',
        e.job?.status || '—',
      ])
      if (idx % 2 === 1) row.fill = lightGrayFill
      row.eachCell(cell => { cell.border = thinBorder })
      // Format currency columns
      ;[4, 5, 6, 7].forEach(col => {
        row.getCell(col).numFmt = '#,##0.00'
      })
    })

    // Auto-filter
    escrowSheet.autoFilter = { from: 'A1', to: 'L1' }

    // ── Deposits Sheet ──
    const depositSheet = wb.addWorksheet('Deposits', { properties: { tabColor: { argb: 'FF22C55E' } } })
    const depositHeaders = ['Reference', 'Type', 'Amount (KES)', 'Description', 'M-Pesa Receipt', 'Phone Number', 'Date & Time']
    const depositHeaderRow = depositSheet.addRow(depositHeaders)
    depositHeaderRow.eachCell(cell => {
      cell.fill = greenFill
      cell.font = headerFont
      cell.border = thinBorder
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
    })
    depositSheet.getRow(1).height = 22

    depositSheet.columns = [
      { width: 14 }, { width: 16 }, { width: 18 }, { width: 35 },
      { width: 20 }, { width: 18 }, { width: 22 },
    ]

    deposits.forEach((t: any, idx: number) => {
      const row = depositSheet.addRow([
        shortId(t.id),
        t.type || 'Deposit',
        Math.abs(t.amount || 0),
        t.description || '—',
        t.metadata?.mpesa_receipt || t.metadata?.receipt_number || '—',
        t.metadata?.phone_number || '—',
        fmtDateTime(t.created_at),
      ])
      if (idx % 2 === 1) row.fill = lightGrayFill
      row.eachCell(cell => { cell.border = thinBorder })
      row.getCell(3).numFmt = '#,##0.00'
    })
    depositSheet.autoFilter = { from: 'A1', to: 'G1' }

    // ── Withdrawals Sheet ──
    const withdrawalSheet = wb.addWorksheet('Withdrawals', { properties: { tabColor: { argb: 'FFEF4444' } } })
    const withdrawalHeaders = ['Reference', 'Amount (KES)', 'Description', 'Phone Number', 'M-Pesa Receipt', 'Status', 'Date & Time']
    const withdrawalHeaderRow = withdrawalSheet.addRow(withdrawalHeaders)
    withdrawalHeaderRow.eachCell(cell => {
      cell.fill = greenFill
      cell.font = headerFont
      cell.border = thinBorder
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
    })
    withdrawalSheet.getRow(1).height = 22

    withdrawalSheet.columns = [
      { width: 14 }, { width: 18 }, { width: 35 }, { width: 18 },
      { width: 20 }, { width: 14 }, { width: 22 },
    ]

    withdrawals.forEach((t: any, idx: number) => {
      const row = withdrawalSheet.addRow([
        shortId(t.id),
        Math.abs(t.amount || 0),
        t.description || '—',
        t.metadata?.phone_number || '—',
        t.metadata?.mpesa_receipt || '—',
        t.metadata?.status || 'Completed',
        fmtDateTime(t.created_at),
      ])
      if (idx % 2 === 1) row.fill = lightGrayFill
      row.eachCell(cell => { cell.border = thinBorder })
      row.getCell(2).numFmt = '#,##0.00'
    })
    withdrawalSheet.autoFilter = { from: 'A1', to: 'G1' }

    // ── All Transactions Sheet ──
    const allTxSheet = wb.addWorksheet('All Wallet Transactions', { properties: { tabColor: { argb: 'FFF59E0B' } } })
    const allTxHeaders = ['Reference', 'Type', 'Amount (KES)', 'Direction', 'Job Title', 'Description', 'Date & Time']
    const allTxHeaderRow = allTxSheet.addRow(allTxHeaders)
    allTxHeaderRow.eachCell(cell => {
      cell.fill = greenFill
      cell.font = headerFont
      cell.border = thinBorder
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
    })
    allTxSheet.getRow(1).height = 22

    allTxSheet.columns = [
      { width: 14 }, { width: 16 }, { width: 18 }, { width: 12 },
      { width: 28 }, { width: 38 }, { width: 22 },
    ]

    walletTransactions.forEach((t: any, idx: number) => {
      const amt = t.amount || 0
      const row = allTxSheet.addRow([
        shortId(t.id),
        t.type || '—',
        Math.abs(amt),
        amt >= 0 ? 'Credit' : 'Debit',
        t.job?.title || '—',
        t.description || '—',
        fmtDateTime(t.created_at),
      ])
      if (idx % 2 === 1) row.fill = lightGrayFill
      row.eachCell(cell => { cell.border = thinBorder })
      row.getCell(3).numFmt = '#,##0.00'
      // Color credit/debit
      if (amt >= 0) {
        row.getCell(4).font = { color: { argb: 'FF16A34A' }, bold: true }
      } else {
        row.getCell(4).font = { color: { argb: 'FFEF4444' }, bold: true }
      }
    })
    allTxSheet.autoFilter = { from: 'A1', to: 'G1' }

    const buffer = await wb.xlsx.writeBuffer()
    const filename = orgId
      ? `HustleKE_Org_Financial_Report_${now.toISOString().slice(0, 10)}.xlsx`
      : `HustleKE_Financial_Report_${now.toISOString().slice(0, 10)}.xlsx`

    return new Response(Buffer.from(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  }

  return errorResponse('Invalid format. Use ?format=pdf or ?format=excel', 400)
}
