// Utility functions for ticket management

/**
 * Generate a short, user-friendly ticket code from a UUID
 * Format: XX170226#0001
 * Where:
 * - XX = First 2 letters of user's name (uppercase)
 * - 170226 = DDMMYY date format
 * - 0001 = Last 4 digits of UUID
 * 
 * @param ticketId - The full UUID of the ticket
 * @param userName - The user's full name
 * @returns A short ticket code (e.g., "SM170226#0001")
 */
export function generateShortTicketCode(ticketId: string, userName: string): string {
  // Extract initials from user name (first 2 letters of first name)
  const initials = userName
    .trim()
    .split(' ')[0]
    .substring(0, 2)
    .toUpperCase()
  
  // Get current date in DDMMYY format
  const now = new Date()
  const day = String(now.getDate()).padStart(2, '0')
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = String(now.getFullYear()).substring(2)
  const dateCode = `${day}${month}${year}`
  
  // Extract last 4 characters from UUID (removing hyphens first)
  const uuidDigits = ticketId.replace(/-/g, '')
  const uniqueCode = uuidDigits.substring(uuidDigits.length - 4)
  
  return `${initials}${dateCode}#${uniqueCode}`
}

/**
 * Format ticket ID for display
 * Shows short code to users, but stores full UUID in database
 * 
 * @param ticketId - The full UUID of the ticket
 * @param userName - The user's full name
 * @returns Formatted ticket display string
 */
export function formatTicketForDisplay(ticketId: string, userName: string): string {
  const shortCode = generateShortTicketCode(ticketId, userName)
  return `Ticket: ${shortCode}`
}
