-- Migration 008: Recalculate hustle scores for all existing profiles
-- This fixes the issue where hustle_score was never calculated (always 0)

-- Recalculate hustle_score for every profile using the same formula as the app:
-- Base: 10
-- ID Verified: +10
-- Profile Complete (bio, title, skills, county): +5
-- Skill Tested: +15
-- Per Job Completed: +20 (max 40)
-- Per Dispute: -50
-- Range: 0-100

UPDATE profiles
SET hustle_score = GREATEST(0, LEAST(100,
  10
  + CASE WHEN id_verified = true THEN 10 ELSE 0 END
  + CASE WHEN skill_tested = true THEN 15 ELSE 0 END
  + CASE WHEN (bio IS NOT NULL AND bio != '' AND title IS NOT NULL AND title != '' AND skills IS NOT NULL AND array_length(skills, 1) > 0 AND county IS NOT NULL AND county != '') THEN 5 ELSE 0 END
  + LEAST(COALESCE(jobs_completed, 0) * 20, 40)
  - COALESCE((
    SELECT COUNT(*)::integer FROM disputes d
    WHERE d.initiator_id = profiles.id OR d.respondent_id = profiles.id
  ), 0) * 50
));

-- Log the recalculation
INSERT INTO hustle_score_log (user_id, previous_score, new_score, change_amount, reason, category)
SELECT
  id,
  0 as previous_score,
  hustle_score as new_score,
  hustle_score as change_amount,
  'bulk_recalculation_migration_008' as reason,
  'Profile' as category
FROM profiles
WHERE hustle_score > 0;
