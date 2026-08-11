# Production Audit — Route Inventory

Generated from App Router source (`src/app`).  
Audit date: 2026-08-11

Legend — Auth: `public` | `session` | `PATIENT` | `DOCTOR` | `ADMIN`  
E2E: covered by Playwright specs under `e2e/`

## PUBLIC

| Route | Page file | RSC | Auth | DB | Primary function | E2E | Audit |
|-------|-----------|-----|------|-----|------------------|-----|-------|
| `/` | `src/app/page.tsx` | Server | public (auth → dashboards) | CMS + doctors | Marketing home | yes | audited |
| `/about` | `(public)/about/page.tsx` | Server | public | — | Redirect → overview | yes | audited |
| `/about/overview` | `(public)/about/overview/page.tsx` | Server | public | HospitalProfile | About hospital | yes | audited |
| `/about/leadership` | `(public)/about/leadership/page.tsx` | Server | public | Leadership | Leadership list | yes | audited |
| `/about/leadership/[slug]` | `(public)/about/leadership/[slug]/page.tsx` | Server | public | Leadership | Leader detail | yes | audited |
| `/about/facilities` | `(public)/about/facilities/page.tsx` | Server | public | Facility | Facilities | yes | audited |
| `/departments` | `(public)/departments/page.tsx` | Server | public | Department | Dept directory | yes | audited |
| `/departments/[slug]` | `(public)/departments/[slug]/page.tsx` | Server | public | Department | Dept detail | yes | audited |
| `/specialities` | `(public)/specialities/page.tsx` | Server | public | Speciality | Specialities | yes | audited |
| `/specialities/[slug]` | `(public)/specialities/[slug]/page.tsx` | Server | public | Speciality | Speciality detail | yes | audited |
| `/centres-of-excellence` | `(public)/centres-of-excellence/page.tsx` | Server | public | Centre | Centres | yes | audited |
| `/centres-of-excellence/[slug]` | `(public)/centres-of-excellence/[slug]/page.tsx` | Server | public | Centre | Centre detail | yes | audited |
| `/doctors` | `(public)/doctors/page.tsx` | Server | public | DoctorProfile | Public doctors | yes | audited |
| `/doctors/[doctorId]` | `(public)/doctors/[doctorId]/page.tsx` | Server | public | DoctorProfile | Public doctor | yes | audited |
| `/services` | `(public)/services/page.tsx` | Server | public | HospitalService | Services | yes | audited |
| `/services/[slug]` | `(public)/services/[slug]/page.tsx` | Server | public | HospitalService | Service detail | yes | audited |
| `/health-packages` | `(public)/health-packages/page.tsx` | Server | public | HealthPackage | Packages | yes | audited |
| `/health-packages/[slug]` | `(public)/health-packages/[slug]/page.tsx` | Server+client form | public | HealthPackage | Package + enquiry | yes | audited |
| `/health-library` | `(public)/health-library/page.tsx` | Server | public | HealthArticle | Articles | yes | audited |
| `/health-library/[slug]` | `(public)/health-library/[slug]/page.tsx` | Server | public | HealthArticle | Article | yes | audited |
| `/news` | `(public)/news/page.tsx` | Server | public | NewsArticle | News | yes | audited |
| `/news/[slug]` | `(public)/news/[slug]/page.tsx` | Server | public | NewsArticle | News detail | yes | audited |
| `/success-stories` | `(public)/success-stories/page.tsx` | Server | public | SuccessStory | Stories | yes | audited |
| `/success-stories/[slug]` | `(public)/success-stories/[slug]/page.tsx` | Server | public | SuccessStory | Story detail | yes | audited |
| `/patient-resources` | `(public)/patient-resources/page.tsx` | Server | public | PatientResource | Resources | yes | audited |
| `/patient-resources/faq` | `(public)/patient-resources/faq/page.tsx` | Server | public | FaqItem | FAQs | yes | audited |
| `/international-patients` | `(public)/international-patients/page.tsx` | Server+client form | public | Intl content | Intl patients | yes | audited |
| `/insurance` | `(public)/insurance/page.tsx` | Server | public | InsurancePartner | Insurance info | yes | audited |
| `/contact` | `(public)/contact/page.tsx` | Server+client forms | public | Enquiries | Contact | yes | audited |
| `/locations` | `(public)/locations/page.tsx` | Server | public | Location | Locations | yes | audited |
| `/locations/[slug]` | `(public)/locations/[slug]/page.tsx` | Server | public | Location | Location detail | yes | audited |
| `/search` | `(public)/search/page.tsx` | Server | public | Multi | Global search | yes | audited |
| `/book-appointment` | `(public)/book-appointment/page.tsx` | Server | public | — | Booking entry | yes | audited |
| `/privacy` | `(public)/privacy/page.tsx` | Server | public | — | Privacy notice | yes | audited |
| `/terms` | `(public)/terms/page.tsx` | Server | public | — | Terms notice | yes | audited |
| `/sitemap.xml` | `src/app/sitemap.ts` | Server | public | CMS | Sitemap | yes | audited |
| `/robots.txt` | `src/app/robots.ts` | Server | public | — | Robots | yes | audited |

