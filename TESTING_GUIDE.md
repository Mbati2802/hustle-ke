# Complete Testing Guide - Support System Features

## 🔧 PREREQUISITES

### 1. Run Database Migration FIRST
Before testing, you MUST run the migration:

**Using Supabase Dashboard:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in left sidebar
4. Click **New Query**
5. Copy ALL contents from `supabase/migrations/023_support_enhancements.sql`
6. Paste and click **Run** (or Ctrl+Enter)
7. Verify success: Should see "Success. No rows returned"

**Verify Migration:**
```sql
-- Run this in SQL Editor to verify
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'support_tickets' 
AND column_name IN ('assigned_to', 'satisfaction_rating', 'agent_review_rating');

-- Should return 3 rows
```

### 2. Start Development Server
```bash
npm run dev
```

---

## ✅ FEATURE TESTING CHECKLIST

### **Feature 1: Login Modal Loading Bug**

**Test Steps:**
1. Go to http://localhost:3000
2. Click "Log In" in header
3. Enter valid credentials
4. Click "Log In" button
5. ⏱️ **WATCH THE MODAL**

**Expected Result:**
- ✅ Modal closes **immediately** after successful login
- ✅ You're redirected to dashboard
- ❌ Modal should NOT keep showing loading spinner

**Status:** [ ] Pass [ ] Fail

---

### **Feature 2: Admin Support Messages Reload**

**Test Steps:**
1. Log in as Admin
2. Go to `/admin/support`
3. Click any ticket to view messages
4. ⏱️ **WATCH FOR 10 SECONDS**

**Expected Result:**
- ✅ Messages stay stable (no flickering)
- ✅ No constant reloading every 2 seconds
- ✅ Messages only refresh when you send a new message

**Status:** [ ] Pass [ ] Fail

---

### **Feature 3: Assign Button with User Selection**

**Test Steps:**
1. Still in `/admin/support`
2. Click any ticket
3. Click **"Assign"** button (top right)
4. **OBSERVE THE DROPDOWN**

**Expected Result:**
- ✅ Dropdown appears with list of admin users
- ✅ "Assign to me" option at top
- ✅ Each admin shows name + email
- ✅ Click an admin → dropdown closes
- ✅ Ticket status changes to "Pending"

**Status:** [ ] Pass [ ] Fail

---

### **Feature 4: Notification Badge System**

**Test Steps:**
1. In `/admin/support`, assign a ticket to yourself
2. **LOOK AT THE LEFT SIDEBAR**
3. Find "Support" menu item

**Expected Result:**
- ✅ Red badge appears next to "Support"
- ✅ Badge shows number (e.g., "1", "2", "3")
- ✅ Badge updates when you view/assign tickets
- ✅ In collapsed sidebar, shows red dot instead

**Status:** [ ] Pass [ ] Fail

---

### **Feature 5: 10-Second Popup Notification**

**Test Steps:**
1. Assign a ticket to yourself (if not already done)
2. ⏱️ **WAIT 10 SECONDS** (count to 10)
3. **WATCH BOTTOM RIGHT CORNER**

**Expected Result:**
- ✅ After 10 seconds, popup appears (bottom right)
- ✅ Shows "New Support Assignment"
- ✅ Displays ticket subject and urgency
- ✅ Has "Dismiss" and "View Now" buttons
- ✅ Clicking "View Now" → goes to support page

**Status:** [ ] Pass [ ] Fail

---

### **Feature 6: Resolution Satisfaction Survey**

**Test Steps:**
1. In `/admin/support`, click a ticket
2. Click **"Resolve"** button (top right)
3. **OPEN LIVECHAT WIDGET** (bottom right green button)
4. ⏱️ **WAIT UP TO 10 SECONDS**

**Expected Result:**
- ✅ Modal appears: "Ticket Resolved"
- ✅ Question: "Were you satisfied with the support you received?"
- ✅ Two buttons: "Yes, Satisfied" (green) and "No, Unsatisfied" (red)
- ✅ Modal has checkmark icon at top

**Status:** [ ] Pass [ ] Fail

---

### **Feature 7: Star Rating Review System**

**Test Steps:**
1. In the satisfaction survey modal, click **"Yes, Satisfied"**
2. **NEW MODAL APPEARS**

**Expected Result:**
- ✅ Modal title: "Rate Your Experience"
- ✅ 5 star icons (clickable)
- ✅ Clicking stars fills them yellow
- ✅ Shows rating text: "Excellent!", "Great!", etc.
- ✅ Optional comment textarea
- ✅ "Skip" and "Submit Review" buttons
- ✅ Clicking "Submit Review" → success message in chat

**Test the Review:**
```sql
-- Verify review was saved
SELECT agent_review_rating, agent_review_comment, satisfaction_rating
FROM support_tickets
WHERE id = '[ticket-id]';

-- Should show rating (1-5) and 'satisfied'
```

**Status:** [ ] Pass [ ] Fail

---

### **Feature 8: Dispute Form with Chat Evidence**

**Test Steps:**
1. Resolve another ticket
2. In satisfaction survey, click **"No, Unsatisfied"**
3. **NEW MODAL APPEARS**

