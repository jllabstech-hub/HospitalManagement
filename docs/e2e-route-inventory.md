# E2E Route Inventory

Generated from the App Router codebase under `src/app` (source of truth).  
Date: 2026-08-11

## PUBLIC

| Route | File | Notes |
|-------|------|--------|
| `/` | `src/app/page.tsx` | Marketing home; authenticated users redirected by role |
| `/about` | `src/app/(public)/about/page.tsx` | Redirects to `/about/overview` |
| `/about/overview` | `src/app/(public)/about/overview/page.tsx` | Hospital profile CMS |
| `/about/leadership` | `src/app/(public)/about/leadership/page.tsx` | Leadership list |
| `/about/leadership/[slug]` | `src/app/(public)/about/leadership/[slug]/page.tsx` | Leadership detail |
| `/about/facilities` | `src/app/(public)/about/facilities/page.tsx` | Facilities |
| `/departments` | `src/app/(public)/departments/page.tsx` | Public departments |
| `/departments/[slug]` | `src/app/(public)/departments/[slug]/page.tsx` | Department detail |
| `/specialities` | `src/app/(public)/specialities/page.tsx` | Specialities |
| `/specialities/[slug]` | `src/app/(public)/specialities/[slug]/page.tsx` | Speciality detail |
| `/centres-of-excellence` | `src/app/(public)/centres-of-excellence/page.tsx` | Centres |
| `/centres-of-excellence/[slug]` | `src/app/(public)/centres-of-excellence/[slug]/page.tsx` | Centre detail |
| `/doctors` | `src/app/(public)/doctors/page.tsx` | Public doctor directory (SSR filters) |
| `/doctors/[doctorId]` | `src/app/(public)/doctors/[doctorId]/page.tsx` | Public doctor profile (id or slug) |
| `/services` | `src/app/(public)/services/page.tsx` | Services |
| `/services/[slug]` | `src/app/(public)/services/[slug]/page.tsx` | Service detail |
| `/health-packages` | `src/app/(public)/health-packages/page.tsx` | Packages |
| `/health-packages/[slug]` | `src/app/(public)/health-packages/[slug]/page.tsx` | Package detail + info request |
| `/health-library` | `src/app/(public)/health-library/page.tsx` | Articles |
| `/health-library/[slug]` | `src/app/(public)/health-library/[slug]/page.tsx` | Article detail |
| `/news` | `src/app/(public)/news/page.tsx` | News |
| `/news/[slug]` | `src/app/(public)/news/[slug]/page.tsx` | News detail |
| `/success-stories` | `src/app/(public)/success-stories/page.tsx` | Success stories |
| `/success-stories/[slug]` | `src/app/(public)/success-stories/[slug]/page.tsx` | Story detail |
| `/patient-resources` | `src/app/(public)/patient-resources/page.tsx` | Resources |
| `/patient-resources/faq` | `src/app/(public)/patient-resources/faq/page.tsx` | FAQ |
| `/international-patients` | `src/app/(public)/international-patients/page.tsx` | Intl patients + enquiry |
| `/insurance` | `src/app/(public)/insurance/page.tsx` | Insurance partners (informational) |
| `/contact` | `src/app/(public)/contact/page.tsx` | Contact + forms |
| `/locations` | `src/app/(public)/locations/page.tsx` | Locations |
| `/locations/[slug]` | `src/app/(public)/locations/[slug]/page.tsx` | Location detail |
| `/search` | `src/app/(public)/search/page.tsx` | Global search `?q=` |
| `/book-appointment` | `src/app/(public)/book-appointment/page.tsx` | Booking entry â†’ patient slot flow |
| `/sitemap.xml` | `src/app/sitemap.ts` | Dynamic sitemap |
| `/robots.txt` | `src/app/robots.ts` | Robots |

## AUTH

| Route | File |
|-------|------|
| `/login` | `src/app/(auth)/login/page.tsx` |
| `/register` | `src/app/(auth)/register/page.tsx` |

## PATIENT (requires PATIENT role)

| Route | File |
|-------|------|
| `/patient/dashboard` | `src/app/(dashboard)/patient/dashboard/page.tsx` |
| `/patient/doctors` | `src/app/(dashboard)/patient/doctors/page.tsx` |
| `/patient/doctors/[doctorId]` | `src/app/(dashboard)/patient/doctors/[doctorId]/page.tsx` |
| `/patient/appointments` | `src/app/(dashboard)/patient/appointments/page.tsx` |
| `/patient/appointments/[id]` | `src/app/(dashboard)/patient/appointments/[id]/page.tsx` |

