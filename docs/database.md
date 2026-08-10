# Database Data Model & Schema Specification
## Hospital Appointment Management System

**Document Version:** 1.0.0  
**Database System:** PostgreSQL 15+  
**ORM:** Prisma ORM  

---

## 1. Identifier Strategy (UUID v4)

All primary keys use **UUID v4** (`uuid_generate_v4()` in PostgreSQL / `gen_random_uuid()` / Prisma `@default(uuid())`).

### Rationale:
- Prevents auto-increment enumeration attacks (e.g., `/patient/appointments/101` vs `/patient/appointments/102`).
- Safe for distributed generation without primary key collision risks.
- Clean separation between internal database identity and external URL references.

---

## 2. User & Profile Data Architecture

```
                       ┌─────────────────────────┐
                       │          User           │
                       │ ----------------------- │
                       │ id (PK)                 │
                       │ email (UNIQUE)          │
                       │ passwordHash            │
                       │ role (PATIENT/DOCTOR/   │
                       │       ADMIN)            │
                       │ isActive (BOOLEAN)      │
                       └────────────┬────────────┘
                                    │ 1:1
            ┌───────────────────────┴───────────────────────┐
            │ (Role = PATIENT)                              │ (Role = DOCTOR)
            ▼                                               ▼
┌─────────────────────────┐                     ┌─────────────────────────┐
│     PatientProfile      │                     │      DoctorProfile      │
│ ----------------------- │                     │ ----------------------- │
│ id (PK)                 │                     │ id (PK)                 │
│ userId (FK, UNIQUE)     │                     │ userId (FK, UNIQUE)     │
│ fullName                │                     │ fullName                │
│ phoneNumber             │                     │ phoneNumber             │
│ dateOfBirth             │                     │ departmentId (FK)       │
│ gender                  │                     │ qualification           │
│ emergencyContact        │                     │ experienceYears         │
└─────────────────────────┘                     │ bio                     │
                                                │ consultationFee         │
                                                └─────────────────────────┘
```

### Roles & Profile Separation Rules:
1. `User` table holds authentication and authorization primitives (`id`, `email`, `passwordHash`, `role`, `isActive`).
2. `PATIENT` role links 1:1 with `PatientProfile`.
3. `DOCTOR` role links 1:1 with `DoctorProfile`.
4. `ADMIN` role does not require a secondary profile table (administrative details reside on `User`).
5. **Deactivation (`isActive = false`):** Disabled users cannot log in. Disabled doctors are hidden from public search but retain historical appointment records intact.

---

## 3. Detailed Entity Definitions

### 3.1 `User` Table
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK`, `default(uuid())` | Primary key |
| `email` | `VARCHAR(255)` | `NOT NULL`, `UNIQUE` | User email / login identifier |
| `passwordHash` | `VARCHAR(255)` | `NOT NULL` | Argon2 / bcrypt hashed password |
| `role` | `ENUM` | `NOT NULL` | Roles: `'PATIENT'`, `'DOCTOR'`, `'ADMIN'` |
| `isActive` | `BOOLEAN` | `NOT NULL`, `DEFAULT true` | Status flag for deactivation |
| `createdAt` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()`| Record creation timestamp |
| `updatedAt` | `TIMESTAMPTZ` | `NOT NULL` | Auto-updated timestamp |

### 3.2 `PatientProfile` Table
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK`, `default(uuid())` | Primary key |
| `userId` | `UUID` | `NOT NULL`, `FK(User.id)`, `UNIQUE` | 1:1 relationship to User |
| `fullName` | `VARCHAR(150)` | `NOT NULL` | Full legal name |
| `phoneNumber` | `VARCHAR(20)` | `NOT NULL` | Contact phone number |
| `dateOfBirth` | `DATE` | `NOT NULL` | Date of birth |
| `gender` | `VARCHAR(20)` | `NOT NULL` | Patient gender |
| `emergencyContact`| `VARCHAR(20)`| `NULLABLE` | Optional emergency contact |
| `createdAt` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()`| Record creation timestamp |
| `updatedAt` | `TIMESTAMPTZ` | `NOT NULL` | Auto-updated timestamp |