**Expected Result:**
- ✅ Modal title: "We're Sorry"
- ✅ Textarea: "What went wrong?"
- ✅ Yellow box: "📋 Chat Evidence" with explanation
- ✅ Two buttons: "Submit Feedback Only" and "Lodge Formal Dispute"

**Test "Submit Feedback Only":**
1. Type a comment
2. Click "Submit Feedback Only"
3. ✅ Modal closes
4. ✅ Success message appears in chat

**Test "Lodge Formal Dispute":**
1. Resolve another ticket → Click "No, Unsatisfied"
2. Type a comment
3. Click **"Lodge Formal Dispute"**
4. ✅ Modal closes
5. ✅ Message shows: "Dispute lodged successfully. Dispute ID: [id]"

**Verify Dispute Created:**
```sql
-- Check dispute was created with chat evidence
SELECT title, description
FROM disputes
WHERE title LIKE 'Support Ticket Dispute%'
ORDER BY created_at DESC
LIMIT 1;

-- Description should contain:
-- - Your comment
-- - "--- CHAT EVIDENCE ---"
-- - Chat messages
```

**Status:** [ ] Pass [ ] Fail

---

### **Feature 9: Database Schema**

**Test Steps:**
Run these SQL queries in Supabase SQL Editor:

```sql
-- 1. Check support_tickets columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'support_tickets' 
AND column_name IN (
  'assigned_to', 
  'assigned_at', 
  'resolved_by', 
  'resolved_at',
  'satisfaction_rating',
  'satisfaction_comment',
  'agent_review_rating',
  'agent_review_comment',
  'related_dispute_id'
);
-- Should return 9 rows

-- 2. Check support_assignments table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'support_assignments';
-- Should return 1 row

-- 3. Check indexes exist
SELECT indexname 
FROM pg_indexes 
WHERE tablename IN ('support_tickets', 'support_assignments')
AND indexname LIKE 'idx_%';
-- Should return 5 rows

-- 4. Check RLS policies
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'support_assignments';
-- Should return at least 4 rows
```

**Expected Result:**
- ✅ All columns exist
- ✅ support_assignments table exists
- ✅ All indexes created
- ✅ RLS policies active

**Status:** [ ] Pass [ ] Fail

---

## 🎯 COMPLETE WORKFLOW TEST

**End-to-End Test (All Features Together):**

1. **Login** → Modal closes immediately ✅
2. **Admin Support** → No constant reloading ✅
3. **Assign Ticket** → Dropdown works, notification created ✅
4. **Check Badge** → Red badge appears on Support menu ✅
5. **Wait 10s** → Popup notification appears ✅
6. **Resolve Ticket** → User sees satisfaction survey ✅
7. **Click "Yes"** → Star rating form appears ✅
8. **Submit Review** → Review saved to database ✅
9. **Resolve Another** → Click "No" → Dispute form ✅
10. **Lodge Dispute** → Dispute created with chat evidence ✅

---

## 🐛 TROUBLESHOOTING

### Issue: Satisfaction survey not appearing
**Fix:** 
- Ensure ticket status is "Resolved"
- Wait up to 10 seconds (status checks every 10s)
- Refresh LiveChat widget

### Issue: Notification badge not showing
**Fix:**
- Ensure you assigned a ticket to yourself
- Wait 30 seconds (badge updates every 30s)
- Refresh the page

### Issue: Popup not appearing
**Fix:**
- Ensure you have unread assignments
- Wait full 10 seconds
- Check browser console for errors

### Issue: Assign button not working
**Fix:**
- Verify migration ran successfully
- Check that `assigned_to` column exists
- Verify you're logged in as Admin

### Issue: Dispute not creating
**Fix:**
- Ensure `/api/disputes` endpoint exists
- Check browser console for errors
- Verify you typed a comment before clicking

---

## 📊 TESTING RESULTS TEMPLATE

```
Date: ___________
Tester: ___________

Feature 1 (Login Modal): [ ] Pass [ ] Fail
Feature 2 (Messages Reload): [ ] Pass [ ] Fail
Feature 3 (Assign Button): [ ] Pass [ ] Fail
Feature 4 (Notification Badge): [ ] Pass [ ] Fail
Feature 5 (10s Popup): [ ] Pass [ ] Fail
Feature 6 (Satisfaction Survey): [ ] Pass [ ] Fail
Feature 7 (Star Rating): [ ] Pass [ ] Fail
Feature 8 (Dispute Form): [ ] Pass [ ] Fail
Feature 9 (Database Schema): [ ] Pass [ ] Fail

Overall: [ ] All Pass [ ] Some Failures

Notes:
_________________________________
_________________________________
```

---

## ✅ SUCCESS CRITERIA

**All features pass when:**
- [ ] Login modal closes immediately
- [ ] Admin support messages don't reload constantly
- [ ] Assign dropdown shows all admins
- [ ] Notification badge appears and updates
- [ ] 10-second popup appears for assignments
- [ ] Satisfaction survey appears when ticket resolved
- [ ] Star rating form works and saves reviews
- [ ] Dispute form creates disputes with chat evidence
- [ ] All database columns, tables, and policies exist

**If all checkboxes are checked, the implementation is COMPLETE! 🎉**
