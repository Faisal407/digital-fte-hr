# Profile Settings Test Plan - Phase 4 Option B

## Complete Test Scenario

### Prerequisites
- User must be logged in
- URL: https://digital-fte-hr.vercel.app/dashboard/settings/profile

---

## Test Cases

### 1. Page Load Test
**Expected Behavior:**
- ✅ Page shows "Settings ⚙️" heading
- ✅ Form fields appear with current user data
- ✅ All 5 fields are visible: First Name, Last Name, Email, Phone, Timezone
- ✅ Email field is disabled (grayed out)
- ✅ "Save Changes" button is disabled (grayed out) - no changes yet
- ✅ Loading skeleton disappears after data loads

**How to Test:**
1. Navigate to https://digital-fte-hr.vercel.app/dashboard/settings/profile
2. Observe the page loads and populates fields
3. Open browser DevTools (F12) → Console
4. Should see logs: "Fetching profile...", "Profile response:", "Loaded profile:"

---

### 2. Field Edit Test
**Expected Behavior:**
- ✅ Can type in First Name field
- ✅ Can type in Last Name field
- ✅ Can type in Phone field
- ✅ Can change Timezone dropdown
- ✅ Email field cannot be edited (disabled)
- ✅ "Save Changes" button becomes ENABLED (bright green) after any change

**How to Test:**
1. Change First Name: "John" → "Jane"
2. Observe button changes from gray "No unsaved changes" to green "Save Changes"
3. Change Timezone: "UTC" → "Asia/Dubai"
4. Observe button is still green
5. Change Phone: "" → "+971501234567"

---

### 3. Save Test
**Expected Behavior:**
- ✅ Click "Save Changes" button
- ✅ Button changes to "Saving..." with loading state
- ✅ After 1-2 seconds, success message appears: "✅ Profile updated successfully!"
- ✅ Success message shows in green box at top
- ✅ Button returns to "Save Changes"

**How to Test:**
1. Make a change (e.g., First Name)
2. Click "Save Changes" button
3. Watch for the "Saving..." state
4. Wait for success message
5. Check DevTools Console for: "Save response:" logs

---

### 4. Persistence Test
**Expected Behavior:**
- ✅ After saving, refresh the page (F5 or Cmd+R)
- ✅ Form fields still contain the values you just saved
- ✅ "Save Changes" button is disabled (no unsaved changes)
- ✅ Changes persist across page refreshes

**How to Test:**
1. Save changes (from Test 3)
2. Press F5 to refresh the page
3. Wait for page to reload and data to load
4. Verify your saved changes are still there
5. Button should be disabled again

---

### 5. Multiple Changes Test
**Expected Behavior:**
- ✅ Can make multiple changes in one session
- ✅ Each field change is reflected immediately
- ✅ Can click Save after each set of changes
- ✅ Success message appears each time

**How to Test:**
1. Change First Name → Save → Success message
2. Change Last Name → Save → Success message
3. Change Timezone → Save → Success message
4. All changes should persist after refresh

---

### 6. Error Handling Test (Optional)
**Expected Behavior:**
- ✅ If network error occurs, red error message appears
- ✅ User can retry without losing changes
- ✅ Console shows error logs

**How to Test (simulate error):**
1. Open DevTools → Network tab
2. Set network to "Offline"
3. Try to save changes
4. Should see error message: "❌ Error saving profile"
5. Go back online
6. Try saving again - should work

---

## Success Criteria

All 6 tests must PASS for Option B to be considered complete:

- [ ] Test 1: Page Load ✅
- [ ] Test 2: Field Edit ✅
- [ ] Test 3: Save Functionality ✅
- [ ] Test 4: Persistence Across Refresh ✅
- [ ] Test 5: Multiple Changes ✅
- [ ] Test 6: Error Handling ✅

---

## What to Check in DevTools Console

After page load, you should see logs like:
```
Fetching profile for user: user@example.com
Profile response: {success: true, data: {profile: {...}}}
Loaded profile: {firstName: "...", lastName: "...", ...}
```

After clicking Save:
```
Saving profile: {firstName: "Jane", lastName: "...", ...}
Save response: {success: true, data: {profile: {...}}, message: "Profile updated successfully"}
```

---

## Browser Compatibility

Test in:
- [ ] Chrome/Brave
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browser (iPhone/Android)

---

## Final Notes

- All changes are saved to the **real database** (Supabase)
- Changes persist **across user sessions**
- Form properly reflects the current database state
- Responsive design works on all screen sizes
