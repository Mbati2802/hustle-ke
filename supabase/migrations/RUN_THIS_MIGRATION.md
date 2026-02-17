# Database Migration Instructions

Since you don't have Supabase CLI installed, run this migration manually:

## Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `023_support_enhancements.sql`
5. Paste into the SQL editor
6. Click **Run** or press `Ctrl+Enter`

## Option 2: Direct Database Connection

If you have `psql` or another PostgreSQL client:

```bash
# Using psql
psql "postgresql://[user]:[password]@[host]:5432/[database]" -f supabase/migrations/023_support_enhancements.sql

# Or using the connection string from Supabase dashboard
psql "[your-connection-string]" -f supabase/migrations/023_support_enhancements.sql
```

## What This Migration Does

- ✅ Adds assignment tracking columns to `support_tickets`
- ✅ Adds resolution tracking columns
- ✅ Adds satisfaction rating columns
- ✅ Adds agent review columns
- ✅ Adds dispute linking column
- ✅ Creates `support_assignments` table for notifications
- ✅ Creates all necessary indexes
- ✅ Sets up RLS policies

## Verify Migration Success

After running, verify with:

```sql
-- Check new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'support_tickets' 
AND column_name IN ('assigned_to', 'satisfaction_rating', 'agent_review_rating');

-- Check new table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'support_assignments'
);
```

You should see the columns and the table should exist.