## DOCTOR (requires DOCTOR role)

| Route | File |
|-------|------|
| `/doctor/dashboard` | `src/app/(dashboard)/doctor/dashboard/page.tsx` |
| `/doctor/availability` | `src/app/(dashboard)/doctor/availability/page.tsx` |
| `/doctor/appointments` | `src/app/(dashboard)/doctor/appointments/page.tsx` |
| `/doctor/appointments/[id]` | `src/app/(dashboard)/doctor/appointments/[id]/page.tsx` |

## ADMIN (requires ADMIN role)

| Route | File |
|-------|------|
| `/admin/dashboard` | `src/app/(dashboard)/admin/dashboard/page.tsx` |
| `/admin/departments` | `src/app/(dashboard)/admin/departments/page.tsx` |
| `/admin/doctors` | `src/app/(dashboard)/admin/doctors/page.tsx` |
| `/admin/appointments` | `src/app/(dashboard)/admin/appointments/page.tsx` |
| `/admin/appointments/[id]` | `src/app/(dashboard)/admin/appointments/[id]/page.tsx` |
| `/admin/content` | `src/app/(dashboard)/admin/content/page.tsx` |
| `/admin/content/hospital` | `src/app/(dashboard)/admin/content/hospital/page.tsx` |
| `/admin/enquiries` | `src/app/(dashboard)/admin/enquiries/page.tsx` |

## API

| Route | File |
|-------|------|
| `/api/auth/[...nextauth]` | `src/app/api/auth/[...nextauth]/route.ts` |
| `/api/health` | `src/app/api/health/route.ts` |

## Middleware protection (`src/middleware.ts`)

Matcher: `/`, `/patient/:path*`, `/doctor/:path*`, `/admin/:path*`, `/login`, `/register`

- Unauthenticated â†’ protected portal routes redirect to `/login?callbackUrl=...`
- Role mismatch â†’ redirect to role dashboard
- Authenticated on `/login` or `/register` â†’ role dashboard
- Public CMS routes are **outside** the matcher (unauthenticated OK)

## Server Actions inventory

### Auth
- `registerPatientAction`

### Departments (admin)
- `createDepartmentAction`, `updateDepartmentAction`, `toggleDepartmentStatusAction`

### Doctors (admin)
- `createDoctorAction`, `updateDoctorAction`, `toggleDoctorStatusAction`

### Availability (doctor)
- `createAvailabilityAction`, `updateAvailabilityAction`, `deleteAvailabilityAction`
- `createBlockedDateAction`, `updateBlockedDateAction`, `deleteBlockedDateAction`

### Appointments
- `getAvailableSlotsAction`, `bookAppointmentAction`
- `cancelPatientAppointmentAction`
- `confirmDoctorAppointmentAction`, `completeDoctorAppointmentAction`, `noShowDoctorAppointmentAction`, `cancelDoctorAppointmentAction`

### CMS public forms
- `submitContactMessageAction`, `submitAppointmentEnquiryAction`
- `submitInternationalEnquiryAction`, `submitPackageInfoRequestAction`

### CMS admin
- `upsertHospitalProfileAction`, `updateEnquiryStatusAction`, `updateContactMessageStatusAction`

## Appointment status machine (unchanged)

`BOOKED` â†’ `CONFIRMED` â†’ `COMPLETED`  
`BOOKED`/`CONFIRMED` â†’ `CANCELLED`  
`CONFIRMED` â†’ `NO_SHOW`

## Slot model (unchanged)

30-minute slots; hospital timezone `Asia/Kolkata`; PostgreSQL active-slot uniqueness constraint.

## Seeded E2E identities (development seed)

| Role | Email | Password |
|------|-------|----------|
| ADMIN | `admin@hospital.com` | `test123` |
| DOCTOR A | `dr.smith@hospital.com` | `test123` |
| DOCTOR B | `dr.johnson@hospital.com` | `test123` |
| PATIENT A | `patient.alice@example.com` | `test123` |
| PATIENT B | `patient.bob@example.com` | `test123` |

Seed aborts when `NODE_ENV=production` unless `ALLOW_PRODUCTION_SEED` is set.
