# Technical Architecture Specification
## Hospital Appointment Management System

**Document Version:** 1.1.0 (Corrected Specification)  
**Pattern:** Modular Monolith (Next.js App Router)  
**Target Audience:** Engineering Team & Maintenance Developers  

---

## 1. Technology Stack

- **Frontend Framework:** Next.js (App Router, Server Components & Client Components)
- **Language:** TypeScript (Strict Type Checking)
- **Styling:** Tailwind CSS + shadcn/ui (Radix UI primitives)
- **State & Forms:** React Hook Form + Zod (Validation)
- **Authentication:** **NextAuth.js (Auth.js v5)** using Credentials Provider, Prisma Adapter, bcryptjs, and JWT session handling in HTTP-only cookies.
- **Database & ORM:** PostgreSQL + Prisma ORM
- **Testing:** Playwright (End-to-End & Concurrency), Vitest / Node Test Runner (Unit & Domain Logic)

> **Architectural Constraint:** Explicitly excludes microservices, Redis, Kafka, Kubernetes, GraphQL, or separate backend apps. This is a single, clean, maintainable modular monolith suitable for beginner maintenance and extension.

---

## 2. Conceptual Layered Architecture

```
                       ┌───────────────────────────────────────────┐
                       │          Client Browser (User UI)         │
                       └─────────────────────┬─────────────────────┘
                                             │
                                             ▼
                       ┌───────────────────────────────────────────┐
                       │            Next.js App Router             │
                       └─────────────────────┬─────────────────────┘
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
          ┌───────────────────────────┐               ┌───────────────────────────┐
          │  React Server Components  │               │     Client Components     │
          │   (Data Fetching/Layout)  │               │   (Interactive Forms/UI)  │
          └────────────┬──────────────┘               └────────────┬──────────────┘
                       │                                           │
                       └─────────────────────┬─────────────────────┘
                                             │ Calls Server Actions / Route Handlers
                                             ▼
                       ┌───────────────────────────────────────────┐
                       │ Authentication Layer (NextAuth.js v5)     │
                       │ & Server-Side RBAC Middleware             │
                       └─────────────────────┬─────────────────────┘
                                             │
                                             ▼
                       ┌───────────────────────────────────────────┐
                       │  Input Validation Layer (Zod Schemas)     │
                       └─────────────────────┬─────────────────────┘
                                             │
                                             ▼
                       ┌───────────────────────────────────────────┐
                       │   Domain / Business Logic Layer (Pure)    │
                       │   - Fixed 30-Min Slot Computation         │
                       │   - State Transitions (BOOKED/CONFIRMED...)│
                       │   - Concurrency Guards                    │
                       └─────────────────────┬─────────────────────┘
                                             │
                                             ▼
                       ┌───────────────────────────────────────────┐
                       │      Database Access Layer (Prisma)       │
                       └─────────────────────┬─────────────────────┘
                                             │
                                             ▼
                       ┌───────────────────────────────────────────┐
                       │          PostgreSQL Database              │
                       └───────────────────────────────────────────┘
```

### Layer Responsibilities Matrix

| Layer | Primary Responsibility | What Belongs Here | What DOES NOT Belong Here |
| :--- | :--- | :--- | :--- |
| **Server Components** | Server-side rendering, direct initial data fetching, page layouts. | Page layouts, data fetching calls to services, initial state rendering. | DB mutations, complex state management, event listeners. |
| **Client Components** | Interactive UI elements, forms, event handlers. | Form inputs, dialogs, buttons, client-side state (`useState`, `useForm`). | Direct Prisma queries, business rules, raw password hashing. |
| **Server Actions** | Handlers for client form submissions & mutations. | Orchestration of auth check, validation, service invocation, revalidation. | Raw SQL string building, business logic calculation loops. |
| **Auth & RBAC (NextAuth)**| Identity verification and role authorization. | NextAuth session verification, JWT cookies, role permission checks (`PATIENT`, `DOCTOR`, `ADMIN`). | Form styling, UI rendering, DB data transformation. |
| **Domain Logic** | Core business rules & algorithms. | Fixed 30-min slot generation math, status state machine rules, cancellation policy checks. | React code, HTTP status codes, Prisma model definitions. |
| **Database (Prisma)**| Data persistence & ACID transactions. | Models, relations, indexes, atomic transactions, row locks. | Business validation logic, UI routing logic. |

---

## 3. Recommended Folder Structure

