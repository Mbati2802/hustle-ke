import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { errorResponse, jsonResponse } from '@/lib/api-utils'

// POST /api/auth/send-verification — Send email verification
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    
    if (!email) {
      return errorResponse('Email is required', 400)
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email`
      }
    })

    if (error) {
      return errorResponse(error.message || 'Failed to send verification email', 400)
    }

    return jsonResponse({ 
      success: true, 
      message: 'Verification email sent. Please check your inbox.' 
    })
  } catch (error) {
    return errorResponse('Internal server error', 500)
  }
}
