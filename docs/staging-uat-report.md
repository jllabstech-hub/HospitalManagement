# Staging UAT Report
Date: 2026-08-13

## Environment
Staging Dataset: Fictional Data (CarePulse Demo)
- Tenants Seeded: Hospital A, Hospital B
- Departments Seeded: Cardiology, Orthopedics, Pediatrics, Neurology
- Doctors Seeded: 10
- Patients Seeded: 20
- Appointments Seeded: 20 (across Booked, Confirmed, Completed, Cancelled, No-Show)

## Journey Verification
- **Patient Journey**: Users can successfully register, search across public catalogues, book appointments (with concurrency guarantees), view confirmation statuses, and cancel appointments. All E2E workflows pass.
- **Doctor Journey**: Doctors have access to isolated dashboards, viewing only their assigned patients and appointments. Confirmed schedule blocks are respected by the public booking API.
- **Admin Journey**: Admins have full access to Hospital CMS, Department CRUD, Doctor CRUD, and Appointment statuses. All operations are strictly Tenant-isolated.

## Security & Multitenancy
- Attempted to access Hospital B's doctors, patients, and CMS from Hospital A's admin session.
- Result: **Access Denied (403/404)**. Tenant middleware strictly drops context for any resource outside the active `tenantId`.

## Audit Logging
- Audit events are strictly generated for all state mutations.
- The logs correctly capture `tenantId`, `actorId`, `action`, `entity`, and `timestamp` without exposing secrets.

## Edge Cases Verified
- Concurrency conflicts result in a `SLOT_UNAVAILABLE` error instead of a database crash.
- Notifications fail gracefully without aborting the appointment transaction.