### 3.3 `Department` Table
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK`, `default(uuid())` | Primary key |
| `name` | `VARCHAR(100)` | `NOT NULL`, `UNIQUE` | Department name (e.g. Cardiology) |
| `description` | `TEXT` | `NULLABLE` | Summary of department services |
| `isActive` | `BOOLEAN` | `NOT NULL`, `DEFAULT true` | Disabled status flag |
| `createdAt` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()`| Record creation timestamp |
| `updatedAt` | `TIMESTAMPTZ` | `NOT NULL` | Auto-updated timestamp |

> **Department Disabling Rule:** Setting `Department.isActive = false` hides the department from patient search. Doctors belonging to the department cannot be booked for new appointments. Existing booked appointments remain preserved.

### 3.4 `DoctorProfile` Table
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK`, `default(uuid())` | Primary key |
| `userId` | `UUID` | `NOT NULL`, `FK(User.id)`, `UNIQUE` | 1:1 relationship to User |
| `departmentId` | `UUID` | `NOT NULL`, `FK(Department.id)` | Belonging medical department |
| `fullName` | `VARCHAR(150)` | `NOT NULL` | Doctor display name with title |
| `phoneNumber` | `VARCHAR(20)` | `NOT NULL` | Direct phone number |
| `qualification` | `VARCHAR(150)` | `NOT NULL` | Degrees (e.g. MBBS, MD Cardiology) |
| `experienceYears`| `INT` | `NOT NULL`, `DEFAULT 0` | Years of medical practice |
| `bio` | `TEXT` | `NULLABLE` | Professional biography |
| `createdAt` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()`| Record creation timestamp |
| `updatedAt` | `TIMESTAMPTZ` | `NOT NULL` | Auto-updated timestamp |

### 3.5 `WeeklyAvailability` Table
Represents recurring weekly working hours for a doctor.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK`, `default(uuid())` | Primary key |
| `doctorId` | `UUID` | `NOT NULL`, `FK(DoctorProfile.id)` | Associated doctor |
| `dayOfWeek` | `INT` | `NOT NULL` | `0` (Sun) through `6` (Sat) |
| `startTime` | `TIME` | `NOT NULL` | Opening time (e.g. `09:00:00`) |
| `endTime` | `TIME` | `NOT NULL` | Closing time (e.g. `13:00:00`) |
| `slotDurationMinutes`| `INT` | `NOT NULL`, `DEFAULT 30` | Slot block length in minutes |
| `createdAt` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()`| Record creation timestamp |
| `updatedAt` | `TIMESTAMPTZ` | `NOT NULL` | Auto-updated timestamp |

#### Availability Rules & Validation:
- `startTime < endTime`.
- No overlapping `(startTime, endTime)` ranges for the same `doctorId` and `dayOfWeek`.
- Supports split shifts (e.g., Morning 09:00-12:00, Afternoon 14:00-17:00 as 2 rows).

### 3.6 `BlockedDate` Table (Date/Time Overrides)
Overrides recurring weekly availability for holidays, leave, or partial-day blocks.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK`, `default(uuid())` | Primary key |
| `doctorId` | `UUID` | `NOT NULL`, `FK(DoctorProfile.id)` | Associated doctor |
| `startDate` | `DATE` | `NOT NULL` | Block start date |
| `endDate` | `DATE` | `NOT NULL` | Block end date (inclusive) |
| `startTime` | `TIME` | `NULLABLE` | If set, blocks partial day from start |
| `endTime` | `TIME` | `NULLABLE` | If set, blocks partial day to end |
| `reason` | `VARCHAR(255)`| `NULLABLE` | E.g. "Medical Conference", "Vacation" |
| `createdAt` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()`| Record creation timestamp |
| `updatedAt` | `TIMESTAMPTZ` | `NOT NULL` | Auto-updated timestamp |

#### Interaction Rule:
If `startTime` and `endTime` are `NULL`, the doctor is blocked for the **entire day** (`startDate` to `endDate`). If populated, only slots within that time range on those dates are excluded.

