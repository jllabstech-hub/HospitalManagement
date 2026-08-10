# Software Requirements Specification (SRS)
## Hospital Appointment Management System

**Document Version:** 1.1.0 (Corrected Specification)  
**Status:** Approved Architecture Specification  
**Architecture Pattern:** Modular Monolith (Next.js App Router)  
**Target Audience:** Engineering Team & Product Stakeholders  

---

## 1. Product Overview

The **Hospital Appointment Management System** is a streamlined, user-friendly web platform designed to facilitate seamless scheduling and management of outpatient consultations. It connects patients needing medical care with healthcare providers (doctors) and administrative staff. 

The application removes manual scheduling bottlenecks, avoids double booking using database-level lock patterns and fixed-duration time slots, and delivers a clean visual interface for managing medical appointments efficiently.

---

## 2. Goals

- **G-001**: Provide a clean, intuitive self-service portal for patients to find doctors by department/specialization and book appointments online.
- **G-002**: Enable doctors to set weekly availability, block off personal/holiday periods, and manage their daily appointment schedule.
- **G-003**: Provide administrative controls for managing departments, onboarding and managing doctor profiles, and monitoring overall hospital appointments.
- **G-004**: Guarantee strict concurrency safety to prevent double-booking of any time slot under high concurrent traffic.
- **G-005**: Maintain a clean, modular monolith architecture using Next.js, TypeScript, Prisma, and PostgreSQL that is easy for beginner developers to understand, maintain, debug, and extend.

---

## 3. Non-Goals (Out of Scope)

To maintain simplicity and prevent scope creep, the following modules are explicitly excluded from the application:

- **NG-001**: Electronic Health / Medical Records (EHR / EMR).
- **NG-002**: Financial billing, insurance claims, payment gateway processing, and invoicing.
- **NG-003**: Inpatient bed management, room allocation, or hospital ward management.
- **NG-004**: Pharmacy inventory, prescription dispensing, and drug store management.
- **NG-005**: Laboratory test ordering, sample tracking, and pathology results processing.
- **NG-006**: Video conferencing / Telehealth video call integration (in initial scope).
- **NG-007**: Multi-tenant hospital network / multi-hospital aggregation.

---

## 4. User Roles & Permissions Matrix

| User Role | Description | Primary Access |
| :--- | :--- | :--- |
| **PATIENT** | Unregistered or registered individual seeking healthcare consultations. | Self-registration, search doctors, book/cancel own appointments, view own history. |
| **DOCTOR** | Medical specialist providing healthcare services. | View dashboard, manage weekly availability schedule, set time overrides, update assigned appointment statuses. |
| **ADMIN** | System administrator / Hospital manager. | Manage departments, onboard & manage doctors, manage patient accounts, overview all hospital appointments. |

---

## 5. Functional Requirements Overview

### 5.1 Patient Requirements

- `REQ-PATIENT-001` **[P0]** **Self Registration:** Unauthenticated users can register an account using email, full name, phone number, date of birth, gender, and password.
- `REQ-PATIENT-002` **[P0]** **Authentication:** Patients can log in and log out securely using email and password.
- `REQ-PATIENT-003` **[P0]** **Department Directory:** Patients can browse all active hospital departments (e.g., Cardiology, Dermatology, Pediatrics).
- `REQ-PATIENT-004` **[P0]** **Doctor Directory & Search:** Patients can search doctors by name or bio and filter by department/specialization.
- `REQ-PATIENT-005` **[P0]** **Doctor Profile View:** Patients can view doctor details including qualifications, experience, department, and bio.
- `REQ-PATIENT-006` **[P0]** **Real-time Availability Lookup:** Patients can select a date on a calendar to view open, available 30-minute appointment time slots for a specific doctor.
- `REQ-PATIENT-007` **[P0]** **Appointment Booking:** Patients can select an open 30-minute slot grid item, enter optional consultation notes/reasons, and submit a booking (Status starts as `BOOKED`).
- `REQ-PATIENT-008` **[P0]** **My Appointments View:** Patients can view lists of upcoming appointments and past appointment history.
- `REQ-PATIENT-009` **[P0]** **Appointment Details:** Patients can view full details of a specific booking (Doctor name, location, date, slot time, status, notes).
- `REQ-PATIENT-010` **[P0]** **Cancellation:** Patients can cancel an upcoming `BOOKED` or `CONFIRMED` appointment up to 2 hours prior to the slot start time.
- `REQ-PATIENT-011` **[P1]** **Profile Management:** Patients can update personal details (phone number, emergency contact).

