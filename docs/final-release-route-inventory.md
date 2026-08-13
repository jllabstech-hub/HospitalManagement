# Final Release — Route Inventory

Generated from App Router repository scan (`src/app`).  
Audit Date: August 13, 2026

Legend:
- Auth: `PUBLIC`, `AUTH`, `PATIENT`, `DOCTOR`, `ADMIN`, `API`
- Render: `Server` (RSC), `Server+Client` (RSC with interactive Client Components)
- Audit Status: `PASSED`

---

## 1. PUBLIC ROUTES

| Route | Page File | Render | Auth | Primary DB Dependencies | Primary Purpose & Features | Search/Filter | Mobile | Desktop | E2E | Audit |
|-------|-----------|--------|------|------------------------|----------------------------|---------------|--------|---------|-----|-------|
| `/` | `src/app/page.tsx` | Server+Client | PUBLIC | HospitalProfile, Department, DoctorProfile, HealthPackage | Marketing Homepage, Hero CTA, Featured Departments, Doctors Carousel | No | OK | OK | Yes | PASSED |
| `/about` | `src/app/(public)/about/page.tsx` | Server | PUBLIC | None | Redirects to `/about/overview` | No | OK | OK | Yes | PASSED |
| `/about/overview` | `src/app/(public)/about/overview/page.tsx` | Server | PUBLIC | HospitalProfile | Hospital overview, mission, vision, values | No | OK | OK | Yes | PASSED |
| `/about/leadership` | `src/app/(public)/about/leadership/page.tsx` | Server | PUBLIC | LeadershipMember | Executive & Clinical Leadership Directory | No | OK | OK | Yes | PASSED |
| `/about/leadership/[slug]` | `src/app/(public)/about/leadership/[slug]/page.tsx` | Server | PUBLIC | LeadershipMember | Detailed Leader Biography & Credentials | No | OK | OK | Yes | PASSED |
| `/about/facilities` | `src/app/(public)/about/facilities/page.tsx` | Server | PUBLIC | Facility | Hospital Facilities & Diagnostic Tech Showcase | No | OK | OK | Yes | PASSED |
| `/departments` | `src/app/(public)/departments/page.tsx` | Server | PUBLIC | Department | Medical Departments Directory | Filter | OK | OK | Yes | PASSED |
| `/departments/[slug]` | `src/app/(public)/departments/[slug]/page.tsx` | Server | PUBLIC | Department, DoctorProfile | Department detail page & affiliated doctors | No | OK | OK | Yes | PASSED |
| `/specialities` | `src/app/(public)/specialities/page.tsx` | Server | PUBLIC | Speciality | Clinical Specialities List | Filter | OK | OK | Yes | PASSED |
| `/specialities/[slug]` | `src/app/(public)/specialities/[slug]/page.tsx` | Server | PUBLIC | Speciality, DoctorProfile | Speciality detail & doctor listing | No | OK | OK | Yes | PASSED |
| `/centres-of-excellence` | `src/app/(public)/centres-of-excellence/page.tsx` | Server | PUBLIC | CentreOfExcellence | Specialised Institutes & Centres | No | OK | OK | Yes | PASSED |
| `/centres-of-excellence/[slug]` | `src/app/(public)/centres-of-excellence/[slug]/page.tsx` | Server | PUBLIC | CentreOfExcellence | Centre detail & multidisciplinary team | No | OK | OK | Yes | PASSED |
| `/doctors` | `src/app/(public)/doctors/page.tsx` | Server+Client | PUBLIC | DoctorProfile, Department | Public Doctor Directory & Search | Search & Filter | OK | OK | Yes | PASSED |
| `/doctors/[doctorId]` | `src/app/(public)/doctors/[doctorId]/page.tsx` | Server | PUBLIC | DoctorProfile | Doctor Profile, Bio & Direct Booking CTA | No | OK | OK | Yes | PASSED |
| `/services` | `src/app/(public)/services/page.tsx` | Server | PUBLIC | HospitalService | Outpatient & Hospital Services Directory | No | OK | OK | Yes | PASSED |
| `/services/[slug]` | `src/app/(public)/services/[slug]/page.tsx` | Server | PUBLIC | HospitalService | Detailed Service overview & booking info | No | OK | OK | Yes | PASSED |
| `/health-packages` | `src/app/(public)/health-packages/page.tsx` | Server | PUBLIC | HealthPackage | Preventative Health Checkup Packages | No | OK | OK | Yes | PASSED |
| `/health-packages/[slug]` | `src/app/(public)/health-packages/[slug]/page.tsx` | Server+Client | PUBLIC | HealthPackage, PackageInformationRequest | Package Details & Information Request Form | No | OK | OK | Yes | PASSED |
| `/health-library` | `src/app/(public)/health-library/page.tsx` | Server | PUBLIC | HealthArticle | Health Education & Medical Articles Directory | Filter | OK | OK | Yes | PASSED |
| `/health-library/[slug]` | `src/app/(public)/health-library/[slug]/page.tsx` | Server | PUBLIC | HealthArticle | Health Article Detail & Author Info | No | OK | OK | Yes | PASSED |
| `/news` | `src/app/(public)/news/page.tsx` | Server | PUBLIC | NewsArticle | Hospital Announcements & News | No | OK | OK | Yes | PASSED |
| `/news/[slug]` | `src/app/(public)/news/[slug]/page.tsx` | Server | PUBLIC | NewsArticle | News Article Detail | No | OK | OK | Yes | PASSED |
| `/success-stories` | `src/app/(public)/success-stories/page.tsx` | Server | PUBLIC | SuccessStory | Patient Success Stories & Case Studies | No | OK | OK | Yes | PASSED |
| `/success-stories/[slug]` | `src/app/(public)/success-stories/[slug]/page.tsx` | Server | PUBLIC | SuccessStory | Detailed Patient Journey & Treatment Story | No | OK | OK | Yes | PASSED |
| `/patient-resources` | `src/app/(public)/patient-resources/page.tsx` | Server | PUBLIC | PatientResource | Downloads, Guides & Form Templates | No | OK | OK | Yes | PASSED |
| `/patient-resources/faq` | `src/app/(public)/patient-resources/faq/page.tsx` | Server | PUBLIC | FaqItem | Frequently Asked Questions Accordion | Category Filter | OK | OK | Yes | PASSED |
| `/international-patients` | `src/app/(public)/international-patients/page.tsx` | Server+Client | PUBLIC | InternationalPageContent, InternationalPatientEnquiry | Global Patient Care, Assistance & Enquiry Form | No | OK | OK | Yes | PASSED |
| `/insurance` | `src/app/(public)/insurance/page.tsx` | Server | PUBLIC | InsurancePartner | TPA & Insurance Partners List | No | OK | OK | Yes | PASSED |
| `/contact` | `src/app/(public)/contact/page.tsx` | Server+Client | PUBLIC | HospitalProfile, ContactMessage, AppointmentEnquiry | Contact Information & General/Appointment Forms | No | OK | OK | Yes | PASSED |
| `/locations` | `src/app/(public)/locations/page.tsx` | Server | PUBLIC | HospitalLocation | Hospital Campuses & Branch Locations Directory | No | OK | OK | Yes | PASSED |
| `/locations/[slug]` | `src/app/(public)/locations/[slug]/page.tsx` | Server | PUBLIC | HospitalLocation | Campus details, maps & contact info | No | OK | OK | Yes | PASSED |
| `/search` | `src/app/(public)/search/page.tsx` | Server+Client | PUBLIC | Doctor, Department, Service, Article, Package | Global Medical Search Results | Global Search | OK | OK | Yes | PASSED |
| `/book-appointment` | `src/app/(public)/book-appointment/page.tsx` | Server | PUBLIC | None | Booking Entry point (redirects to doctor directory or login) | No | OK | OK | Yes | PASSED |
| `/privacy` | `src/app/(public)/privacy/page.tsx` | Server | PUBLIC | None | Patient Privacy Policy | No | OK | OK | Yes | PASSED |
| `/terms` | `src/app/(public)/terms/page.tsx` | Server | PUBLIC | None | Terms of Service & Legal Notices | No | OK | OK | Yes | PASSED |
| `/sitemap.xml` | `src/app/sitemap.ts` | Server | PUBLIC | Dynamic CMS Entities | Dynamic XML Sitemap Generator | No | N/A | N/A | Yes | PASSED |
| `/robots.txt` | `src/app/robots.ts` | Server | PUBLIC | None | Robots Crawling Policy | No | N/A | N/A | Yes | PASSED |

