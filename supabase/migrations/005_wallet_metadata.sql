-- Add metadata JSONB column to wallet_transactions for M-Pesa STK push tracking
-- This stores checkout_request_id, merchant_request_id, and other callback data

ALTER TABLE wallet_transactions
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;

-- Add index on status for faster pending transaction lookups
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status ON wallet_transactions(status);
