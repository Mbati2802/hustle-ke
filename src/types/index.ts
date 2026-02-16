// Type definitions for HustleKE

export type VerificationStatus = 'Unverified' | 'ID-Verified' | 'Skill-Tested';
export type JobStatus = 'Draft' | 'Open' | 'In-Progress' | 'Completed' | 'Disputed' | 'Cancelled';
export type PaymentType = 'Fixed' | 'Hourly' | 'Milestone';
export type ProposalStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Withdrawn';
export type EscrowStatus = 'Pending' | 'Held' | 'Released' | 'Refunded' | 'Disputed';
export type TransactionType = 'Deposit' | 'Withdrawal' | 'Escrow' | 'Release' | 'Refund' | 'Fee';
export type UserRole = 'Freelancer' | 'Client' | 'Admin';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  location?: string;
  county?: string;
  avatar_url?: string;
  bio?: string;
  skills: string[];
  hourly_rate?: number;
  title?: string;
  mpesa_phone?: string;
  mpesa_verified: boolean;
  mpesa_verified_at?: string;
  verification_status: VerificationStatus;
  id_verified: boolean;
  id_verified_at?: string;
  skill_tested: boolean;
  ai_score: number;
  hustle_score: number;
  total_earned: number;
  jobs_completed: number;
  jobs_posted: number;
  response_time_hours?: number;
  role: UserRole;
  languages: string[];
  swahili_speaking: boolean;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  client_id: string;
  client?: Profile;
  title: string;
  description: string;
  budget_min: number;
  budget_max: number;
  payment_type: PaymentType;
  status: JobStatus;
  deadline?: string;
  created_at: string;
  updated_at: string;
  skills_required: string[];
  tags: string[];
  location_preference?: string;
  remote_allowed: boolean;
  requires_verified_only: boolean;
  requires_swahili: boolean;
  min_hustle_score: number;
  ai_match_score: number;
  views_count: number;
  proposals_count: number;
  is_boosted: boolean;
  boosted_until?: string;
}

export interface Proposal {
  id: string;
  job_id: string;
  job?: Job;
  freelancer_id: string;
  freelancer?: Profile;
  cover_letter: string;
  cover_letter_original?: string;
  bid_amount: number;
  estimated_duration_days?: number;
  status: ProposalStatus;
  ai_enhancement_score: number;
  ai_suggestions?: string;
  submitted_at: string;
  accepted_at?: string;
  rejected_at?: string;
}

export interface EscrowTransaction {
  id: string;
  job_id: string;
  proposal_id?: string;
  client_id: string;
  freelancer_id: string;
  amount: number;
  status: EscrowStatus;
  mpesa_receipt_number?: string;
  mpesa_checkout_request_id?: string;
  mpesa_merchant_request_id?: string;
  mpesa_result_code?: number;
  mpesa_result_desc?: string;
  transaction_type: TransactionType;
  service_fee: number;
  tax_amount: number;
  initiated_at: string;
  held_at?: string;
  released_at?: string;
  refunded_at?: string;
  description?: string;
  failure_reason?: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  pending_balance: number;
  total_deposited: number;
  total_withdrawn: number;
  total_earned: number;
  auto_withdraw: boolean;
  auto_withdraw_threshold: number;
  preferred_withdrawal_method: string;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  amount: number;
  type: TransactionType;
  status: string;
  escrow_id?: string;
  job_id?: string;
  mpesa_receipt_number?: string;
  mpesa_phone?: string;
  description?: string;
  created_at: string;
}

export interface Message {
  id: string;
  job_id: string;
  sender_id: string;
  sender?: Profile;
  receiver_id: string;
  receiver?: Profile;
  content: string;
  attachments: string[];
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface Review {
  id: string;
  job_id: string;
  escrow_id?: string;
  reviewer_id: string;
  reviewer?: Profile;
  reviewee_id: string;
  reviewee?: Profile;
  rating: number;
  comment?: string;
  communication_rating?: number;
  quality_rating?: number;
  timeliness_rating?: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface HustleScoreLog {
  id: string;
  user_id: string;
  previous_score: number;
  new_score: number;
  change_amount: number;
  reason: string;
  category?: string;
  reference_id?: string;
  reference_type?: string;
  created_at: string;
}