---

## 2. AUTHENTICATION ROUTES

| Route | Page File | Render | Auth | Primary DB Dependencies | Primary Purpose & Features | Search/Filter | Mobile | Desktop | E2E | Audit |
|-------|-----------|--------|------|------------------------|----------------------------|---------------|--------|---------|-----|-------|
| `/login` | `src/app/(auth)/login/page.tsx` | Server+Client | PUBLIC (unauthenticated) | User | Patient/Doctor/Admin Credentials Login | No | OK | OK | Yes | PASSED |
| `/register` | `src/app/(auth)/register/page.tsx` | Server+Client | PUBLIC (unauthenticated) | User, PatientProfile | Patient Registration Form | No | OK | OK | Yes | PASSED |

---

## 3. PATIENT DASHBOARD ROUTES

| Route | Page File | Render | Auth | Primary DB Dependencies | Primary Purpose & Features | Search/Filter | Mobile | Desktop | E2E | Audit |
|-------|-----------|--------|------|------------------------|----------------------------|---------------|--------|---------|-----|-------|
| `/patient/dashboard` | `src/app/(dashboard)/patient/dashboard/page.tsx` | Server | PATIENT | Appointment | Patient Home, Upcoming & Recent Appointments | No | OK | OK | Yes | PASSED |
| `/patient/doctors` | `src/app/(dashboard)/patient/doctors/page.tsx` | Server+Client | PATIENT | DoctorProfile, Department | Doctor Directory & Slot Search | Search & Filter | OK | OK | Yes | PASSED |
| `/patient/doctors/[doctorId]` | `src/app/(dashboard)/patient/doctors/[doctorId]/page.tsx` | Server+Client | PATIENT | DoctorProfile, WeeklyAvailability, BlockedDate, Appointment | Interactive Real-Time Slot Picker & Booking Form | Date Filter | OK | OK | Yes | PASSED |
| `/patient/appointments` | `src/app/(dashboard)/patient/appointments/page.tsx` | Server | PATIENT | Appointment | Patient Appointment History & Status Badges | Status Filter | OK | OK | Yes | PASSED |
| `/patient/appointments/[id]` | `src/app/(dashboard)/patient/appointments/[id]/page.tsx` | Server+Client | PATIENT | Appointment | Detailed Appointment View & Cancellation Action | No | OK | OK | Yes | PASSED |

