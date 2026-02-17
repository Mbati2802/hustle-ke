import { NextRequest } from 'next/server'
import { requireAdmin, errorResponse } from '@/lib/api-utils'

// GET /api/admin/export?type=users|jobs|transactions&format=csv|json
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const url = new URL(req.url)
  const type = url.searchParams.get('type')
  const format = url.searchParams.get('format') || 'csv'

  if (!type || !['users', 'jobs', 'transactions', 'disputes', 'reviews'].includes(type)) {
    return errorResponse('Invalid export type. Must be: users, jobs, transactions, disputes, or reviews')
  }

  if (!['csv', 'json'].includes(format)) {
    return errorResponse('Invalid format. Must be: csv or json')
  }

  try {
    let data: any[] = []
    let filename = ''

    switch (type) {
      case 'users':
        const { data: users } = await auth.adminDb
          .from('profiles')
          .select('id, full_name, email, role, verification_status, hustle_score, created_at, is_banned')
          .order('created_at', { ascending: false })
          .limit(10000)
        data = users || []
        filename = `users_export_${Date.now()}`
        break

      case 'jobs':
        const { data: jobs } = await auth.adminDb
          .from('jobs')
          .select('id, title, status, budget_min, budget_max, client:profiles!client_id(full_name), created_at')
          .order('created_at', { ascending: false })
          .limit(10000)
        data = jobs || []
        filename = `jobs_export_${Date.now()}`
        break

      case 'transactions':
        const { data: transactions } = await auth.adminDb
          .from('wallet_transactions')
          .select('id, amount, type, status, created_at, wallet:wallets!wallet_id(user:profiles!user_id(full_name))')
          .order('created_at', { ascending: false })
          .limit(10000)
        data = transactions || []
        filename = `transactions_export_${Date.now()}`
        break

      case 'disputes':
        const { data: disputes } = await auth.adminDb
          .from('disputes')
          .select('id, reason, status, created_at, initiator:profiles!initiator_id(full_name), respondent:profiles!respondent_id(full_name)')
          .order('created_at', { ascending: false })
          .limit(10000)
        data = disputes || []
        filename = `disputes_export_${Date.now()}`
        break

      case 'reviews':
        const { data: reviews } = await auth.adminDb
          .from('reviews')
          .select('id, rating, comment, created_at, reviewer:profiles!reviewer_id(full_name), reviewee:profiles!reviewee_id(full_name)')
          .order('created_at', { ascending: false })
          .limit(10000)
        data = reviews || []
        filename = `reviews_export_${Date.now()}`
        break
    }

    if (format === 'json') {
      return new Response(JSON.stringify(data, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}.json"`
        }
      })
    }

    // CSV format
    if (data.length === 0) {
      return new Response('No data to export', {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`
        }
      })
    }

    // Flatten nested objects for CSV
    const flatData = data.map(row => {
      const flat: Record<string, any> = {}
      Object.entries(row).forEach(([key, value]) => {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          // Flatten nested object
          Object.entries(value).forEach(([nestedKey, nestedValue]) => {
            flat[`${key}_${nestedKey}`] = nestedValue
          })
        } else {
          flat[key] = value
        }
      })
      return flat
    })

    // Generate CSV
    const headers = Object.keys(flatData[0])
    const csvRows = [
      headers.join(','),
      ...flatData.map(row =>
        headers.map(header => {
          const value = row[header]
          // Escape commas and quotes
          if (value === null || value === undefined) return ''
          const str = String(value)
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`
          }
          return str
        }).join(',')
      )
    ]

    return new Response(csvRows.join('\n'), {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}.csv"`
      }
    })
  } catch (error) {
    console.error('[Admin Export] Error:', error)
    return errorResponse('Failed to export data', 500)
  }
}
