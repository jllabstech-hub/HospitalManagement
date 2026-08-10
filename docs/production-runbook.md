# Production Operational Runbook (Phase 7G)

This runbook provides step-by-step procedures for managing operational incidents, database restores, application rollbacks, and bootstrap routines for the **Hospital Appointment Management System**.

---

## 1. Initial Production Admin Bootstrap Procedure
When deploying to a fresh database:
1. Register an initial user via the `/register` portal or run a secure one-time bootstrap script.
2. Manually promote the user role to `ADMIN` in PostgreSQL:
   ```sql
   UPDATE "User" SET role = 'ADMIN' WHERE email = 'admin@yourhospital.com';
   ```
3. Securely deliver initial credentials to authorized hospital administrators.

---

## 2. Health Monitoring & Diagnostics
- **Health Check Endpoint:** `GET /api/health`
- **Response Format:**
  - **Healthy (HTTP 200):** `{"status":"ok","database":"connected"}`
  - **Degraded (HTTP 503):** `{"status":"degraded","database":"disconnected"}`

---

## 3. Incident Response Procedures

### A. Application Down or Unresponsive
1. Inspect hosting provider container logs for startup errors or uncaught exceptions.
2. Verify environment variables (`DATABASE_URL`, `AUTH_SECRET`, `NODE_ENV`).
3. Query `GET /api/health` to confirm database connectivity.
4. Restart application worker process (`npm run start`).

### B. Database Disconnection or Migration Failures
1. Verify PostgreSQL server status and SSL connection string.
2. Check connection limits on PostgreSQL host.
3. Run diagnostic check: `npx prisma migrate status`.
4. Ensure no unapplied migrations exist. Run `npx prisma migrate deploy` if required.

### C. Booking Conflict / Double Booking Investigation
1. Verify presence of PostgreSQL partial unique index:
   ```sql
   SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'Appointment' AND indexname = 'unique_active_doctor_slot';
   ```
2. Verify index definition: `("doctorId", "appointmentDate", "startTime") WHERE status IN ('BOOKED', 'CONFIRMED')`.

---

## 4. Application Rollback Protocol
If a bad code deployment occurs:
1. **Redeploy Previous Application Build:** Roll back to the previous stable Git commit or container artifact.
2. **Verify Database Compatibility:** Prisma schema changes are backward-compatible. Do NOT attempt to roll back PostgreSQL migrations automatically.
3. **Verify Health:** Query `GET /api/health` to confirm successful recovery.
