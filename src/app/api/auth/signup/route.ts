import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { validate, signupSchema } from '@/lib/validation'
import { jsonResponse, errorResponse, validationErrorResponse, checkAuthRateLimit, parseBody } from '@/lib/api-utils'

export async function POST(req: NextRequest) {
  const rateLimited = checkAuthRateLimit(req)
  if (rateLimited) return rateLimited

  const body = await parseBody(req)
  if (!body) return errorResponse('Invalid request body')

  const result = validate<{
    email: string
    password: string
    full_name: string
    role?: string
  }>(body, signupSchema)

  if (!result.success) return validationErrorResponse(result.errors)

  const { email, password, full_name, role } = result.data
  const supabase = createAdminClient()

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
    user_metadata: { full_name, role: role || 'Freelancer' },
  })

  if (authError) {
    if (authError.message.includes('already registered')) {
      return errorResponse('An account with this email already exists', 409)
    }
    return errorResponse('Failed to create account. Please try again.', 500)
  }

  // Create profile
  const { error: profileError } = await supabase.from('profiles').insert({
    user_id: authData.user.id,
    full_name,
    email,
    role: role || 'Freelancer',
  })

  if (profileError) {
    // Rollback: delete the auth user if profile creation fails
    await supabase.auth.admin.deleteUser(authData.user.id)
    return errorResponse('Failed to create profile. Please try again.', 500)
  }

  // Create wallet for the user
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', authData.user.id)
    .single()

  if (profile) {
    await supabase.from('wallets').insert({ user_id: profile.id })
  }

  return jsonResponse({ message: 'Account created successfully. Please check your email to verify.' }, 201)
}