### 5.2 Doctor Requirements

- `REQ-DOCTOR-001` **[P0]** **Doctor Login:** Doctors log in using admin-provisioned credentials.
- `REQ-DOCTOR-002` **[P0]** **Today's Dashboard:** Doctors view a real-time list of today's scheduled appointments ordered chronologically.
- `REQ-DOCTOR-003` **[P0]** **Upcoming & Historical Appointments:** Doctors can filter appointments by date range or status.
- `REQ-DOCTOR-004` **[P0]** **Patient Information Access:** Doctors can view patient contact info and consultation reason for booked slots.
- `REQ-DOCTOR-005` **[P0]** **Weekly Availability Definition:** Doctors can configure standard weekly working hours per day (e.g., Monday 09:00 - 17:00 with 30-minute slot increments).
- `REQ-DOCTOR-006` **[P0]** **Block Date/Time Exceptions:** Doctors can block specific dates or times (e.g., leave, conference, emergency) to prevent bookings on those slots.
- `REQ-DOCTOR-007` **[P0]** **Update Status - Confirmed:** Doctor or system marks a `BOOKED` appointment as `CONFIRMED`.
- `REQ-DOCTOR-008` **[P0]** **Update Status - Completed:** Doctor marks a `CONFIRMED` appointment as `COMPLETED` after consultation.
- `REQ-DOCTOR-009` **[P0]** **Update Status - No Show:** Doctor marks a `CONFIRMED` appointment as `NO_SHOW` if the patient fails to attend.
- `REQ-DOCTOR-010` **[P0]** **Update Status - Cancelled:** Doctor can cancel a `BOOKED` or `CONFIRMED` appointment due to unforeseen schedule changes.

### 5.3 Admin Requirements

