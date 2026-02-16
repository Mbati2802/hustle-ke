-- 016: Add assigned_member_id to proposals for org job follow-up
-- When an org owner/admin accepts a proposal, they can assign a team member to follow up

ALTER TABLE proposals ADD COLUMN IF NOT EXISTS assigned_member_id UUID REFERENCES profiles(id);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_proposals_assigned_member ON proposals(assigned_member_id) WHERE assigned_member_id IS NOT NULL;

-- Add org_sender_name to messages so org messages show "Willys - ABC Company Ltd" format
ALTER TABLE messages ADD COLUMN IF NOT EXISTS org_sender_name TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

CREATE INDEX IF NOT EXISTS idx_messages_organization ON messages(organization_id) WHERE organization_id IS NOT NULL;
