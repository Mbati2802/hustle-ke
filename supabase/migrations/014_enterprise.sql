-- ============================================================
-- 014: Enterprise System — Organizations, Teams, Bench, Audit
-- ============================================================

-- ─── Organizations ───
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  description TEXT,
  website TEXT,
  industry TEXT,
  size TEXT DEFAULT '1-10', -- '1-10', '11-50', '51-200', '200+'
  county TEXT,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'enterprise',
  custom_fee_percentage NUMERIC(4,2) DEFAULT NULL, -- NULL = use default enterprise rate (2%)
  max_seats INTEGER DEFAULT 10,
  api_key TEXT UNIQUE,
  api_key_created_at TIMESTAMPTZ,
  webhook_url TEXT,
  webhook_secret TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_organizations_owner ON organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_api_key ON organizations(api_key);

-- ─── Organization Members ───
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- owner, admin, hiring_manager, member, viewer
  invited_by UUID REFERENCES profiles(id),
  permissions JSONB DEFAULT '{"can_post_jobs": true, "can_manage_escrow": false, "can_invite_members": false, "can_view_analytics": true, "can_manage_bench": true}'::jsonb,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);

-- ─── Organization Invites ───
CREATE TABLE IF NOT EXISTS organization_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  invited_by UUID NOT NULL REFERENCES profiles(id),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status TEXT DEFAULT 'pending', -- pending, accepted, expired, cancelled
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_invites_org ON organization_invites(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_invites_token ON organization_invites(token);
CREATE INDEX IF NOT EXISTS idx_org_invites_email ON organization_invites(email);

-- ─── Freelancer Bench (saved/favorite freelancers per org) ───
CREATE TABLE IF NOT EXISTS organization_bench (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  freelancer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  added_by UUID NOT NULL REFERENCES profiles(id),
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  internal_rating INTEGER CHECK (internal_rating >= 1 AND internal_rating <= 5),
  times_hired INTEGER DEFAULT 0,
  last_hired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, freelancer_id)
);

CREATE INDEX IF NOT EXISTS idx_org_bench_org ON organization_bench(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_bench_freelancer ON organization_bench(freelancer_id);

-- ─── Organization Activity Log (audit trail) ───
CREATE TABLE IF NOT EXISTS organization_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT, -- 'job', 'member', 'payment', 'bench', 'settings', 'invite'
  entity_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_activity_org ON organization_activity_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_activity_time ON organization_activity_log(created_at DESC);

-- ─── Contract Templates ───
CREATE TABLE IF NOT EXISTS contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  is_default BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contract_templates_org ON contract_templates(organization_id);

-- ─── Organization Invoices ───
CREATE TABLE IF NOT EXISTS organization_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(12,2) DEFAULT 0,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'KES',
  status TEXT DEFAULT 'draft', -- draft, issued, paid, overdue, cancelled
  issued_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_invoices_org ON organization_invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_invoices_status ON organization_invoices(status);

-- ─── API Webhook Events Log ───
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'job.created', 'proposal.received', 'escrow.released', etc.
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending', -- pending, delivered, failed
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  response_status INTEGER,
  response_body TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_org ON webhook_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON webhook_events(status);

-- ─── Add organization_id to jobs table for org-posted jobs ───
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'organization_id') THEN
    ALTER TABLE jobs ADD COLUMN organization_id UUID REFERENCES organizations(id);
    CREATE INDEX idx_jobs_organization ON jobs(organization_id);
  END IF;
END$$;

-- ─── Helper: get current user's profiles.id from auth.uid() ───
CREATE OR REPLACE FUNCTION my_profile_id()
RETURNS UUID AS $$
  SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── Helper: check org membership bypassing RLS (prevents infinite recursion) ───
CREATE OR REPLACE FUNCTION user_org_ids(p_profile_id UUID)
RETURNS SETOF UUID AS $$
  SELECT organization_id FROM organization_members WHERE user_id = p_profile_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION user_admin_org_ids(p_profile_id UUID)