```
src/
├── app/                        # Next.js App Router (Routing & Pages)
│   ├── (auth)/                 # Unauthenticated layout group (login, register)
│   ├── (dashboard)/            # Authenticated base layout group
│   │   ├── patient/            # Patient pages (/patient/doctors, /patient/appointments)
│   │   ├── doctor/             # Doctor pages (/doctor/schedule, /doctor/appointments)
│   │   └── admin/              # Admin pages (/admin/departments, /admin/doctors)
│   ├── api/                    # Route handlers (NextAuth endpoint: /api/auth/[...nextauth])
│   ├── layout.tsx              # Root HTML/Tailwind layout
│   └── page.tsx                # Public home landing page
├── components/                 # Reusable UI components
│   ├── ui/                     # Basic primitive components (shadcn/ui: Button, Input, Card)
│   ├── shared/                 # Cross-feature components (Header, Footer, Sidebar, StatusBadge)
│   └── feedback/               # Loading skeletons, empty state displays, error banners
├── features/                   # Domain Modules (Colocated feature logic)
│   ├── auth/                   # NextAuth config, auth actions, login/register forms, schemas
│   ├── users/                  # Patient & Doctor profile management
│   ├── departments/            # Department CRUD services & schemas
│   ├── availability/           # Weekly working hours & date block logic
│   └── appointments/           # Fixed 30-min slot generator, state machine, booking actions
├── server/                     # Core backend infrastructure
│   ├── db/                     # Prisma client singleton instance
│   ├── security/               # NextAuth session helpers, RBAC permission checkers
│   └── errors/                 # Custom Domain Error classes & error map
├── lib/                        # Shared utility functions
│   ├── utils.ts                # Tailwind class merger (`cn`), string formatters
│   └── date-utils.ts           # Fixed slot grid math, Hospital local timezone (`Asia/Kolkata`)
├── types/                      # Shared TypeScript type declarations & interfaces
└── config/                     # Application configuration constants (roles, system settings)
```

---

## 4. Domain Modules Breakdown

### 4.1 Authentication & Authorization Module (`src/features/auth`)
- **Responsibility:** User credential verification, NextAuth.js JWT session issuance, session resolution, role verification.
- **Main Operations:** `signIn()`, `signOut()`, `registerPatient()`, `auth()`.
- **Access:** Public (Login/Register), Authenticated users (Session check).

### 4.2 Department Module (`src/features/departments`)
- **Responsibility:** Medical specialty management (Cardiology, Pediatrics, etc.).
- **Main Operations:** `getDepartments()`, `createDepartment()`, `updateDepartment()`, `toggleDepartmentStatus()`.
- **Access:** Read (Public/Patient), Write (Admin only).

### 4.3 Doctor Availability & Exceptions Module (`src/features/availability`)
- **Responsibility:** Weekly working hours configuration (fixed 30-min slot grid) and custom blocked date overrides.
- **Main Operations:** `getDoctorAvailability()`, `saveWeeklyAvailability()`, `createBlockedDate()`, `deleteBlockedDate()`.
- **Access:** Doctor (Own availability), Admin (View/Edit), Patient (Read computed available slots only).

### 4.4 Appointment & Slot Booking Engine Module (`src/features/appointments`)
- **Responsibility:** Fixed 30-minute slot generation algorithm, atomic reservation transaction, state machine transition enforcement (`BOOKED`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`), appointment query services.
- **Main Operations:** `getAvailableSlots()`, `bookAppointment()`, `updateAppointmentStatus()`, `cancelAppointment()`.
- **Access:** Patient (Book/Cancel own), Doctor (View/Status update own), Admin (System-wide view/override).

---

## 5. Architecture Explained for a Beginner

When a patient uses this system to book an appointment, here is the exact sequence of events that happens step-by-step:

```
[1. User Action in Browser]
Patient clicks fixed 30-min slot "10:00 - 10:30 AM" and clicks "Confirm Booking".
       │
       ▼
[2. Next.js Server Action Call]
The browser sends a secure request directly to a Next.js Server Action (`bookAppointmentAction`).
       │
       ▼
[3. Authentication & RBAC Check]
NextAuth.js verifies the session token: "Is this user logged in? Are they a PATIENT?"
       │
       ▼
[4. Input Validation (Zod)]
Zod validates the input: "Is the date valid? Is doctorId a valid UUID? Is startTime on the 30-min grid (10:00:00)?"
       │
       ▼
[5. Business & Slot Verification]
The system checks:
- Is 10:00 AM within Dr. Smith's Monday working hours?
- Is Dr. Smith on leave today?
- Is 10:00 AM in the past relative to Hospital Local Time (`Asia/Kolkata`)?
       │
       ▼
[6. Database Transaction & Row Lock]
Prisma opens an atomic transaction with PostgreSQL:
- It checks if any ACTIVE appointment (`BOOKED` or `CONFIRMED`) already exists for Dr. Smith at 10:00 AM today.
       │
       ▼
[7. Database Write / Constraint Enforcement]
If FREE ➔ Prisma inserts a new `Appointment` record (Status: `BOOKED`).
If CONCURRENTLY TAKEN ➔ PostgreSQL rejects the insertion via the Partial Unique Index (`WHERE status IN ('BOOKED', 'CONFIRMED')`).
       │
       ▼
[8. Response to User Interface]
The server returns success or a friendly error. The browser updates the UI instantly to show the appointment confirmation badge!
```
