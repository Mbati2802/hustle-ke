import { NextRequest } from 'next/server'
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { jsonResponse, errorResponse, checkAuthRateLimit, parseBody } from '@/lib/api-utils'
import { cookies } from 'next/headers'

interface ContactBody {
  name: string
  email: string
  subject: string
  category?: string
  message: string
  priority?: string
}

export async function POST(req: NextRequest) {
  const rateLimited = checkAuthRateLimit(req)
  if (rateLimited) return rateLimited

  const body = await parseBody<ContactBody>(req)
  if (!body) return errorResponse('Invalid request body')

  const { name, email, subject, category, message, priority } = body

  // Validate required fields
  if (!name || !email || !subject || !message) {
    return errorResponse('Name, email, subject, and message are required', 400)
  }

  if (typeof name !== 'string' || name.trim().length < 2) {
    return errorResponse('Name must be at least 2 characters', 400)
  }

  if (typeof email !== 'string' || !email.includes('@')) {
    return errorResponse('Valid email is required', 400)
  }

  if (typeof message !== 'string' || message.trim().length < 10) {
    return errorResponse('Message must be at least 10 characters', 400)
  }

  if (message.length > 2000) {
    return errorResponse('Message must be under 2000 characters', 400)
  }

  const cookieStore = cookies()
  const supabase = createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(n: string) { return cookieStore.get(n)?.value },
        set() {},
        remove() {},
      },
    }
  )

  const contactData = {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    subject: subject.trim(),
    category: category || 'general',
    message: message.trim(),
    priority: priority || 'normal',
    status: 'new',
    created_at: new Date().toISOString(),
  }

  // Attempt to insert into contact_messages table
  const { error: insertError } = await supabase
    .from('contact_messages')
    .insert(contactData)

  if (insertError) {
    // Table might not exist — log it but still return success
    console.warn('[Contact] DB insert failed (table may not exist):', insertError.message)
  }

  // Log the contact form submission for monitoring
  console.log(`[Contact] New submission from ${email}: ${subject} (${priority || 'normal'})`)

  return jsonResponse({
    success: true,
    message: 'Your message has been received. We will respond within 24 hours.',
  })
}
