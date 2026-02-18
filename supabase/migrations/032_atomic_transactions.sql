-- Migration 032: Atomic Transaction Functions for Financial Operations
-- Prevents race conditions and ensures data consistency

-- ============================================================================
-- WITHDRAW FUNDS (Atomic)
-- ============================================================================
CREATE OR REPLACE FUNCTION withdraw_funds(
  p_wallet_id UUID,
  p_amount DECIMAL,
  p_phone TEXT,
  p_description TEXT DEFAULT 'Withdrawal to M-Pesa'
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance DECIMAL;
  v_transaction_id UUID;
  v_result JSON;
BEGIN
  -- Lock the wallet row for update (prevents concurrent modifications)
  SELECT balance INTO v_balance
  FROM wallets
  WHERE id = p_wallet_id
  FOR UPDATE;
  
  -- Check if wallet exists
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Wallet not found'
    );
  END IF;
  
  -- Validate amount
  IF p_amount <= 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Amount must be positive'
    );
  END IF;
  
  -- Check sufficient balance
  IF v_balance < p_amount THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Insufficient balance'
    );
  END IF;
  
  -- Deduct from wallet
  UPDATE wallets
  SET 
    balance = balance - p_amount,
    total_withdrawn = total_withdrawn + p_amount,
    updated_at = NOW()
  WHERE id = p_wallet_id;
  
  -- Record transaction
  INSERT INTO wallet_transactions (
    wallet_id,
    amount,
    type,
    status,
    mpesa_phone,
    description
  ) VALUES (
    p_wallet_id,
    -p_amount,
    'Withdrawal',
    'Pending',
    p_phone,
    p_description
  )
  RETURNING id INTO v_transaction_id;
  
  -- Return success
  RETURN json_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'new_balance', v_balance - p_amount
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Rollback happens automatically
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- ============================================================================
-- DEPOSIT FUNDS (Atomic)
-- ============================================================================
CREATE OR REPLACE FUNCTION deposit_funds(
  p_wallet_id UUID,
  p_amount DECIMAL,
  p_phone TEXT,
  p_description TEXT DEFAULT 'M-Pesa deposit',
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance DECIMAL;
  v_transaction_id UUID;
BEGIN
  -- Validate amount
  IF p_amount <= 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Amount must be positive'
    );
  END IF;
  
  -- Lock and update wallet
  UPDATE wallets
  SET 
    balance = balance + p_amount,
    total_deposited = total_deposited + p_amount,
    updated_at = NOW()
  WHERE id = p_wallet_id
  RETURNING balance INTO v_balance;
  
  -- Check if wallet exists
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Wallet not found'
    );
  END IF;
  
  -- Record transaction
  INSERT INTO wallet_transactions (
    wallet_id,
    amount,
    type,
    status,
    mpesa_phone,
    description,
    metadata
  ) VALUES (
    p_wallet_id,
    p_amount,
    'Deposit',
    'Completed',
    p_phone,
    p_description,
    p_metadata
  )
  RETURNING id INTO v_transaction_id;
  
  RETURN json_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'new_balance', v_balance
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- ============================================================================
-- CREATE ESCROW (Atomic)
-- ============================================================================
CREATE OR REPLACE FUNCTION create_escrow_transaction(
  p_proposal_id UUID,
  p_amount DECIMAL,
  p_client_id UUID,
  p_service_fee DECIMAL,
  p_tax_amount DECIMAL
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet_id UUID;
  v_wallet_balance DECIMAL;
  v_job_id UUID;
  v_freelancer_id UUID;
  v_escrow_id UUID;
BEGIN
  -- Get proposal details
  SELECT job_id, freelancer_id
  INTO v_job_id, v_freelancer_id
  FROM proposals
  WHERE id = p_proposal_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Proposal not found'
    );
  END IF;
  
  -- Get client wallet and lock it
  SELECT id, balance INTO v_wallet_id, v_wallet_balance
  FROM wallets
  WHERE user_id = p_client_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Wallet not found'
    );
  END IF;
  
  -- Check sufficient balance
  IF v_wallet_balance < p_amount THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Insufficient wallet balance'
    );
  END IF;
  
  -- Deduct from client wallet
  UPDATE wallets
  SET 
    balance = balance - p_amount,
    pending_balance = pending_balance + p_amount,
    updated_at = NOW()
  WHERE id = v_wallet_id;
  
  -- Create escrow transaction
  INSERT INTO escrow_transactions (
    job_id,
    proposal_id,
    client_id,
    freelancer_id,
    amount,
    status,
    transaction_type,
    service_fee,
    tax_amount,
    description
  ) VALUES (
    v_job_id,
    p_proposal_id,
    p_client_id,
    v_freelancer_id,
    p_amount,
    'Held',
    'Escrow',
    p_service_fee,
    p_tax_amount,
    'Escrow for proposal ' || p_proposal_id
  )
  RETURNING id INTO v_escrow_id;
  
  -- Record wallet transaction
  INSERT INTO wallet_transactions (
    wallet_id,
    amount,
    type,
    status,
    escrow_id,
    job_id,
    description
  ) VALUES (
    v_wallet_id,
    -p_amount,
    'Escrow',
    'Completed',
    v_escrow_id,
    v_job_id,
    'Funds held in escrow'
  );
  
  RETURN json_build_object(
    'success', true,
    'escrow_id', v_escrow_id,
    'new_balance', v_wallet_balance - p_amount
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- ============================================================================
-- RELEASE ESCROW (Atomic)
-- ============================================================================
CREATE OR REPLACE FUNCTION release_escrow_funds(
  p_escrow_id UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_escrow RECORD;
  v_freelancer_wallet_id UUID;
  v_client_wallet_id UUID;
  v_net_amount DECIMAL;
BEGIN
  -- Get and lock escrow
  SELECT * INTO v_escrow
  FROM escrow_transactions
  WHERE id = p_escrow_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Escrow not found'
    );
  END IF;
  
  -- Verify status
  IF v_escrow.status != 'Held' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Escrow must be in Held status'
    );
  END IF;
  
  -- Calculate net amount
  v_net_amount := v_escrow.amount - v_escrow.service_fee - v_escrow.tax_amount;
  
  -- Get wallet IDs
  SELECT id INTO v_freelancer_wallet_id
  FROM wallets
  WHERE user_id = v_escrow.freelancer_id;
  
  SELECT id INTO v_client_wallet_id
  FROM wallets
  WHERE user_id = v_escrow.client_id;
  
  -- Update escrow status
  UPDATE escrow_transactions
  SET 
    status = 'Released',
    released_at = NOW(),
    updated_at = NOW()
  WHERE id = p_escrow_id;
  
  -- Credit freelancer wallet
  UPDATE wallets
  SET 
    balance = balance + v_net_amount,
    total_earned = total_earned + v_net_amount,
    updated_at = NOW()
  WHERE id = v_freelancer_wallet_id;
  
  -- Reduce client pending balance
  UPDATE wallets
  SET 
    pending_balance = GREATEST(0, pending_balance - v_escrow.amount),
    updated_at = NOW()
  WHERE id = v_client_wallet_id;
  
  -- Record freelancer wallet transaction
  INSERT INTO wallet_transactions (
    wallet_id,
    amount,
    type,
    status,
    escrow_id,
    job_id,
    description
  ) VALUES (
    v_freelancer_wallet_id,
    v_net_amount,
    'Release',
    'Completed',
    p_escrow_id,
    v_escrow.job_id,
    'Escrow release (fee: KES ' || v_escrow.service_fee || ')'
  );
  
  -- Update freelancer profile stats
  UPDATE profiles
  SET 
    total_earned = total_earned + v_net_amount,
    jobs_completed = jobs_completed + 1,
    updated_at = NOW()
  WHERE id = v_escrow.freelancer_id;
  
  -- Mark job as completed
  UPDATE jobs
  SET 
    status = 'Completed',
    updated_at = NOW()
  WHERE id = v_escrow.job_id;
  
  RETURN json_build_object(
    'success', true,
    'net_amount', v_net_amount,
    'service_fee', v_escrow.service_fee,
    'tax_amount', v_escrow.tax_amount
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- ============================================================================
-- REFUND ESCROW (Atomic)
-- ============================================================================
CREATE OR REPLACE FUNCTION refund_escrow_funds(
  p_escrow_id UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_escrow RECORD;
  v_client_wallet_id UUID;
BEGIN
  -- Get and lock escrow
  SELECT * INTO v_escrow
  FROM escrow_transactions
  WHERE id = p_escrow_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Escrow not found'
    );
  END IF;
  
  -- Verify status
  IF v_escrow.status != 'Held' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Escrow must be in Held status'
    );
  END IF;
  
  -- Get client wallet
  SELECT id INTO v_client_wallet_id
  FROM wallets
  WHERE user_id = v_escrow.client_id;
  
  -- Update escrow status
  UPDATE escrow_transactions
  SET 
    status = 'Refunded',
    refunded_at = NOW(),
    updated_at = NOW()
  WHERE id = p_escrow_id;
  
  -- Refund to client wallet
  UPDATE wallets
  SET 
    balance = balance + v_escrow.amount,
    pending_balance = GREATEST(0, pending_balance - v_escrow.amount),
    updated_at = NOW()
  WHERE id = v_client_wallet_id;
  
  -- Record wallet transaction
  INSERT INTO wallet_transactions (
    wallet_id,
    amount,
    type,
    status,
    escrow_id,
    job_id,
    description
  ) VALUES (
    v_client_wallet_id,
    v_escrow.amount,
    'Refund',
    'Completed',
    p_escrow_id,
    v_escrow.job_id,
    'Escrow refund'
  );
  
  RETURN json_build_object(
    'success', true,
    'refund_amount', v_escrow.amount
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- ============================================================================
-- IDEMPOTENCY LOG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS idempotency_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT NOT NULL UNIQUE,
  request_path TEXT NOT NULL,
  request_method TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  response_status INTEGER NOT NULL,
  response_body JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_idempotency_key ON idempotency_log(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_idempotency_expires ON idempotency_log(expires_at);

-- Auto-cleanup old entries
CREATE OR REPLACE FUNCTION cleanup_expired_idempotency_logs()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM idempotency_log
  WHERE expires_at < NOW();
END;
$$;

-- RLS Policies
ALTER TABLE idempotency_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own idempotency logs"
  ON idempotency_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION withdraw_funds TO authenticated;
GRANT EXECUTE ON FUNCTION deposit_funds TO authenticated;
GRANT EXECUTE ON FUNCTION create_escrow_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION release_escrow_funds TO authenticated;
GRANT EXECUTE ON FUNCTION refund_escrow_funds TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_idempotency_logs TO authenticated;

-- Comments
COMMENT ON FUNCTION withdraw_funds IS 'Atomically withdraw funds from wallet with row-level locking';
COMMENT ON FUNCTION deposit_funds IS 'Atomically deposit funds to wallet';
COMMENT ON FUNCTION create_escrow_transaction IS 'Atomically create escrow and deduct from client wallet';
COMMENT ON FUNCTION release_escrow_funds IS 'Atomically release escrow funds to freelancer';
COMMENT ON FUNCTION refund_escrow_funds IS 'Atomically refund escrow funds to client';
COMMENT ON TABLE idempotency_log IS 'Prevents duplicate processing of payment operations';
