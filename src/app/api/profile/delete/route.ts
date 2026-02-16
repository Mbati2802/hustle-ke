import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse } from '@/lib/api-utils'

// DELETE /api/profile/delete — permanently delete user account and all data
export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  // Check for active jobs, escrow, or disputes
  const { data: activeJobs } = await auth.adminDb
    .from('jobs')
    .select('id')
    .eq('client_id', auth.profile.id)
    .in('status', ['Open', 'In-Progress'])
    .limit(1)

  if (activeJobs && activeJobs.length > 0) {
    return errorResponse('Cannot delete account with active jobs. Please complete or cancel all jobs first.', 400)
  }

  const { data: activeEscrow } = await auth.adminDb
    .from('escrow_transactions')
    .select('id')
    .or(`client_id.eq.${auth.profile.id},freelancer_id.eq.${auth.profile.id}`)
    .in('status', ['Held', 'Disputed'])
    .limit(1)

  if (activeEscrow && activeEscrow.length > 0) {
    return errorResponse('Cannot delete account with active escrow. Please resolve all escrow transactions first.', 400)
  }

  const { data: activeDisputes } = await auth.adminDb
    .from('disputes')
    .select('id')
    .or(`initiator_id.eq.${auth.profile.id},respondent_id.eq.${auth.profile.id}`)
    .in('status', ['Open', 'Under Review'])
    .limit(1)

  if (activeDisputes && activeDisputes.length > 0) {
    return errorResponse('Cannot delete account with open disputes. Please resolve all disputes first.', 400)
  }

  // Check wallet balance
  const { data: wallet } = await auth.adminDb
    .from('wallets')
    .select('balance')
    .eq('user_id', auth.profile.id)
    .single()

  if (wallet && wallet.balance > 0) {
    return errorResponse(`Cannot delete account with wallet balance of KES ${wallet.balance}. Please withdraw all funds first.`, 400)
  }

  // All checks passed — proceed with deletion
  // Delete profile (cascade will handle related records via ON DELETE CASCADE in DB)
  const { error: deleteError } = await auth.adminDb
    .from('profiles')
    .delete()
    .eq('id', auth.profile.id)

  if (deleteError) {
    console.error('[Delete Account] Profile deletion error:', deleteError)
    return errorResponse('Failed to delete account. Please contact support.', 500)
  }

  // Delete auth user
  const { error: authDeleteError } = await auth.adminDb.auth.admin.deleteUser(auth.userId)
  if (authDeleteError) {
    console.error('[Delete Account] Auth user deletion error:', authDeleteError)
    // Profile is already deleted, so we can't roll back. Log and continue.
  }

  return jsonResponse({ success: true, message: 'Account deleted successfully' })
}
