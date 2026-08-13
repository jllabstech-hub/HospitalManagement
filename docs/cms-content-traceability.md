# Public Content → CMS Traceability Matrix

Audit Date: August 13, 2026

The following matrix documents every public content section across all public-facing pages, detailing whether content is dynamic (Database/CMS), static, or hardcoded UI labels.

---

| Public Page | Content Element | Current Source | Should Be Editable? | Admin Module | Status | Notes |
| ----------- | --------------- | -------------- | ------------------- | ------------ | ------ | ----- |
| **Homepage (`/`)** | Hospital Name, Tagline | `HospitalProfile` | YES | `/admin/content/hospital` | **CMS MANAGED** | Dynamic fallback to APP_CONFIG |
| Homepage | Mission & Short Overview | `HospitalProfile` | YES | `/admin/content/hospital` | **CMS MANAGED** | Fully editable via Admin Profile editor |
| Homepage | Featured Departments | `Department` | YES | `/admin/departments` | **CMS MANAGED** | Filtered by `isFeatured: true` & `isActive: true` |
| Homepage | Featured Doctors Carousel | `DoctorProfile` | YES | `/admin/doctors` | **CMS MANAGED** | Filtered by `isFeatured: true` & `contentStatus: PUBLISHED` |
| Homepage | Health Checkup Packages | `HealthPackage` | YES | Seed / DB | **CMS MANAGED** | Dynamic DB queries with `isActive: true` |
| Homepage | Patient Testimonials | `Testimonial` | YES | Seed / DB | **CMS MANAGED** | Dynamic DB query with `contentStatus: PUBLISHED` |
| **About (`/about/overview`)** | Hospital Story, Mission, Vision | `HospitalProfile` | YES | `/admin/content/hospital` | **CMS MANAGED** | Admin editable with dynamic fallbacks |
| **Leadership (`/about/leadership`)** | Board & Clinical Executives | `LeadershipMember` | YES | Seed / DB | **CMS MANAGED** | Sorted by `displayOrder` |
| **Facilities (`/about/facilities`)** | Diagnostic & Care Facilities | `Facility` | YES | Seed / DB | **CMS MANAGED** | Filtered by `isActive: true` |
| **Departments (`/departments`)** | Department Names, Icons, Descriptions | `Department` | YES | `/admin/departments` | **CMS MANAGED** | Full Admin CRUD & Active toggle available |
| Departments Detail (`/departments/[slug]`) | Department Full Description & Doctors | `Department`, `DoctorProfile` | YES | `/admin/departments` & `/admin/doctors` | **CMS MANAGED** | Dynamic relationship query |
| **Specialities (`/specialities`)** | Specialities Directory & Icons | `Speciality` | YES | Seed / DB | **CMS MANAGED** | DB managed with active status |
| **Centres of Excellence (`/centres-of-excellence`)** | Multidisciplinary Institutes | `CentreOfExcellence` | YES | Seed / DB | **CMS MANAGED** | DB managed with active status |
| **Doctors (`/doctors`)** | Doctors Directory, Bios, Languages, Qualifications | `DoctorProfile` | YES | `/admin/doctors` | **CMS MANAGED** | Full Admin CRUD, Department mapping & activation |
| Doctor Detail (`/doctors/[doctorId]`) | Doctor Profile, Education, Experience, Availability | `DoctorProfile`, `WeeklyAvailability` | YES | `/admin/doctors` & `/doctor/availability` | **CMS MANAGED** | Dynamic doctor-managed schedules |
| **Services (`/services`)** | Hospital Outpatient & Clinical Services | `HospitalService` | YES | Seed / DB | **CMS MANAGED** | DB managed with active status |
| **Health Packages (`/health-packages`)** | Preventative Care Packages & Inclusions | `HealthPackage` | YES | Seed / DB | **CMS MANAGED** | DB managed with active status |
| Health Packages Detail | Package Inclusions & Enquiry Form | `HealthPackage`, `PackageInformationRequest` | YES | `/admin/enquiries` | **CMS MANAGED** | Enquiries route directly to Admin Inbox |
| **Health Library (`/health-library`)** | Health Articles & Medical Advice | `HealthArticle` | YES | Seed / DB | **CMS MANAGED** | DB managed with `contentStatus: PUBLISHED` |
| **News (`/news`)** | Hospital Announcements & News | `NewsArticle` | YES | Seed / DB | **CMS MANAGED** | DB managed with `contentStatus: PUBLISHED` |
| **Success Stories (`/success-stories`)** | Patient Recovery Journeys & Testimonials | `SuccessStory` | YES | Seed / DB | **CMS MANAGED** | DB managed with `contentStatus: PUBLISHED` |
| **Patient Resources (`/patient-resources`)** | Downloadable Patient Guides & Forms | `PatientResource` | YES | Seed / DB | **CMS MANAGED** | DB managed with active status |
| **FAQ (`/patient-resources/faq`)** | Frequently Asked Questions | `FaqItem` | YES | Seed / DB | **CMS MANAGED** | Category filterable & DB managed |
| **International Patients (`/international-patients`)** | Global Care Guidelines & Enquiry Form | `InternationalPageContent`, `InternationalPatientEnquiry` | YES | `/admin/enquiries` | **CMS MANAGED** | Content & Enquiries fully linked to database |
| **Insurance (`/insurance`)** | TPA & Insurance Partners | `InsurancePartner` | YES | Seed / DB | **CMS MANAGED** | DB managed with active status |
| **Locations (`/locations`)** | Campuses, Addresses, Maps, Emergency Numbers | `HospitalLocation` | YES | Seed / DB | **CMS MANAGED** | DB managed with `isPrimary` ordering |
| **Contact (`/contact`)** | Address, Phones, Contact Form & Enquiry Form | `HospitalProfile`, `ContactMessage`, `AppointmentEnquiry` | YES | `/admin/content/hospital` & `/admin/enquiries` | **CMS MANAGED** | Forms route directly to Admin Inbox |
| **Search (`/search`)** | Global Search Index | Multi-table DB query | YES | DB-driven | **CMS MANAGED** | Queries active departments, doctors, services & articles |
| **Global Header & Footer** | Phone, Emergency, Working Hours, Copyright | `HospitalProfile` | YES | `/admin/content/hospital` | **CMS MANAGED** | Dynamic navigation header/footer bound to DB profile |