---

## 4. DOCTOR DASHBOARD ROUTES

| Route | Page File | Render | Auth | Primary DB Dependencies | Primary Purpose & Features | Search/Filter | Mobile | Desktop | E2E | Audit |
|-------|-----------|--------|------|------------------------|----------------------------|---------------|--------|---------|-----|-------|
| `/doctor/dashboard` | `src/app/(dashboard)/doctor/dashboard/page.tsx` | Server | DOCTOR | Appointment | Today's Patient Queue, Appointment Counts & Actions | No | OK | OK | Yes | PASSED |
| `/doctor/availability` | `src/app/(dashboard)/doctor/availability/page.tsx` | Server+Client | DOCTOR | WeeklyAvailability, BlockedDate | Weekly Working Hours Schedule & Vacation Date Blocks Manager | No | OK | OK | Yes | PASSED |
| `/doctor/appointments` | `src/app/(dashboard)/doctor/appointments/page.tsx` | Server | DOCTOR | Appointment | Full Patient Appointment Roster | Filter | OK | OK | Yes | PASSED |
| `/doctor/appointments/[id]` | `src/app/(dashboard)/doctor/appointments/[id]/page.tsx` | Server+Client | DOCTOR | Appointment | Detailed Appointment View, Confirm, Complete, No-Show, Cancel | No | OK | OK | Yes | PASSED |

