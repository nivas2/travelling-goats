# Original Prompts Log

This is the verbatim, append-only record of every prompt passed to `/pp:add`.

**Rules:**
- The orchestrator MUST append a new entry here BEFORE rephrasing, planning, or REQ file creation.
- NEVER edit existing entries. NEVER reorder. NEVER delete.
- If the rephrased prompt and the original ever disagree, this file is the source of truth.
- This file is committed to git so the audit trail survives the archive lifecycle.

---

## Original Prompt 1

- **Captured at:** 2026-07-04T12:00:00Z
- **REQ(s):** REQ-001
- **UR:** —
- **Source:** /pp:add

```
Review every third-party integration used by PackAlong.

Verify whether it is correctly configured and production ready.

Check:

Authentication

• Google OAuth

• Apple Sign In

• Phone OTP Provider (Firebase / MSG91 / Twilio or whichever is implemented)

Maps

• Google Maps

• Pickup Location

• Geocoding

Payments

• Razorpay

• Razorpay Webhooks

Storage

• Cloudinary

OR

• DigitalOcean Spaces

Notifications

• Firebase Cloud Messaging (if used)

• Email Service (Resend / SendGrid / SMTP)

• SMS Provider

Communication

• Socket.io

Analytics

• Google Analytics

• PostHog (if used)

Monitoring

• Sentry

Deployment

• DigitalOcean Droplet

• DigitalOcean App Platform (if used)

• Nginx

• PM2

• SSL Certificate

• Domain Configuration

Database

• PostgreSQL

Backups

• Database Backups

• Spaces Backup

For every integration indicate:

✅ Configured

⚠ Partially Configured

❌ Missing

If missing, explain exactly what needs to be completed.  -- pls suggest me what all to use in cheap and best for prod
```

---
