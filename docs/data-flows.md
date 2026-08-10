# Application Data Flow Diagrams
## Hospital Appointment Management System

**Document Version:** 1.1.0 (Corrected Specification)  
**Target:** Data Lifecycle & Step-by-Step System Interactions  

---

## 1. Patient Registration Data Flow

```
Browser: User fills registration form (email, password, fullName, phone, DOB, gender)
  ↓
Server: Calls `registerPatientAction(payload)` Server Action
  ↓
Validation: Zod checks format (email syntax, password min 8 chars, phone length, DOB in past)
  ↓
Authorization: Open to public / unauthenticated users
  ↓
Business Logic:
  - Check if User email already exists in DB. If yes ➔ Return `EMAIL_EXISTS` error.
  - Hash password using `bcryptjs` (salt rounds 12).
  - Wrap User creation & PatientProfile creation in a single Prisma Transaction.
  ↓
Database:
  - INSERT INTO "User" (email, passwordHash, role='PATIENT')
  - INSERT INTO "PatientProfile" (userId, fullName, phoneNumber, dateOfBirth, gender)
  ↓
Response: NextAuth session established, return `{ success: true }`, redirect to `/patient/dashboard`
```

---

## 2. Patient Login Data Flow

```
Browser: User submits email & password
  ↓
Server: Handled by NextAuth `signIn('credentials', { email, password })`
  ↓
Validation: Zod validates email format & non-empty password
  ↓
Authorization: Open to public / unauthenticated users
  ↓
Business Logic:
  - NextAuth credentials authorize callback queries User by email.
  - Verify `user.isActive === true`. If false ➔ Return null / throw `ACCOUNT_DISABLED`.
  - Verify password hash via `bcrypt.compare()`. If mismatch ➔ Return null.
  - Attach `{ userId, role, patientProfileId, doctorProfileId }` to JWT token.
  ↓
Database: SELECT * FROM "User" WHERE email = payload.email
  ↓
Response: Issues HTTP-only, Secure JWT Cookie, redirects based on role:
  - PATIENT ➔ `/patient/dashboard`
  - DOCTOR  ➔ `/doctor/dashboard`
  - ADMIN   ➔ `/admin/dashboard`
```

---

## 3. Doctor Search Data Flow

```
Browser: Patient visits `/patient/doctors?departmentId=X&search=Smith`
  ↓
Server: Next.js React Server Component (`/patient/doctors/page.tsx`) renders on server
  ↓
Validation: Parse search parameters (departmentId as UUID, search query string)
  ↓
Authorization: Authenticated PATIENT session verified via NextAuth middleware
  ↓
Business Logic: Invoke `searchDoctors({ departmentId, query })` query service
  ↓
Database:
  SELECT dp.*, dept.name FROM "DoctorProfile" dp
  JOIN "User" u ON dp."userId" = u.id
  JOIN "Department" dept ON dp."departmentId" = dept.id
  WHERE u."isActive" = true 
    AND dept."isActive" = true
    AND (dp."departmentId" = departmentId OR departmentId IS NULL)
    AND (dp."fullName" ILIKE '%Smith%' OR dp."specialization" ILIKE '%Smith%')
  ↓
Response: Server Component renders doctor profile cards with "View Availability" buttons
```

---

## 4. Availability & Fixed Slot Computation Data Flow

```
Browser: Patient selects Date `2026-08-25` on Dr. Smith's profile page
  ↓
Server: Invokes `getAvailableSlots(doctorId, date)` function
  ↓
Validation: Ensure date is valid ISO format and not in the past relative to Hospital Timezone (`Asia/Kolkata`)
  ↓
Authorization: Authenticated PATIENT session verified via NextAuth
  ↓
Business Logic & Database:
  1. Fetch Doctor's `WeeklyAvailability` for `dayOfWeek(2026-08-25)` from DB.
  2. Fetch Doctor's `BlockedDate` entries covering `2026-08-25` from DB.
  3. Fetch existing `BOOKED` / `CONFIRMED` `Appointment` records for doctor on `2026-08-25` from DB.
  4. Run pure `computeSlots()` utility on 30-min grid:
     - Generate candidate 30-min slots across working hours (e.g. 09:00, 09:30, 10:00...).
     - Filter OUT candidate slots that fall within blocked date/time ranges.
     - Filter OUT candidate slots that match existing active (`BOOKED`/`CONFIRMED`) appointment start times.
     - Filter OUT slots that are already in the past.
  ↓
Response: Returns array of available 30-min time strings: `['09:00', '09:30', '11:00', '14:30']`
```