- `REQ-ADMIN-001` **[P0]** **Admin Authentication:** Secure login for administrative staff.
- `REQ-ADMIN-002` **[P0]** **Hospital Analytics Dashboard:** View overall stats (total doctors, active patients, today's appointments, completion/cancellation rates).
- `REQ-ADMIN-003` **[P0]** **Department Management:** Create, edit, activate, and deactivate hospital departments.
- `REQ-ADMIN-004` **[P0]** **Doctor Onboarding:** Create doctor profiles, assign departments, and generate login credentials.
- `REQ-ADMIN-005` **[P0]** **Doctor Management:** Edit doctor info, update specialization, or disable doctor accounts (preventing new bookings while preserving historical data).
- `REQ-ADMIN-006` **[P0]** **Patient Directory:** View all registered patients and their booking history summary.
- `REQ-ADMIN-007` **[P0]** **System-wide Appointment Overrides:** View and filter all appointments across all doctors/departments, with ability to manually cancel or re-assign status in emergency cases.

---

## 6. Core Business Rules & Concurrency Control

### 6.1 Fixed-Duration Appointment Slot Rules
- `REQ-SLOT-001`: Appointments are strictly non-overlapping fixed-duration intervals (MVP default: **30 minutes**).
- `REQ-SLOT-002`: Slots are dynamically generated on a fixed 30-minute grid (e.g. 09:00-09:30, 09:30-10:00). Non-grid start times (such as 10:15) are invalid.
- `REQ-SLOT-003`: Slots can only be booked during a doctor's active weekly availability window.
- `REQ-SLOT-004`: Slots overlapping with a doctor's blocked time exceptions are unavailable.
- `REQ-SLOT-005`: Slots in the past relative to the Hospital Local Time (`NEXT_PUBLIC_HOSPITAL_TIMEZONE="Asia/Kolkata"`) cannot be booked.
- `REQ-SLOT-006`: Patients cannot book overlapping appointments with different doctors at the exact same date and time.

### 6.2 Double-Booking Prevention (Concurrency Guarantee)
- `REQ-APPOINTMENT-001` **[P0]**: **PostgreSQL Partial Unique Index & Transactional Locking:**
  - A doctor can NEVER have two active appointments booked for the exact same slot.
  - The database table `Appointment` enforces a PostgreSQL Partial Unique Index:
    `UNIQUE("doctorId", "appointmentDate", "startTime") WHERE status IN ('BOOKED', 'CONFIRMED')`.
  - Booking attempts utilize atomic transactions to prevent race conditions when two users click "Book" simultaneously.
  - If a concurrent race condition occurs, one transaction succeeds while the secondary transaction receives a clean domain error: *"This slot was just reserved by another user. Please choose another time."*

### 6.3 Cancellation & Lifecycle Rules
- `REQ-APPOINTMENT-002`: `CANCELLED` or `NO_SHOW` appointments immediately release the time slot back into the available pool for other patients (unless the date/time is in the past).
- `REQ-APPOINTMENT-003`: Patients can only cancel up to 2 hours prior to slot start time. Admins and Doctors can cancel anytime.

---

## 7. Appointment Lifecycle & State Machine

The system enforces strict, deterministic state transitions. Arbitrary state jumping is forbidden.

```
                   ┌─────────────┐
                   │   BOOKED    │ (Initial State upon successful booking)
                   └──────┬──────┘
                          │
            ┌─────────────┴─────────────┐
            │                           │
            ▼                           ▼
     ┌─────────────┐             ┌─────────────┐
     │  CONFIRMED  │             │  CANCELLED  │
     └──────┬──────┘             └─────────────┘
            │
    ┌───────┼───────┬───────────────┐
    │       │       │               │
    ▼       ▼       ▼               ▼
┌───────┐ ┌───┐ ┌───────────┐ ┌───────────┐
│COMPL. │ │...│ │ CANCELLED │ │  NO_SHOW  │
└───────┘ └───┘ └───────────┘ └───────────┘
```

### Approved System Statuses (Exact Enumeration):
1. **`BOOKED`**: Initial state after a patient successfully reserves a slot. The reservation is active and reserves the slot.
2. **`CONFIRMED`**: The appointment has been confirmed by the doctor or auto-confirmed by hospital policy.
3. **`COMPLETED`**: Consultation has occurred; consultation cycle finished.
4. **`CANCELLED`**: Appointment was cancelled by Patient, Doctor, or Admin prior to or during consultation. The slot is released.
5. **`NO_SHOW`**: Patient failed to show up for a `CONFIRMED` appointment. Recorded for historical audit. The slot is released.

### Strict Legal Transitions:
- `BOOKED` ➔ `CONFIRMED`
- `BOOKED` ➔ `CANCELLED`
- `CONFIRMED` ➔ `COMPLETED`
- `CONFIRMED` ➔ `CANCELLED`
- `CONFIRMED` ➔ `NO_SHOW`

> **Note on `BOOKED` Status:** An appointment starts in `BOOKED` status as soon as the patient submits the reservation. If not explicitly confirmed before the appointment date, it remains validly reserved in `BOOKED` status and still blocks double bookings.

---

## 8. User Journeys

### 8.1 Patient Booking Journey
1. Patient logs in and lands on Dashboard / Search.
2. Filters doctors by "Cardiology".
3. Clicks on "Dr. Jane Smith" profile.
4. Selects a date on the calendar view (e.g., Tomorrow).
5. Views available 30-minute time slots (e.g., `10:00 - 10:30`, `10:30 - 11:00`).
6. Clicks `10:30 AM`, types reason: *"Routine heart checkup"*, and submits booking.
7. System processes transaction; double-booking check passes.
8. Redirected to Appointment Confirmation screen with status `BOOKED`.

### 8.2 Doctor Schedule Management Journey
1. Doctor logs in and accesses "My Schedule".
2. Sets regular working hours: Monday-Friday, 09:00 AM - 05:00 PM (30-min slot grid).
3. Blocks off next Friday for attending a medical conference.
4. Views "Today's Appointments", selects patient "John Doe" at `10:30 AM` (`CONFIRMED`).
5. After consultation, updates appointment status to `COMPLETED`.

---

## 9. Page Inventory & Navigation Structure

### 9.1 Public / Authentication Pages
- `/` - Landing Page (Hero, Department list, CTA to Register/Login)
- `/login` - Unified Login form with role redirection
- `/register` - Patient Registration form

### 9.2 Patient Routes (`/patient/*`)
- `/patient/dashboard` - Overview of upcoming appointments & quick actions
- `/patient/doctors` - Doctor search & filter directory
- `/patient/doctors/[id]` - Doctor profile & 30-min slot booking interface
- `/patient/appointments` - Appointment history & upcoming list
- `/patient/appointments/[id]` - Single appointment details page

### 9.3 Doctor Routes (`/doctor/*`)
- `/doctor/dashboard` - Today's schedule summary & quick status updates
- `/doctor/appointments` - Full appointment schedule & history filter
- `/doctor/schedule` - Weekly working hours & date block exception manager

### 9.4 Admin Routes (`/admin/*`)
- `/admin/dashboard` - High-level system statistics and activity feed
- `/admin/departments` - Department CRUD table
- `/admin/doctors` - Doctor CRUD & status toggle table
- `/admin/appointments` - Master appointment monitoring & override page
- `/admin/patients` - Patient management directory

---

## 10. Technical Architecture & Technology Stack

- **Framework:** Next.js (App Router, React Server Components, Server Actions)
- **Language:** TypeScript (Strict Mode)
- **Database:** PostgreSQL
- **ORM:** Prisma ORM
- **Authentication:** Auth.js / NextAuth.js (Credentials Provider + Prisma Adapter + JWT Session)
- **Styling:** Tailwind CSS + shadcn/ui
- **Form Validation:** React Hook Form + Zod schemas
- **E2E Testing:** Playwright

---

## 11. Non-Functional Requirements

### 11.1 Security Requirements
- `REQ-SEC-001`: Passwords hashed using bcrypt / Argon2.
- `REQ-SEC-002`: Session handling via secure, HTTP-only JWT cookies managed by Auth.js / NextAuth.js.
- `REQ-SEC-003`: Strict Role-Based Access Control (RBAC) enforced in Next.js middleware and server actions.
- `REQ-SEC-004`: Input sanitization and parameterized SQL via Prisma to prevent SQL injection & XSS.

### 11.2 UI/UX, Accessibility & Responsiveness
- `REQ-UX-001`: Responsive layout fully optimized for Mobile (360px+), Tablet, and Desktop (1920px).
- `REQ-UX-002`: WCAG 2.1 AA compliance (keyboard navigation, high contrast ratio, aria labels on interactive elements).
- `REQ-UX-003`: Comprehensive UI states: Clear Skeleton loaders, interactive empty states, and descriptive error messages.

---

## 12. Future Scope (V2 & AI Features)

### 12.1 V2 Features (P2)
- Email / SMS notifications & reminders via Resend / Twilio.
- Telehealth video room link generation.
- Doctor rating and patient review system.

### 12.2 Future AI Features (P2)
- **AI Symptom Checker & Specialist Recommender:** Natural language query matching patient symptoms to appropriate medical departments.
- **Automated No-Show Risk Predictor:** ML flag indicating high-risk appointment slots for proactive follow-up.

---

## 13. Open Questions & Assumptions

1. **Assumption:** All appointments are conducted strictly in the hospital's local timezone (`NEXT_PUBLIC_HOSPITAL_TIMEZONE="Asia/Kolkata"`).
2. **Assumption:** All appointment slots are fixed 30-minute grid intervals.
3. **Open Question:** Should cancellation reason be mandatory for patients? *(Decided for MVP: Optional text field)*.
