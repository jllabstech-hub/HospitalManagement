# Database Architecture & Reliability Hardening Guide (Phase 7B)

## 1. Complete Database Schema Inventory

| Table | Primary Key | Foreign Keys | Unique Constraints | Nullable Fields | Referential Action (`onDelete`) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`User`** | `id` (UUID) | None | `email` | None | N/A |
| **`PatientProfile`** | `id` (UUID) | `userId` → `User.id` | `userId` | `emergencyContact` | `onDelete: Cascade` |
| **`Department`** | `id` (UUID) | None | `name` | `description` | N/A |
| **`DoctorProfile`** | `id` (UUID) | `userId` → `User.id`<br>`departmentId` → `Department.id` | `userId` | `bio` | `userId`: `Cascade`<br>`departmentId`: `Restrict` |
| **`WeeklyAvailability`** | `id` (UUID) | `doctorId` → `DoctorProfile.id` | None | None | `onDelete: Cascade` |
| **`BlockedDate`** | `id` (UUID) | `doctorId` → `DoctorProfile.id` | None | `startTime`, `endTime`, `reason` | `onDelete: Cascade` |
| **`Appointment`** | `id` (UUID) | `patientId` → `PatientProfile.id`<br>`doctorId` → `DoctorProfile.id` | `unique_active_doctor_slot` *(Partial)* | `reason`, `cancellationReason`, `cancelledBy` | `patientId`: `Restrict`<br>`doctorId`: `Restrict` |

---

## 2. Historical Data Preservation & Referential Integrity
- **Protection of Historical Appointments:** Foreign key relations from `Appointment` to `PatientProfile` and `DoctorProfile` strictly use `onDelete: Restrict`. This database constraint prevents hard deletion of doctor or patient records whenever historical appointments exist.
- **Soft Deactivation Strategy:** Account deactivation (`User.isActive = false`) and department deactivation (`Department.isActive = false`) are used for management workflows. Inactive accounts are blocked at authentication, preserving past appointment audit trails (`COMPLETED`, `CANCELLED`, `NO_SHOW`).

---

## 3. Double-Booking Concurrency Defense
- **PostgreSQL Partial Unique Index (`unique_active_doctor_slot`):**
  ```sql
  CREATE UNIQUE INDEX "unique_active_doctor_slot"
  ON "Appointment" ("doctorId", "appointmentDate", "startTime")
  WHERE "status" IN ('BOOKED', 'CONFIRMED');
  ```
- **Invariant Rules:**
  - `BOOKED` + `BOOKED` → **REJECTED (P2002)**
  - `BOOKED` + `CONFIRMED` → **REJECTED (P2002)**
  - `CONFIRMED` + `BOOKED` → **REJECTED (P2002)**
  - `CANCELLED` + `BOOKED` → **ALLOWED** (Released slot can be re-booked immediately)

---

## 4. Multi-Record Transaction Boundaries
1. **Doctor Account Creation (`createDoctorAction`):** Atomic `$transaction` creating `User` (`Role.DOCTOR`) + `DoctorProfile` + Default 5-day `WeeklyAvailability`. If any step fails, the entire transaction rolls back cleanly.
2. **Patient Registration (`registerPatientAction`):** Atomic `$transaction` creating `User` (`Role.PATIENT`) + `PatientProfile`.
3. **Transactional Appointment Booking (`bookAppointmentTransaction`):** Recomputes live availability in memory, attempts creation, and catches PostgreSQL constraint violation `P2002` to return domain code `SLOT_UNAVAILABLE`.

---

## 5. Read-Only Diagnostic Audit Script
A dedicated read-only integrity checker script is available at [`scratch/db-integrity-check.ts`](file:///e:/HopsitalAppointmentSystem/scratch/db-integrity-check.ts):
```bash
npx tsx scratch/db-integrity-check.ts
```
It audits:
1. Orphaned appointments (non-existent patients/doctors).
2. Active duplicate appointment slots.
3. Doctors assigned to inactive/non-existent departments.
4. Invalid appointment status values.
5. Non-30-minute duration anomalies.

---

## 6. Health & Readiness Endpoint
- **URL:** `GET /api/health`
- **Readiness Check:** Executes a lightweight database ping (`SELECT 1`).
- **Response Format:**
  - **Healthy (200):** `{"status":"ok","database":"connected","timestamp":"...","service":"..."}`
  - **Degraded (503):** `{"status":"degraded","database":"disconnected","timestamp":"...","service":"..."}` *(Safe response without exposing DATABASE_URL or credentials)*.

---

## 7. Migration & Backup Policy (Production Recommendations)
- **Zero Migration Drift:** Verified via `npx prisma migrate status`.
- **Non-Destructive Migrations:** Production deployments must use `npx prisma migrate deploy`. **NEVER** run `prisma migrate reset` in production environments.
- **Automated Backups:** `REQUIRES DEPLOYMENT CONFIGURATION`. Production PostgreSQL host (e.g. AWS RDS / Supabase / Neon / GCP Cloud SQL) must enable automated daily backups and Point-In-Time Recovery (PITR).
