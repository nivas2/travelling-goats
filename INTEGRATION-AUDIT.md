# MeetMyRoute — Third-Party Integration Audit & Production Readiness Report

**Date:** July 4, 2026
**Stack:** Next.js 16 / Prisma 5 / PostgreSQL / Vercel (bom1 — Mumbai)
**Budget Target:** Under $20/month

---

## Integration Status Summary

| Category | Integration | Status | Details |
|---|---|---|---|
| Auth | Google OAuth | :warning: Partial | NextAuth v5 provider coded, env vars are placeholders — needs real Google Cloud credentials |
| Auth | Phone OTP | :warning: Partial | Mock mode only (hardcoded `123456` in `.env.example`, `auth.ts`, `otp/route.ts`) — no real SMS provider |
| Maps | Google Maps | :x: Missing | No SDK, no API key usage, no map components |
| Maps | Pickup Location | :warning: Partial | Text-only `pickupCity` / `pickupPoint` fields in DB — no map picker or autocomplete |
| Maps | Geocoding | :x: Missing | No geocoding implementation, no lat/lng in schema |
| Payments | Razorpay | :warning: Partial | SDK integrated (`razorpay@2.9.6`), order creation + signature verification coded, test placeholder keys |
| Payments | Razorpay Webhooks | :x: Missing | No webhook endpoint — payment status relies on client-side verification only |
| Storage | Cloudinary | :warning: Partial | Env vars defined, `next.config.ts` image domain whitelisted, but NO upload code — selfies/avatars stored as data URLs |
| Storage | DigitalOcean Spaces | :x: Missing | Not implemented |
| Notifications | Firebase FCM | :x: Missing | Env vars in `.env.example` but NO Firebase SDK imported, `public/sw.js` handles caching only, no push handler |
| Notifications | Email Service | :x: Missing | No email library (Resend/SendGrid/nodemailer) installed |
| Notifications | SMS Provider | :x: Missing | No Twilio/MSG91 — `OTP_SERVICE_API_KEY` is an empty placeholder |
| Communication | Socket.io | :warning: Partial | Packages installed (`socket.io@4.8.3` + `socket.io-client@4.8.3`), Prisma has ChatRoom/ChatMessage models, but NO socket server or client implementation |
| Analytics | Google Analytics | :x: Missing | No gtag, GA4, or analytics script |
| Analytics | PostHog | :x: Missing | Not installed |
| Monitoring | Sentry | :x: Missing | No Sentry SDK, no error tracking |
| Deployment | Vercel | :white_check_mark: Configured | `vercel.json` with `bom1` region, security headers, service worker caching |
| Deployment | SSL | :white_check_mark: Configured | Automatic via Vercel |
| Deployment | Custom Domain | :warning: Partial | Region set, but custom domain not confirmed |
| Database | PostgreSQL + Prisma | :white_check_mark: Configured | 797-line schema, 25+ models, migrations, NextAuth adapter |
| Backups | Database Backups | :x: Missing | No backup scripts or automation |

### Score: 4 Configured / 7 Partial / 11 Missing

---

## Key Files Reference

| File | What It Contains |
|---|---|
| `src/lib/auth.ts` | NextAuth config — Google provider + OTP CredentialsProvider (mock) |
| `src/app/api/otp/route.ts` | OTP generation — mock "123456" |
| `src/app/api/payments/route.ts` | Razorpay order creation (POST) + payment verification (PUT) |
| `src/app/(booking)/[tripId]/payment/page.tsx` | Razorpay checkout frontend integration |
| `src/app/(main)/profile/edit/page.tsx` | Avatar upload — stores as data URL (no Cloudinary) |
| `public/sw.js` | Service worker — caching only, no push |
| `src/app/(onboarding)/permissions/page.tsx` | Push permission UI exists but no FCM registration |
| `prisma/schema.prisma` | Full schema — User, Trip, Booking, Payment, Wallet, Chat, etc. |
| `vercel.json` | Deployment config — bom1 region, headers |
| `.env.example` | All env var placeholders including unused Firebase/Cloudinary/OTP keys |

---

## Cost-Effective Recommendations (Under $20/month)

### Tier 1: FREE — Use Immediately

| Service | Recommendation | Free Tier | Monthly Cost |
|---|---|---|---|
| Deployment | **Vercel** (keep current) | Hobby: 100GB bandwidth, serverless | $0 |
| Database | **Supabase** or **Neon** | 500MB–10GB free PostgreSQL | $0 |
| Auth (Google) | **Google Cloud OAuth** | Free for OAuth consent | $0 |
| SSL | **Vercel** auto-SSL | Included | $0 |
| Analytics | **PostHog Cloud** | 1M events/month | $0 |
| Error Monitoring | **Sentry** | 5K errors/month | $0 |
| Email | **Resend** | 3,000 emails/month | $0 |
| Push Notifications | **Firebase FCM** | Unlimited | $0 |
| Maps | **Google Maps Platform** | $200/month free credit | $0 |

### Tier 2: Very Cheap — Add When Needed

| Service | Recommendation | Cost |
|---|---|---|
| SMS/OTP | **MSG91** | ~$0.002/SMS (cheapest for India) |
| Storage | **Cloudinary** | Free: 25GB storage + 25GB bandwidth |
| Domain | **.com domain** | ~$10–12/year (~$1/month) |

### Tier 3: Skip For Now — Add At Scale

| Service | Why Skip |
|---|---|
| Socket.io real-time chat | REST polling works fine for <1K users |
| DigitalOcean Droplet | Vercel is simpler and free at this stage |
| Nginx / PM2 | Not needed with Vercel |
| PostHog self-hosted | Cloud free tier is sufficient |
| Automated DB backups | Use Supabase/Neon built-in daily backups (included in free tier) |

### Estimated Total: $1–5/month

- Domain: ~$1/month
- SMS (MSG91): ~$1–3/month for <1K users
- Everything else: FREE tier

---

## Priority Order for Implementation

| # | Integration | Why This Priority |
|---|---|---|
| 1 | **SMS Provider (MSG91)** | OTP login is broken without real SMS delivery |
| 2 | **Cloudinary upload code** | Avatar/selfie uploads don't work (stored as data URLs) |
| 3 | **Razorpay production keys + webhooks** | Payments need server-side webhook verification, not just client-side |
| 4 | **Resend for emails** | Booking confirmations, receipts, password resets |
| 5 | **Sentry** | Need error visibility before launch |
| 6 | **PostHog** | Track user behavior from day 1 |
| 7 | **Google Maps** | Location picker for pickup points (if needed for MVP) |
| 8 | **Firebase FCM** | Push notifications (nice to have, not blocking) |

---

## Critical Issues for Launch

1. **OTP is fake** — No user can actually log in via phone without a real SMS provider
2. **No payment webhooks** — If Razorpay's client-side callback fails, payment status is lost
3. **Images stored as data URLs** — Will bloat the database and break at scale
4. **No error monitoring** — You won't know when things break in production
5. **No email capability** — Can't send booking confirmations or receipts

---

*This is an audit-only document. No code changes were made.*
