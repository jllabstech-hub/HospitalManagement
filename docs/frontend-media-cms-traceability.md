# FRONTEND MEDIA & CMS TRACEABILITY MATRIX

**Hospital Appointment Management System**  
*Final Media Management Audit & Traceability Report*

---

## 1. Executive Summary

Every public-facing hospital and business media element has been audited and mapped to an authoritative Admin CMS model. 

- **Unmanaged Business Content**: `0`
- **Unmanaged Business Media**: `0`
- **Media Storage Architecture**: Production abstraction via `/public/uploads` disk storage + database-backed `MediaAsset` records.
- **Admin Media Library**: Fully accessible via `/admin/media` for uploading, searching, previewing, and attaching assets.

---

## 2. Public Page Media Traceability Matrix

| Page Route | Frontend Visual Element | Current Asset Source | CMS Entity & Field | Admin Location | Replaceable? | Audit Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/` (Homepage) | Hero Consultation Image | `profile?.heroImageUrl` | `HospitalProfile.heroImageUrl` | Admin > Content > Hospital Profile | YES | **PASS** |
| `/` (Homepage) | Hospital Logo | `profile?.logoUrl` | `HospitalProfile.logoUrl` | Admin > Content > Hospital Profile | YES | **PASS** |
| `/` (Homepage) | Campus / Facility Image | `Facility.imageUrl` | `Facility.imageUrl` | Admin > Content > Facilities | YES | **PASS** |
| `/` (Homepage) | Featured Doctor Photo | `DoctorProfile.profileImageUrl` | `DoctorProfile.profileImageUrl` | Admin > Doctors > Edit Doctor | YES | **PASS** |
| `/` (Homepage) | Department Card Graphic | `Department.imageUrl` | `Department.imageUrl` | Admin > Departments > Edit Dept | YES | **PASS** |
| `/` (Homepage) | Service Icon / Banner | `HospitalService.imageUrl` | `HospitalService.imageUrl` | Admin > Content > Services | YES | **PASS** |
| `/` (Homepage) | Testimonial Avatar | `Testimonial.imageUrl` | `Testimonial.imageUrl` | Admin > Content > Testimonials | YES | **PASS** |
| `/doctors` | Doctor Listing Photos | `DoctorProfile.profileImageUrl` | `DoctorProfile.profileImageUrl` | Admin > Doctors > Edit Doctor | YES | **PASS** |
| `/doctors/[id]` | Doctor Profile Header Photo | `DoctorProfile.profileImageUrl` | `DoctorProfile.profileImageUrl` | Admin > Doctors > Edit Doctor | YES | **PASS** |
| `/departments/[slug]`| Department Header Banner | `Department.imageUrl` | `Department.imageUrl` | Admin > Departments > Edit Dept | YES | **PASS** |
| `/services/[slug]` | Service Detail Photo | `HospitalService.imageUrl` | `HospitalService.imageUrl` | Admin > Content > Services | YES | **PASS** |
| `/health-library/[slug]`| Article Cover Image | `HealthArticle.coverImageUrl` | `HealthArticle.coverImageUrl` | Admin > Content > Health Library | YES | **PASS** |
| `/news/[slug]` | News Article Banner | `NewsArticle.coverImageUrl` | `NewsArticle.coverImageUrl` | Admin > Content > News | YES | **PASS** |
| `/about/facilities` | Facility Gallery Photos | `Facility.imageUrl` | `Facility.imageUrl` | Admin > Content > Facilities | YES | **PASS** |
| `/locations` | Hospital Campus Map / Photo | `HospitalLocation.mapUrl` | `HospitalLocation.mapUrl` | Admin > Content > Locations | YES | **PASS** |
| `/international-patients`| International Hero Graphic| `InternationalPageContent` | `InternationalPageContent` | Admin > Content > International | YES | **PASS** |

---

## 3. Media Upload & Validation Architecture

1. **Security Guards**:
   - Strictly enforced via `requireAdmin()` on both Server Actions and `/api/upload` Route Handler.
2. **File Validation**:
   - Permitted MIME types: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`, `image/svg+xml`.
   - Max file size: `5MB`.
   - Filenames are sanitized to prevent path traversal.
3. **Cache Invalidation**:
   - Updating doctor photos or department banners invalidates Next.js tag caches (`public-doctors`, `public-departments`, `hospital-profile`) ensuring instant SSR updates on public pages.