---

## 5. ADMIN DASHBOARD & CMS ROUTES

| Route | Page File | Render | Auth | Primary DB Dependencies | Primary Purpose & Features | Search/Filter | Mobile | Desktop | E2E | Audit |
|-------|-----------|--------|------|------------------------|----------------------------|---------------|--------|---------|-----|-------|
| `/admin/dashboard` | `src/app/(dashboard)/admin/dashboard/page.tsx` | Server | ADMIN | Aggregate Counts | Metrics Overview & System Statistics | No | OK | OK | Yes | PASSED |
| `/admin/departments` | `src/app/(dashboard)/admin/departments/page.tsx` | Server+Client | ADMIN | Department | Department CRUD & Activation Management | Search & Filter | OK | OK | Yes | PASSED |
| `/admin/doctors` | `src/app/(dashboard)/admin/doctors/page.tsx` | Server+Client | ADMIN | DoctorProfile, User, Department | Doctor Account Provisioning, Profile & Department Mapping | Search & Filter | OK | OK | Yes | PASSED |
| `/admin/appointments` | `src/app/(dashboard)/admin/appointments/page.tsx` | Server | ADMIN | Appointment, DoctorProfile, Department | Master Hospital Appointment Directory | Search & Filter | OK | OK | Yes | PASSED |
| `/admin/appointments/[id]` | `src/app/(dashboard)/admin/appointments/[id]/page.tsx` | Server | ADMIN | Appointment | Master Appointment Audit Details | No | OK | OK | Yes | PASSED |
| `/admin/content` | `src/app/(dashboard)/admin/content/page.tsx` | Server | ADMIN | HospitalProfile, Department, DoctorProfile, Enquiries | CMS Hub & Enquiry Statistics Summary | No | OK | OK | Yes | PASSED |
| `/admin/content/hospital` | `src/app/(dashboard)/admin/content/hospital/page.tsx` | Server+Client | ADMIN | HospitalProfile | Hospital Identity, Contact Info, Mission & Vision Editor | No | OK | OK | Yes | PASSED |
| `/admin/enquiries` | `src/app/(dashboard)/admin/enquiries/page.tsx` | Server+Client | ADMIN | ContactMessage, AppointmentEnquiry, InternationalPatientEnquiry, PackageInformationRequest | Patient Enquiries Inbox & Status Workflow Manager | Filter | OK | OK | Yes | PASSED |

---

## 6. API & SYSTEM ROUTES

| Route | Page File | Render | Auth | Primary DB Dependencies | Primary Purpose & Features | Search/Filter | Mobile | Desktop | E2E | Audit |
|-------|-----------|--------|------|------------------------|----------------------------|---------------|--------|---------|-----|-------|
| `/api/auth/[...nextauth]` | `src/app/api/auth/[...nextauth]/route.ts` | API | PUBLIC | User | NextAuth Auth.js Credentials Endpoint | N/A | N/A | N/A | Yes | PASSED |
| `/api/health` | `src/app/api/health/route.ts` | API | PUBLIC | Database Connection | System Liveness & Database Health Check API | N/A | N/A | N/A | Yes | PASSED |
| `not-found` | `src/app/not-found.tsx` | Server | PUBLIC | None | Global Custom 404 Error Page | N/A | OK | OK | Yes | PASSED |
