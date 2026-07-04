---
id: REQ-002
title: Fix Edit Profile Save + Full App Page Audit
status: done
created_at: 2026-07-04T09:36:00Z
rephrased_prompt: pp/rephrased/REQ-002-rephrased.md
plan: pp/plans/REQ-002-plan.md
---

# Fix Edit Profile Save + Full App Page Audit

## What
The edit profile page at `/profile/edit` silently fails when saving changes. Root causes: gender enum mismatch between frontend/backend, empty catch block swallowing errors, validation schema mismatches. Additionally, audit all pages in the app for similar bugs.

## Why
Users cannot update their profile, and there may be other broken pages throughout the app that need fixing for production readiness.

## Done When
1. Profile edit saves successfully with user feedback (toast/message)
2. Gender, bio, city validations match between frontend and backend
3. All pages in the app load without crashing
4. Forms across the app submit correctly with proper error handling

## Context
- Gender enum: Frontend sends "Male", backend expects "MALE"
- Bio limit: Frontend 200 chars, Backend 500 chars
- City limit: Frontend 50 chars, Backend 100 chars
- Empty catch block: No toast, no error state, no console log
- Home page trips format mismatch was already fixed separately

## Rephrased Prompt
See [pp/rephrased/REQ-002-rephrased.md] for the enhanced prompt.

## Implementation Plan
See [pp/plans/REQ-002-plan.md] for the detailed plan.

---
*Captured after 1 clarifying question*
*Scope: Full app audit (user confirmed)*
