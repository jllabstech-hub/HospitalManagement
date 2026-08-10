# Architectural Decision Records (ADRs)
## Hospital Appointment Management System

**Document Version:** 1.1.0 (Corrected Specification)  

---

### ADR-001: Next.js App Router as a Modular Monolith

- **Status:** Accepted  
- **Context:** The system requires a clean, maintainable architecture accessible to a beginner developer without managing complex infrastructure.
- **Decision:** Build the entire system as a single Next.js App Router monolithic application.
- **Alternatives Considered:** Separate React SPA frontend + Express/Node.js backend API; Microservices architecture.
- **Rationale for Rejection:** Separate frontend/backend doubles boilerplate, type definitions, and deployment complexity. Microservices introduce massive operational overhead (network latency, service discovery, container orchestration) that is completely unnecessary for an MVP hospital appointment system.

---

### ADR-002: PostgreSQL Database + Prisma ORM

- **Status:** Accepted  
- **Context:** Medical appointment booking requires relational integrity, strict foreign key constraints, ACID compliance, and concurrency guarantees.
- **Decision:** Standardize on PostgreSQL with Prisma ORM.
- **Alternatives Considered:** MongoDB / NoSQL, Raw `pg` SQL queries.
- **Rationale for Rejection:** Document databases (NoSQL) lack native relational integrity and complex multi-table transactional locking required to guarantee zero double bookings. Raw SQL queries increase vulnerability to SQL syntax mistakes and lack type safety compared to Prisma.

---

### ADR-003: Fixed-Duration Appointment Slots for MVP (30-Minute Grid)

- **Status:** Accepted  
- **Context:** The MVP must prevent double bookings and overlapping consultations. Allowing arbitrary, non-standard appointment start times (e.g. 10:15 - 10:45 overlapping a 10:00 - 10:30 appointment) introduces high complexity into database query logic and slot generation.
- **Decision:** Standardize all outpatient appointments on a **fixed 30-minute time grid** (e.g., 09:00-09:30, 09:30-10:00, 10:00-10:30). Arbitrary start times outside grid boundaries are strictly disallowed.
- **Alternatives Considered:** Dynamic variable appointment durations per booking (e.g., 15-min, 45-min, custom durations).
- **Rationale for Rejection:** Variable slot durations require expensive range-overlap SQL computations on every booking attempt and complicate double-booking prevention. A fixed 30-minute grid simplifies slot generation into pure mathematical arrays and guarantees that appointments can only overlap if they share the exact same `startTime` grid index.

---

### ADR-004: NextAuth.js (Auth.js v5) Authentication Strategy

- **Status:** Accepted  
- **Context:** Hand-crafting password hashing, JWT cookie issuance, CSRF protection, and session expiration logic in custom code introduces severe security risks and maintainability burdens for a beginner developer.
- **Decision:** Use **NextAuth.js v5 (Auth.js)** with Credentials Provider (`next-auth@beta`), `@auth/prisma-adapter`, `bcryptjs` password hashing, and encrypted JWT session cookies.
- **Alternatives Considered:** Custom authentication system built from scratch with manual JWT handling; Third-party hosted Auth SaaS (Clerk / Auth0).
- **Rationale for Rejection:** Custom authentication is error-prone and reinvents standard security protocols. Hosted Auth SaaS services introduce external vendor lock-in and monthly subscription costs. NextAuth.js is the standard open-source authentication library for Next.js, fully open-source, and seamlessly integrates with Prisma and Next.js middleware.

---

### ADR-005: PostgreSQL Partial Unique Index for Active Slot Concurrency Protection

- **Status:** Accepted  
- **Context:** The core business rule states that a doctor cannot have two active appointments booked for the exact same slot. A plain database `UNIQUE(doctorId, appointmentDate, startTime)` constraint across all rows prevents patients from re-booking a slot if a previous appointment was cancelled.
- **Decision:** Implement a **PostgreSQL Partial Unique Index** filtering active statuses:
  `UNIQUE("doctorId", "appointmentDate", "startTime") WHERE status IN ('BOOKED', 'CONFIRMED')`.
- **Alternatives Considered:**
  1. Plain unique constraint across all rows (Rejected: Blocks re-booking cancelled or no-show slots).
  2. Redis distributed locking (Rejected: Adds unnecessary infrastructure complexity; PostgreSQL partial index is 100% ACID compliant).
  3. Client-side availability checks alone (Rejected: Subject to race conditions under concurrent requests).

---

### ADR-006: Explicit Single Hospital Timezone Policy

- **Status:** Accepted  
- **Context:** Appointments represent physical or scheduled consultations tied to a specific hospital location. Relying on user device timezones introduces DST bugs and ambiguous slot comparisons.
- **Decision:** Standardize all slot computations, database stored dates, and business rule evaluations on an explicit **Hospital Local Timezone** configured via `NEXT_PUBLIC_HOSPITAL_TIMEZONE` (e.g., `Asia/Kolkata`).
- **Alternatives Considered:** Dynamic client-side timezone conversion.
- **Rationale for Rejection:** Consultations occur at the hospital location's local time. Standardizing on the hospital timezone guarantees 100% clarity for both patient and doctor without daylight savings confusion.

---

### ADR-007: Shared Zod Schema Validation Layer

- **Status:** Accepted  
- **Context:** Input must be validated consistently across client forms and server actions to guarantee security and user feedback.
- **Decision:** Use Zod schemas shared between client forms (via `@hookform/resolvers/zod`) and Server Actions.
- **Alternatives Considered:** Manual `if/else` checks, Yup, Joi.
- **Rationale for Rejection:** Zod offers first-class TypeScript inference, zero runtime dependencies, and flawless integration with both React Hook Form and Next.js Server Actions.
