---
id: REQ-002
title: Fix Edit Profile Save + Full App Page Audit
planned_at: 2026-07-04T09:36:00Z
files_to_modify:
  - src/app/(main)/profile/edit/page.tsx
  - src/app/(main)/search/page.tsx
  - src/app/(main)/profile/page.tsx
  - Other pages found during audit
estimated_complexity: complex
---

# Implementation Plan: Fix Edit Profile + Full App Audit

## Objective
Fix the profile edit save bug, then audit and fix all other pages.

## Phase 1: Fix Profile Edit Save (Priority)

### Step 1: Fix gender enum values in edit form
- Map display values ("Male", "Female") to enum values ("MALE", "FEMALE")
- Ensure the gender select sends the correct enum value

### Step 2: Sync validation schemas
- Match frontend bio limit to backend (500 chars)
- Match frontend city limit to backend (100 chars)

### Step 3: Add error handling + user feedback
- Add error state to the form
- Show toast/error message when save fails
- Log errors to console in development

### Step 4: Verify save works end-to-end

## Phase 2: Full App Page Audit

### Audit checklist for every page:
1. Does the page load without crashing?
2. Do API calls use the correct response format?
3. Are forms submitting data in the format the API expects?
4. Is there error handling for failed API calls?
5. Do links navigate correctly?

### Known pages to audit:
- (main)/home — FIXED (trips data format)
- (main)/search — FIXED (trips data format)
- (main)/profile — view page
- (main)/profile/edit — save bug (fixing now)
- (main)/trips/[id] — trip detail
- (main)/trips/[id]/reviews
- (main)/trips/[id]/itinerary
- (main)/trips/[id]/hub
- (booking)/[tripId]/* — booking flow pages
- (onboarding)/* — welcome, interests, budget, pickup-city
- (auth)/login, (auth)/otp
- wallet, my-trips, saved, rewards, notifications

## Edge Cases
- Empty optional fields should not cause validation errors
- Date format handling (dd-mm-yyyy vs ISO)
- Interests array handling

## Testing Strategy
- Manual: fill profile edit form, save, verify data persists
- Manual: navigate through all main pages, verify no crashes