## AUTH

| Route | Page file | RSC | Auth | DB | Primary function | E2E | Audit |
|-------|-----------|-----|------|-----|------------------|-----|-------|
| `/login` | `(auth)/login/page.tsx` | Server+client form | public | User | Credentials login | yes | audited |
| `/register` | `(auth)/register/page.tsx` | Server+client form | public | User+Patient | Patient registration | yes | audited |

## PATIENT

| Route | Page file | RSC | Auth | DB | Primary function | E2E | Audit |
|-------|-----------|-----|------|-----|------------------|-----|-------|
| `/patient/dashboard` | `(dashboard)/patient/dashboard/page.tsx` | Server | PATIENT | Appointments | Patient home | yes | audited |
| `/patient/doctors` | `(dashboard)/patient/doctors/page.tsx` | Server | PATIENT | Doctors | Discovery | yes | audited |
| `/patient/doctors/[doctorId]` | `.../[doctorId]/page.tsx` | Server+slot client | PATIENT | Doctors+slots | Book slots | yes | audited |
| `/patient/appointments` | `(dashboard)/patient/appointments/page.tsx` | Server | PATIENT | Appointments | List | yes | audited |
| `/patient/appointments/[id]` | `.../[id]/page.tsx` | Server+client cancel | PATIENT | Appointment | Detail/cancel | yes | audited |

## DOCTOR

| Route | Page file | RSC | Auth | DB | Primary function | E2E | Audit |
|-------|-----------|-----|------|-----|------------------|-----|-------|
| `/doctor/dashboard` | `(dashboard)/doctor/dashboard/page.tsx` | Server | DOCTOR | Appointments | Today queue | yes | audited |
| `/doctor/availability` | `(dashboard)/doctor/availability/page.tsx` | Server+client | DOCTOR | Weekly+Blocked | Schedule | yes | audited |
| `/doctor/appointments` | `(dashboard)/doctor/appointments/page.tsx` | Server | DOCTOR | Appointments | List | yes | audited |
| `/doctor/appointments/[id]` | `.../[id]/page.tsx` | Server+client | DOCTOR | Appointment | Status transitions | yes | audited |

## ADMIN

| Route | Page file | RSC | Auth | DB | Primary function | E2E | Audit |
|-------|-----------|-----|------|-----|------------------|-----|-------|
| `/admin/dashboard` | `(dashboard)/admin/dashboard/page.tsx` | Server | ADMIN | Aggregates | Metrics | yes | audited |
| `/admin/departments` | `(dashboard)/admin/departments/page.tsx` | Server+client | ADMIN | Department | CRUD | yes | audited |
| `/admin/doctors` | `(dashboard)/admin/doctors/page.tsx` | Server+client | ADMIN | Doctor+User | CRUD | yes | audited |
| `/admin/appointments` | `(dashboard)/admin/appointments/page.tsx` | Server | ADMIN | Appointments | Directory | yes | audited |
| `/admin/appointments/[id]` | `.../[id]/page.tsx` | Server | ADMIN | Appointment | Detail (read) | yes | audited |
| `/admin/content` | `(dashboard)/admin/content/page.tsx` | Server | ADMIN | CMS counts | CMS hub | yes | audited |
| `/admin/content/hospital` | `.../hospital/page.tsx` | Server+client | ADMIN | HospitalProfile | Upsert profile | yes | audited |
| `/admin/enquiries` | `(dashboard)/admin/enquiries/page.tsx` | Server+client | ADMIN | Enquiries | Inbox/status | yes | audited |

## API

| Route | File | Auth | Function | E2E | Audit |
|-------|------|------|----------|-----|-------|
| `/api/auth/[...nextauth]` | `api/auth/[...nextauth]/route.ts` | Auth.js | Session | via auth flows | audited |
| `/api/health` | `api/health/route.ts` | public | Health check | — | audited |

## ERROR / NOT FOUND

| Route | File | Notes |
|-------|------|--------|
| `not-found` | `src/app/not-found.tsx` | Branded 404 for App Router `notFound()` |

## Server Actions (inventory)

| Module | File | Mutations |
|--------|------|-----------|
| Auth | `features/auth/actions.ts` | Register patient, logout |
| Departments | `features/departments/actions.ts` | Create/update/activate |
| Doctors | `features/doctors/actions.ts` | Create/update/activate |
| Availability | `features/availability/actions.ts` | Weekly + blocked CRUD |
| Appointments | `features/appointments/actions.ts` | Book, cancel, status transitions |
| CMS public forms | `features/cms/actions/public-forms.ts` | Contact, appointment enquiry, intl, package info |
| CMS admin | `features/cms/actions/admin-cms.ts` | Hospital upsert, enquiry/contact status |

## CMS admin scope note

Full admin CRUD UI for Specialities, Centres, News, Articles, etc. is **not** implemented. Public content is seed/DB-managed with publish filters. Admin UI covers hospital profile + enquiry inbox. Documented as residual product scope in the final audit report.
