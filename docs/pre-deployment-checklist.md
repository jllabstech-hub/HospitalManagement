# Pre-Deployment Checklist (Vercel + Neon PostgreSQL)

This checklist must be reviewed before deploying the **Hospital Appointment Management System** to production.

---

## 1. Application & Codebase Verification

- [x] **Local Build Verification:** `npm run build` (`prisma generate && next build`) succeeds cleanly without errors.
- [x] **Unit & Integration Test Suite:** `npm test` passes 100% (17/17 test files, 90/90 tests).
- [x] **Static Code Analysis:** `npm run lint` returns 0 warnings and 0 errors.
- [x] **Version Control Secrets Check:** No secret credentials (`DATABASE_URL`, `AUTH_SECRET`) committed in Git tracking.
- [x] **Environment File Configuration:** `.env` is listed in `.gitignore`; `.env.example` contains safe placeholders.
- [x] **Production Seed Safety Guard:** `prisma/seed.ts` halts automatically if `NODE_ENV === 'production'`.

---

## 2. Infrastructure Provisioning (User Action Required)

- [ ] **Neon PostgreSQL Database:** Provisioned on [Neon.tech](https://neon.tech) with SSL (`sslmode=require`).
- [ ] **Database Connection String:** Connection string obtained and configured in Vercel environment settings.
- [ ] **Production Migration:** `npx prisma migrate deploy` executed against Neon database.
- [ ] **Vercel Project Creation:** Connected Git repository to Vercel with framework preset **Next.js**.

---

## 3. Production Environment Variables Checklist

- [ ] **`DATABASE_URL`:** Neon connection string (`postgresql://...sslmode=require`).
- [ ] **`AUTH_SECRET`:** 64-byte high-entropy string generated for production.
- [ ] **`NEXTAUTH_SECRET`:** Configured to match `AUTH_SECRET`.
- [ ] **`NODE_ENV`:** Set to `"production"`.
- [ ] **`NEXT_PUBLIC_APP_URL`:** Set to canonical HTTPS production domain (`https://<your-app>.vercel.app`).
- [ ] **`NEXT_PUBLIC_HOSPITAL_TIMEZONE`:** Set to `"Asia/Kolkata"`.

---

## 4. Post-Deployment Verification (User Action Required)

- [ ] **Health Endpoint:** `GET /api/health` returns `{"status":"ok","database":"connected"}`.
- [ ] **Patient Registration & Login:** Patient account registration and login verified on production URL.
- [ ] **Doctor Discovery & Booking:** Slot rendering and appointment booking verified.
- [ ] **Double-Booking Protection:** PostgreSQL partial unique index `unique_active_doctor_slot` verified active on Neon.
