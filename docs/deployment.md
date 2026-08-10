# Production Deployment & Configuration Guide (Phase 7C)

This document establishes the production deployment standards, environment configuration checklist, migration procedures, and operational checklists for the **Hospital Appointment Management System**.

---

## 1. Environment Variable Inventory & Classification

| Variable | Classification | Scope | Production Value Requirement | Secret? | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | **SERVER-ONLY** | Server | Remote PostgreSQL Connection String | **YES** | Format: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require` |
| `AUTH_SECRET` | **SECRET** | Server | Random 64-byte Base64/Hex string | **YES** | Secret key for signing Auth.js JWT session cookies |
| `NEXTAUTH_SECRET` | **SECRET** | Server | Random 64-byte string | **YES** | Fallback key for NextAuth runtime |
| `NODE_ENV` | **SERVER-ONLY** | Server | `"production"` | No | Sets Node runtime environment |
| `NEXT_PUBLIC_APP_URL` | **PUBLIC** | Client & Server | Canonical HTTPS URL (e.g. `https://hospital.example.com`) | No | Application root origin URL |
| `NEXT_PUBLIC_HOSPITAL_TIMEZONE` | **PUBLIC** | Client & Server | `"Asia/Kolkata"` | No | Fixed hospital timezone for 30-minute grid computations |

> [!IMPORTANT]
> **Secret Handling Rule:** Never prefix database connection strings, auth secrets, or credentials with `NEXT_PUBLIC_`. All production secrets must be configured via environment secret management in the deployment host.

---

## 2. Security Headers & Next.js Configuration
[`next.config.mjs`](file:///e:/HopsitalAppointmentSystem/next.config.mjs) applies standard security headers:
- `X-Frame-Options: DENY` (prevents clickjacking attacks)
- `X-Content-Type-Options: nosniff` (prevents MIME type sniffing)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

---

## 3. Seed Execution Safety Guard
[`prisma/seed.ts`](file:///e:/HopsitalAppointmentSystem/prisma/seed.ts) contains a safety guard blocking execution when `NODE_ENV="production"` unless `ALLOW_PRODUCTION_SEED="true"` is explicitly set. This prevents accidental wiping of production data.

---

## 4. Production Deployment Checklist

### A. Pre-Deployment Setup
- [ ] Managed PostgreSQL database provisioned with SSL (`sslmode=require`).
- [ ] Automated daily database backups & Point-In-Time Recovery (PITR) enabled.
- [ ] High-entropy 64-byte `AUTH_SECRET` generated.
- [ ] Canonical production domain (`NEXT_PUBLIC_APP_URL`) defined.

### B. Deployment Pipeline Steps
```bash
# 1. Install exact production dependencies using committed lockfile
npm ci

# 2. Generate Prisma ORM client
npx prisma generate

# 3. Apply versioned database migrations (NON-DESTRUCTIVE)
npx prisma migrate deploy

# 4. Build Next.js production bundle
npm run build

# 5. Start Next.js production server
npm run start
```

---

## 5. Post-Deployment Smoke Test Checklist

- [ ] **Liveness & Readiness Check:** Query `GET /api/health` → Verify HTTP 200 `{"status":"ok","database":"connected"}`.
- [ ] **Authentication Smoke Test:** Verify Patient/Doctor/Admin logins and error handling for invalid credentials.
- [ ] **Patient Doctor Search:** Verify active departments and active doctors display correctly.
- [ ] **Slot Retrieval:** Verify future dates calculate 30-minute available slots.
- [ ] **Transactional Booking:** Complete a test booking and verify database creation.
- [ ] **Cancellation Slot Release:** Verify cancelling an appointment releases the slot immediately for re-booking.
- [ ] **Admin Supervision:** Verify Admin directory filters and status summaries.

---

## 6. Readiness vs Liveness Summary
- **Liveness Endpoint:** `GET /api/health`
- **Readiness Check:** Performs `SELECT 1` ping against PostgreSQL. If the database is unreachable, returns HTTP 503 `{"status":"degraded","database":"disconnected"}` without leaking DATABASE_URL or stack traces.
