// Input validation & sanitization for all API routes

type ValidationRule = {
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  isEmail?: boolean
  isPhone?: boolean
  isUUID?: boolean
  isArray?: boolean
  arrayItemType?: 'string' | 'number'
  maxArrayLength?: number
  enum?: readonly string[]
  custom?: (value: unknown) => string | null
}

type ValidationSchema = Record<string, ValidationRule>

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string> }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_KE_RE = /^(?:\+254|0)?[17]\d{8}$/

function sanitizeString(value: string): string {
  return value
    .replace(/[<>]/g, '') // Strip angle brackets (basic XSS prevention)
    .trim()
}

export function validate<T extends Record<string, unknown>>(
  data: Record<string, unknown>,
  schema: ValidationSchema
): ValidationResult<T> {
  const errors: Record<string, string> = {}
  const sanitized: Record<string, unknown> = {}

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field]

    // Required check
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors[field] = `${field} is required`
      continue
    }

    // Skip fields not present in request
    if (value === undefined) {
      continue
    }

    // Allow null to clear optional fields
    if (value === null || value === '') {
      if (!rules.required) {
        sanitized[field] = null
      }
      continue
    }

    // String validations
    if (typeof value === 'string') {
      const clean = sanitizeString(value)

      if (rules.minLength && clean.length < rules.minLength) {
        errors[field] = `${field} must be at least ${rules.minLength} characters`
        continue
      }
      if (rules.maxLength && clean.length > rules.maxLength) {
        errors[field] = `${field} must be at most ${rules.maxLength} characters`
        continue
      }
      if (rules.pattern && !rules.pattern.test(clean)) {
        errors[field] = `${field} has an invalid format`
        continue
      }
      if (rules.isEmail && !EMAIL_RE.test(clean)) {
        errors[field] = 'Invalid email address'
        continue
      }
      if (rules.isPhone && !PHONE_KE_RE.test(clean.replace(/\s/g, ''))) {
        errors[field] = 'Invalid Kenyan phone number (e.g. 0712345678 or +254712345678)'
        continue
      }
      if (rules.isUUID && !UUID_RE.test(clean)) {
        errors[field] = `${field} must be a valid UUID`
        continue
      }
      if (rules.enum && !rules.enum.includes(clean)) {
        errors[field] = `${field} must be one of: ${rules.enum.join(', ')}`
        continue
      }

      sanitized[field] = clean
    }
    // Number validations
    else if (typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        errors[field] = `${field} must be at least ${rules.min}`
        continue
      }
      if (rules.max !== undefined && value > rules.max) {
        errors[field] = `${field} must be at most ${rules.max}`
        continue
      }
      sanitized[field] = value
    }
    // Boolean
    else if (typeof value === 'boolean') {
      sanitized[field] = value
    }
    // Array validations
    else if (Array.isArray(value)) {
      if (!rules.isArray) {
        errors[field] = `${field} should not be an array`
        continue
      }
      if (rules.maxArrayLength && value.length > rules.maxArrayLength) {
        errors[field] = `${field} can have at most ${rules.maxArrayLength} items`
        continue
      }
      if (rules.arrayItemType) {
        const allValid = value.every((item) => typeof item === rules.arrayItemType)
        if (!allValid) {
          errors[field] = `All items in ${field} must be of type ${rules.arrayItemType}`
          continue
        }
      }
      sanitized[field] = rules.arrayItemType === 'string'
        ? value.map((v: string) => sanitizeString(String(v)))
        : value
    }

    // Custom validation
    if (rules.custom) {
      const err = rules.custom(sanitized[field] ?? value)
      if (err) {
        errors[field] = err
        continue
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }

  return { success: true, data: sanitized as T }
}

// Common schemas
export const signupSchema: ValidationSchema = {
  email: { required: true, isEmail: true, maxLength: 255 },
  password: { required: true, minLength: 8, maxLength: 128 },
  full_name: { required: true, minLength: 2, maxLength: 100 },
  role: { enum: ['Freelancer', 'Client'] as const },
}

export const loginSchema: ValidationSchema = {
  email: { required: true, isEmail: true },
  password: { required: true, minLength: 1 },
}

export const profileUpdateSchema: ValidationSchema = {
  full_name: { minLength: 2, maxLength: 100 },
  bio: { maxLength: 5000 },
  title: { maxLength: 150 },
  phone: { isPhone: true },
  location: { maxLength: 100 },
  county: { maxLength: 50 },
  skills: { isArray: true, arrayItemType: 'string', maxArrayLength: 20 },
  hourly_rate: { min: 0, max: 100000 },
  mpesa_phone: { isPhone: true },
  languages: { isArray: true, arrayItemType: 'string', maxArrayLength: 10 },
  swahili_speaking: {},
  years_experience: { min: 0, max: 50 },
  availability: { enum: ['available', 'busy', 'unavailable', 'available_from'] as const },
  available_from: { maxLength: 10 },
  education: { isArray: true, maxArrayLength: 20 },
  certifications: { isArray: true, maxArrayLength: 20 },
}

export const jobCreateSchema: ValidationSchema = {
  title: { required: true, minLength: 5, maxLength: 200 },
  description: { required: true, minLength: 20, maxLength: 10000 },
  budget_min: { required: true, min: 100, max: 10000000 },
  budget_max: { required: true, min: 100, max: 10000000 },
  payment_type: { enum: ['Fixed', 'Hourly', 'Milestone'] as const },
  skills_required: { isArray: true, arrayItemType: 'string', maxArrayLength: 15 },
  tags: { isArray: true, arrayItemType: 'string', maxArrayLength: 10 },
  location_preference: { maxLength: 100 },
  remote_allowed: {},
  requires_verified_only: {},
  requires_swahili: {},
  min_hustle_score: { min: 0, max: 100 },
  deadline: { maxLength: 30 },
  organization_id: { isUUID: true },
}

export const proposalCreateSchema: ValidationSchema = {
  job_id: { required: true, isUUID: true },
  cover_letter: { required: true, minLength: 50, maxLength: 5000 },
  bid_amount: { required: true, min: 100, max: 10000000 },
  estimated_duration_days: { min: 1, max: 365 },
}

export const messageSchema: ValidationSchema = {
  job_id: { required: true, isUUID: true },
  receiver_id: { required: true, isUUID: true },
  content: { required: true, minLength: 1, maxLength: 5000 },
  organization_id: { isUUID: true },
}

export const reviewSchema: ValidationSchema = {
  job_id: { required: true, isUUID: true },
  reviewee_id: { required: true, isUUID: true },
  rating: { required: true, min: 1, max: 5 },
  comment: { maxLength: 2000 },
  communication_rating: { min: 1, max: 5 },
  quality_rating: { min: 1, max: 5 },
  timeliness_rating: { min: 1, max: 5 },
}

export const forgotPasswordSchema: ValidationSchema = {
  email: { required: true, isEmail: true },
}

export const resetPasswordSchema: ValidationSchema = {
  password: { required: true, minLength: 8, maxLength: 128 },
}
