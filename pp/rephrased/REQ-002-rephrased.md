---
id: REQ-002
original_prompt: "add edit profile not saving why, pls review all pages and fix all issues"
rephrased_at: 2026-07-04T09:35:00Z
---

# Rephrased Prompt: Fix Edit Profile Save + Full App Page Audit

## Objective
Fix the edit profile page (`/profile/edit`) which silently fails when saving, then conduct a comprehensive audit of ALL pages in the app to identify and fix bugs.

## Primary Issue: Profile Edit Not Saving
The edit profile form at `/profile/edit` does not persist changes when "Save Changes" is clicked. Root causes identified:
1. **Gender enum mismatch** — Frontend sends any string, backend expects `MALE|FEMALE|NON_BINARY|PREFER_NOT_TO_SAY`
2. **Silent error handling** — Empty catch block swallows API errors with no user feedback
3. **Bio character limit mismatch** — Frontend: 200 chars, Backend: 500 chars
4. **City character limit mismatch** — Frontend: 50 chars, Backend: 100 chars
5. **No error state/toast** — User gets zero indication when save fails

## Secondary: Full App Page Audit
Review every page for:
- Form submission failures (same pattern as profile edit)
- Data format mismatches between frontend and API
- Missing error handling
- Pages that crash or don't load
- Broken navigation or dead links

## Success Criteria
- Profile edit saves successfully and shows confirmation
- All pages load without crashing
- Forms across the app submit correctly
- Error states are visible to users

---
*Original: "add edit profile not saving why, pls review all pages and fix all issues"*
*Rephrased by prompt engineering agent*