---

## 5. Appointment Booking Data Flow

```
Browser: Patient clicks slot `10:00 - 10:30 AM` and submits consultation reason
  ↓
Server: Calls `bookAppointmentAction(payload)` Server Action
  ↓
Validation: Zod validates doctorId, date, 30-min grid start time format, and reason length
  ↓
Authorization: NextAuth verifies PATIENT role
  ↓
Business Logic:
  - Re-verify slot availability against availability, blocked dates, and past time rules.
  - Open Prisma Transaction.
  - Perform check for existing `BOOKED` or `CONFIRMED` appointment on slot.
  ↓
Database:
  BEGIN TRANSACTION;
  SELECT * FROM "Appointment" WHERE "doctorId" = X AND "appointmentDate" = Y AND "startTime" = '10:00:00' AND status IN ('BOOKED', 'CONFIRMED');
  INSERT INTO "Appointment" (id, patientId, doctorId, appointmentDate, startTime, endTime, status='BOOKED', reason) VALUES (...);
  COMMIT;
  ↓
Response: If successful ➔ Return `{ success: true, id }`. If partial unique index violation (`P2002`) ➔ Return `SLOT_NOT_AVAILABLE` error toast.
```

---

## 6. Appointment Cancellation Data Flow

```
Browser: Patient or Doctor clicks "Cancel Appointment" on booking card
  ↓
Server: Calls `cancelAppointmentAction({ appointmentId, reason })` Server Action
  ↓
Validation: Validate appointmentId UUID and cancellationReason max length
  ↓
Authorization:
  - PATIENT can cancel only if `appointment.patientId === session.user.patientProfileId`.
  - DOCTOR can cancel only if `appointment.doctorId === session.user.doctorProfileId`.
  - ADMIN can cancel any appointment.
  ↓
Business Logic:
  - Verify appointment state: Only `BOOKED` or `CONFIRMED` appointments can be cancelled.
  - If PATIENT cancelling: Verify current time is at least 2 hours before slot start time.
  ↓
Database:
  UPDATE "Appointment"
  SET status = 'CANCELLED', cancellationReason = payload.reason, cancelledBy = session.user.role, updatedAt = NOW()
  WHERE id = payload.appointmentId;
  ↓
Response: Slot is freed in database; revalidate path cache; return updated appointment object.
```

---

## 7. Doctor Status Update Data Flow (`CONFIRMED` / `COMPLETED` / `NO_SHOW`)

```
Browser: Doctor clicks "Confirm" or "Mark Completed" on today's schedule dashboard
  ↓
Server: Calls `updateAppointmentStatusAction({ appointmentId, status: 'COMPLETED' })`
  ↓
Validation: Zod ensures target status is legal (`CONFIRMED`, `COMPLETED`, or `NO_SHOW`)
  ↓
Authorization: Verify logged-in user is DOCTOR and `appointment.doctorId === session.user.doctorProfileId`
  ↓
Business Logic:
  - Verify state transition machine:
    `BOOKED` ➔ `CONFIRMED`
    `CONFIRMED` ➔ `COMPLETED`
    `CONFIRMED` ➔ `NO_SHOW`
  ↓
Database:
  UPDATE "Appointment" SET status = 'COMPLETED', updatedAt = NOW() WHERE id = appointmentId;
  ↓
Response: Revalidate `/doctor/dashboard` path cache; UI badge updates to green `COMPLETED`.
```

---

## 8. Admin Doctor Creation Data Flow

```
Browser: Admin submits New Doctor form (email, password, fullName, departmentId, qualification, experience, phone)
  ↓
Server: Calls `createDoctorAction(payload)` Server Action
  ↓
Validation: Zod validates all fields, email format, departmentId presence
  ↓
Authorization: Enforce NextAuth `session.user.role === 'ADMIN'`
  ↓
Business Logic:
  - Verify department exists and is active.
  - Hash default password using `bcryptjs`.
  - Execute Prisma Transaction:
    1. Create `User` record with `role = 'DOCTOR'`.
    2. Create `DoctorProfile` linked to `userId` and `departmentId`.
    3. Seed default `WeeklyAvailability` (Mon-Fri 09:00 - 17:00, 30 min slots).
  ↓
Database:
  BEGIN TRANSACTION;
  INSERT INTO "User" ...
  INSERT INTO "DoctorProfile" ...
  INSERT INTO "WeeklyAvailability" (multiple rows)...
  COMMIT;
  ↓
Response: Return new doctor ID; revalidate `/admin/doctors`; UI displays newly onboarded doctor.
```