RETURNS SETOF UUID AS $$
  SELECT organization_id FROM organization_members WHERE user_id = p_profile_id AND role IN ('owner', 'admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION owned_org_ids(p_profile_id UUID)
RETURNS SETOF UUID AS $$
  SELECT id FROM organizations WHERE owner_id = p_profile_id AND is_active = true;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── RLS Policies ───

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_bench ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Organizations
CREATE POLICY "org_select" ON organizations FOR SELECT USING (
  owner_id = my_profile_id() OR id IN (SELECT user_org_ids(my_profile_id()))
);
CREATE POLICY "org_insert" ON organizations FOR INSERT WITH CHECK (owner_id = my_profile_id());
CREATE POLICY "org_update" ON organizations FOR UPDATE USING (
  owner_id = my_profile_id() OR id IN (SELECT user_admin_org_ids(my_profile_id()))
);
CREATE POLICY "org_delete" ON organizations FOR DELETE USING (owner_id = my_profile_id());

-- Members (NO self-referencing queries — use helper functions)
CREATE POLICY "members_select" ON organization_members FOR SELECT USING (
  organization_id IN (SELECT user_org_ids(my_profile_id()))
  OR organization_id IN (SELECT owned_org_ids(my_profile_id()))
);
CREATE POLICY "members_insert" ON organization_members FOR INSERT WITH CHECK (
  organization_id IN (SELECT owned_org_ids(my_profile_id()))
  OR organization_id IN (SELECT user_admin_org_ids(my_profile_id()))
);
CREATE POLICY "members_update" ON organization_members FOR UPDATE USING (
  organization_id IN (SELECT owned_org_ids(my_profile_id()))
  OR organization_id IN (SELECT user_admin_org_ids(my_profile_id()))
);
CREATE POLICY "members_delete" ON organization_members FOR DELETE USING (
  organization_id IN (SELECT owned_org_ids(my_profile_id()))
  OR organization_id IN (SELECT user_admin_org_ids(my_profile_id()))
  OR user_id = my_profile_id()
);

-- Invites
CREATE POLICY "invites_select" ON organization_invites FOR SELECT USING (
  organization_id IN (SELECT user_org_ids(my_profile_id()))
  OR organization_id IN (SELECT owned_org_ids(my_profile_id()))
  OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
);
CREATE POLICY "invites_insert" ON organization_invites FOR INSERT WITH CHECK (
  organization_id IN (SELECT owned_org_ids(my_profile_id()))
  OR organization_id IN (SELECT user_admin_org_ids(my_profile_id()))
);
CREATE POLICY "invites_update" ON organization_invites FOR UPDATE USING (
  organization_id IN (SELECT owned_org_ids(my_profile_id()))
  OR organization_id IN (SELECT user_admin_org_ids(my_profile_id()))
  OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Bench
CREATE POLICY "bench_select" ON organization_bench FOR SELECT USING (
  organization_id IN (SELECT user_org_ids(my_profile_id()))
  OR organization_id IN (SELECT owned_org_ids(my_profile_id()))
);
CREATE POLICY "bench_insert" ON organization_bench FOR INSERT WITH CHECK (
  organization_id IN (SELECT user_org_ids(my_profile_id()))
  OR organization_id IN (SELECT owned_org_ids(my_profile_id()))
);
CREATE POLICY "bench_update" ON organization_bench FOR UPDATE USING (
  organization_id IN (SELECT user_org_ids(my_profile_id()))
  OR organization_id IN (SELECT owned_org_ids(my_profile_id()))
);
CREATE POLICY "bench_delete" ON organization_bench FOR DELETE USING (
  organization_id IN (SELECT user_org_ids(my_profile_id()))
  OR organization_id IN (SELECT owned_org_ids(my_profile_id()))
);

-- Activity log
CREATE POLICY "activity_select" ON organization_activity_log FOR SELECT USING (
  organization_id IN (SELECT user_org_ids(my_profile_id()))
  OR organization_id IN (SELECT owned_org_ids(my_profile_id()))
);
CREATE POLICY "activity_insert" ON organization_activity_log FOR INSERT WITH CHECK (true);

-- Contract templates
CREATE POLICY "templates_select" ON contract_templates FOR SELECT USING (
  organization_id IN (SELECT user_org_ids(my_profile_id()))
  OR organization_id IN (SELECT owned_org_ids(my_profile_id()))
);
CREATE POLICY "templates_insert" ON contract_templates FOR INSERT WITH CHECK (
  organization_id IN (SELECT user_admin_org_ids(my_profile_id()))
  OR organization_id IN (SELECT owned_org_ids(my_profile_id()))
);
CREATE POLICY "templates_update" ON contract_templates FOR UPDATE USING (
  organization_id IN (SELECT user_admin_org_ids(my_profile_id()))
  OR organization_id IN (SELECT owned_org_ids(my_profile_id()))
);
CREATE POLICY "templates_delete" ON contract_templates FOR DELETE USING (
  organization_id IN (SELECT owned_org_ids(my_profile_id()))
);

-- Invoices
CREATE POLICY "invoices_select" ON organization_invoices FOR SELECT USING (
  organization_id IN (SELECT user_org_ids(my_profile_id()))
  OR organization_id IN (SELECT owned_org_ids(my_profile_id()))
);
CREATE POLICY "invoices_insert" ON organization_invoices FOR INSERT WITH CHECK (
  organization_id IN (SELECT owned_org_ids(my_profile_id()))
  OR organization_id IN (SELECT user_admin_org_ids(my_profile_id()))
);

-- Webhook events
CREATE POLICY "webhooks_select" ON webhook_events FOR SELECT USING (
  organization_id IN (SELECT user_admin_org_ids(my_profile_id()))
  OR organization_id IN (SELECT owned_org_ids(my_profile_id()))
);
CREATE POLICY "webhooks_insert" ON webhook_events FOR INSERT WITH CHECK (true);

-- Admin bypass
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['organizations', 'organization_members', 'organization_invites', 'organization_bench', 'organization_activity_log', 'contract_templates', 'organization_invoices', 'webhook_events']
  LOOP
    EXECUTE format('CREATE POLICY "admin_full_%s" ON %I FOR ALL USING (is_admin()) WITH CHECK (true)', t, t);
  END LOOP;
END$$;