### 3.7 `Appointment` Table
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK`, `default(uuid())` | Primary key |
| `patientId` | `UUID` | `NOT NULL`, `FK(PatientProfile.id)` | Booking patient |
| `doctorId` | `UUID` | `NOT NULL`, `FK(DoctorProfile.id)` | Assigned doctor |
| `appointmentDate`| `DATE` | `NOT NULL` | Calendar date of appointment |
| `startTime` | `TIME` | `NOT NULL` | Slot start time (e.g. `10:00:00`) |
| `endTime` | `TIME` | `NOT NULL` | Slot end time (e.g. `10:30:00`) |
| `status` | `ENUM` | `NOT NULL`, `DEFAULT 'SCHEDULED'` | Status: `SCHEDULED`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `NO_SHOW` |
| `reason` | `TEXT` | `NULLABLE` | Patient chief complaint / notes |
| `cancellationReason`| `TEXT` | `NULLABLE` | Reason provided if cancelled |
| `cancelledBy` | `ENUM` | `NULLABLE` | Roles: `'PATIENT'`, `'DOCTOR'`, `'ADMIN'` |
| `createdAt` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()`| Record creation timestamp |
| `updatedAt` | `TIMESTAMPTZ` | `NOT NULL` | Auto-updated timestamp |

---

## 4. CRITICAL: Concurrency & Double-Booking Prevention Strategy

### 4.1 Problem Analysis of Plain `UNIQUE(doctorId, appointmentDate, startTime)`
If we use a simple database `UNIQUE(doctorId, appointmentDate, startTime)` constraint across all rows, then after Patient A cancels an appointment at 10:00 AM on August 15, Patient B would be **blocked** by the database from re-booking that exact same 10:00 AM slot because a row with that `(doctorId, date, start_time)` still exists in the table with `status = 'CANCELLED'`.

### 4.2 Chosen Architectural Solution: Partial Unique Index + Transaction Locks

We implement a **PostgreSQL Partial Unique Index** combined with **Prisma Atomic Interactive Transactions**.

#### PostgreSQL SQL Definition (Applied via Prisma Migration):
```sql
CREATE UNIQUE INDEX "unique_active_doctor_slot"
ON "Appointment" ("doctorId", "appointmentDate", "startTime")
WHERE status IN ('SCHEDULED', 'CONFIRMED');
```

#### Why This Solution Is Superior:
1. **Allows Slot Rebooking:** If an appointment status changes to `CANCELLED` or `NO_SHOW`, it is no longer covered by the partial index condition (`WHERE status IN ('SCHEDULED', 'CONFIRMED')`). Therefore, a new patient can immediately book that slot!
2. **Absolute Database-Level Concurrency Protection:** If two concurrent HTTP requests try to book the exact same doctor slot at the exact same millisecond:
   - PostgreSQL serializes the index insertion.
   - The first transaction succeeds.
   - The second transaction triggers a `P2002` (Unique Constraint Violation) error in Prisma.
3. **Overlapping Slot Range Guard:** In addition to start-time checks, the booking Server Action performs a transactional overlap check within an explicit interactive transaction:
```typescript
await prisma.$transaction(async (tx) => {
  const existingOverlap = await tx.appointment.findFirst({
    where: {
      doctorId,
      appointmentDate,
      status: { in: ['SCHEDULED', 'CONFIRMED'] },
      OR: [
        { startTime: { lte: startTime }, endTime: { gt: startTime } },
        { startTime: { lt: endTime }, endTime: { gte: endTime } }
      ]
    }
  });

  if (existingOverlap) {
    throw new DomainError('SLOT_NOT_AVAILABLE', 'This slot overlaps with an existing active appointment.');
  }

  return tx.appointment.create({ /* data */ });
});
```

If a race condition occurs, PostgreSQL's partial index acts as the ultimate fail-safe guarantee.

---

## 5. Indexing & Performance Optimization

To ensure fast query response times under high load, the following database indexes are applied:

1. `PatientProfile(userId)` - Fast login and profile lookup.
2. `DoctorProfile(userId, departmentId)` - Fast department filtering and profile resolution.
3. `WeeklyAvailability(doctorId, dayOfWeek)` - Instant availability window loading.
4. `BlockedDate(doctorId, startDate, endDate)` - Rapid exception lookup for slot rendering.
5. `Appointment(patientId, appointmentDate)` - Fast patient dashboard history rendering.
6. `Appointment(doctorId, appointmentDate)` - Fast doctor daily schedule rendering.
7. `Appointment(doctorId, appointmentDate, startTime) WHERE status IN ('SCHEDULED', 'CONFIRMED')` - Double-booking constraint.
