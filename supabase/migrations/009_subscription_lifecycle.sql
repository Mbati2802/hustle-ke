-- Migration 009: Add subscription lifecycle columns
-- Supports auto-renewal, grace period tracking, and renewal history

-- Add auto_renew flag (defaults to true — users can opt out)
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT true;

-- Add renewed_at to track when the last auto-renewal happened
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS renewed_at TIMESTAMPTZ;

-- Add original_price and discount_applied for renewal pricing context
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS original_price BIGINT DEFAULT 0;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS discount_applied BIGINT DEFAULT 0;

-- Add promo_code_id for tracking which promo was used
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS promo_code_id UUID;

-- Index for finding expiring subscriptions efficiently
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at ON subscriptions(expires_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_auto_renew ON subscriptions(auto_renew) WHERE status = 'active';
