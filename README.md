# Hospital Appointment Management System

A streamlined, concurrent-safe outpatient appointment management web application built as a modular monolith. The public hospital website is CMS-driven: specialities, departments, services, and other catalog pages show photos managed from the admin dashboard.

---

## 🛠️ Technology Stack

- **Framework & Core:** Next.js 15 (App Router, Server Components & Actions), React 19, TypeScript 5, Node.js (>=20.0.0)
- **Database & Data Layer:** PostgreSQL + Prisma ORM (v6) with Type-Safe Schema & Migrations
- **Authentication & RBAC:** NextAuth.js v5 (Auth.js) with Dual-Mode Auth:
  - **Phone + SMS OTP:** Patient authentication with auto-provisioning
  - **Email & Password:** Patient, Doctor, and Administrator role-based access with `bcryptjs` hashing
- **Telephony & SMS Gateway:** Twilio REST API Integration for real-time 6-digit OTP delivery
- **UI Design & Styling:** Custom Vanilla Tailwind CSS v3, Outfit & Inter Google Typography, Glassmorphism Headers, Medicover-inspired Doctor Cards
- **CMS media:** Upload, media library, stock medical photos, and optional Gemini image generation through Vercel AI Gateway (`ai` SDK)
- **Form & Validation:** React Hook Form + Zod Schema Validation
- **Testing & Verification:** Vitest (Unit/Integration Tests) & Playwright (E2E Browser Testing)
- **Deployment:** Vercel Edge Cloud Platform with Automated Build Postinstall Scripts

---

## 📋 Prerequisites

Before running the application, ensure you have installed:

1. **Node.js:** v20.0.0 or higher
2. **npm:** v10.0.0 or higher
3. **PostgreSQL Database:** Running locally on port `5432` or accessible via network URL.

---

## 🚀 Quick Start & Setup Guide

### Step 1: Clone & Install Dependencies

```bash
git clone <repository-url>
cd HospitalAppointmentSystem
npm install
```

### Step 2: Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Ensure `.env` contains your local PostgreSQL connection string:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hospital_db?schema=public"
AUTH_SECRET="dev-super-secret-key-change-in-prod-min-32-chars"
NEXT_PUBLIC_HOSPITAL_TIMEZONE="Asia/Kolkata"
```

Optional CMS image generation (local development). Create an AI Gateway key in the Vercel dashboard and add:

```env
IMAGE_GENERATION_PROVIDER="gateway"
IMAGE_GENERATION_MODEL="google/gemini-3.1-flash-image-preview"
AI_GATEWAY_API_KEY=""
```

On Vercel, OIDC can authenticate AI Gateway when `AI_GATEWAY_API_KEY` is unset. Restart `npm run dev` after changing env files. Do not commit `.env` or `.env.local`.

### Step 3: Run Database Migrations

Apply database migrations (creates tables and the PostgreSQL Partial Unique Index):

```bash
npx prisma migrate dev
```

### Step 4: Seed Development Data

Populate the database with fictional departments, doctors, patients, and sample appointments:

```bash
npx prisma db seed
```

### Step 5: Start Development Server

Run the Next.js development server on Port 5000:

```bash
npm run dev
```

Open [http://localhost:5000](http://localhost:5000) in your browser.

---

## 🔑 Local Development Seeded Accounts & URLs

For testing role-based authentication in development, use the following seeded accounts (Default password for all local test accounts: `test123`):

| Role | Email | Password | Primary Route | Full Local URL (Port 5000) |
| :--- | :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@hospital.com` | `test123` | `/admin/dashboard` | [http://localhost:5000/admin/dashboard](http://localhost:5000/admin/dashboard) |
| **DOCTOR** | `dr.smith@hospital.com` | `test123` | `/doctor/dashboard` | [http://localhost:5000/doctor/dashboard](http://localhost:5000/doctor/dashboard) |
| **DOCTOR** | `dr.johnson@hospital.com` | `test123` | `/doctor/dashboard` | [http://localhost:5000/doctor/dashboard](http://localhost:5000/doctor/dashboard) |
| **PATIENT** | `patient.alice@example.com` | `test123` | `/patient/dashboard` | [http://localhost:5000/patient/dashboard](http://localhost:5000/patient/dashboard) |
| **PATIENT** | `patient.bob@example.com` | `test123` | `/patient/dashboard` | [http://localhost:5000/patient/dashboard](http://localhost:5000/patient/dashboard) |

### 🌐 Quick Route Navigation (Local Port 5000 & Vercel)

- **Login Page:** [http://localhost:5000/login](http://localhost:5000/login) (Production: [https://hospital-management-jllabs.vercel.app/login](https://hospital-management-jllabs.vercel.app/login))
- **Patient Registration:** [http://localhost:5000/register](http://localhost:5000/register) (Production: [https://hospital-management-jllabs.vercel.app/register](https://hospital-management-jllabs.vercel.app/register))
- **Patient Doctor Search & Booking:** [http://localhost:5000/patient/doctors](http://localhost:5000/patient/doctors) (Production: [https://hospital-management-jllabs.vercel.app/patient/doctors](https://hospital-management-jllabs.vercel.app/patient/doctors))
- **Doctor Schedule Manager:** [http://localhost:5000/doctor/availability](http://localhost:5000/doctor/availability) (Production: [https://hospital-management-jllabs.vercel.app/doctor/availability](https://hospital-management-jllabs.vercel.app/doctor/availability))
- **Admin Doctor Management:** [http://localhost:5000/admin/doctors](http://localhost:5000/admin/doctors) (Production: [https://hospital-management-jllabs.vercel.app/admin/doctors](https://hospital-management-jllabs.vercel.app/admin/doctors))
- **Admin Department Management:** [http://localhost:5000/admin/departments](http://localhost:5000/admin/departments) (Production: [https://hospital-management-jllabs.vercel.app/admin/departments](https://hospital-management-jllabs.vercel.app/admin/departments))
- **Admin Specialities:** [http://localhost:5000/admin/specialities](http://localhost:5000/admin/specialities) (Production: [https://hospital-management-jllabs.vercel.app/admin/specialities](https://hospital-management-jllabs.vercel.app/admin/specialities))
- **Admin Media Library:** [http://localhost:5000/admin/media](http://localhost:5000/admin/media) (Production: [https://hospital-management-jllabs.vercel.app/admin/media](https://hospital-management-jllabs.vercel.app/admin/media))
- **Public Specialities:** [http://localhost:5000/specialities](http://localhost:5000/specialities) (Production: [https://hospital-management-jllabs.vercel.app/specialities](https://hospital-management-jllabs.vercel.app/specialities))

> **Note:** Patients can self-register at `/register`.

---

## 🖼️ CMS Images & Public Catalog

Public pages render the image stored on each CMS record (with a relevant medical stock photo as fallback when the URL is empty). Seed and content import also fill missing images where possible.

| Public page | Admin editor | Image field |
| :--- | :--- | :--- |
| `/specialities` | `/admin/specialities` | Speciality `imageUrl` |
| `/departments` | `/admin/departments` | Department `imageUrl` |
| `/centres-of-excellence` | Centres CMS | Centre `heroImageUrl` |
| `/services` | Services CMS | Service `imageUrl` |
| `/health-packages` | Packages CMS | Package `imageUrl` |
| `/about/facilities` | Facilities CMS | Facility `imageUrl` |
| `/health-library` | Articles CMS | Article `coverImageUrl` |
| `/news` | News CMS | News `coverImageUrl` |
| Homepage hero | Hospital profile | `heroImageUrl` / `logoUrl` |

### Admin image tools

- **Drag & drop:** On specialities (and other CMS forms using the image picker), drop a JPG/PNG (max 5MB), or use **Upload Photo** / **Browse Library**.
- **Browse / Find relevant images:** Attach an existing media-library asset or a matched medical stock photo.
- **Fill missing images:** Attaches catalog photos to records that still have no image.
- **Generate Image (optional):** Gemini via Vercel AI Gateway creates a photorealistic hospital photo from the record name and CMS description. Requires `AI_GATEWAY_API_KEY` locally (restart the dev server after adding it).
- **Specialities pagination:** `/admin/specialities` lists 12 records per page by default (6 / 9 / 12 / 24 / 48) with search and Previous / Next.
- **Departments table:** The departments grid no longer shows an image column. Set the cover photo in **Add / Edit Department**; it still appears on `/departments`.

Content import extracts `og:image` from crawled pages and stores it on the CMS record when valid.

---

## 🚀 Production Deployment

See **[docs/deployment.md](docs/deployment.md)** for detailed production deployment checklists, environment variable classification, security header configuration, and migration procedures.

---

## 🧪 Testing Commands

### Run Integration & Authorization Tests (Vitest)
```bash
npm test
```

### Run End-to-End Authentication Tests (Playwright)
```bash
npm run test:e2e
```

### Run Linter
```bash
npm run lint
```

### Build Production Application
```bash
npm run build
```

---

## 📖 Documentation Index

Comprehensive specification documents are located in `docs/`:

- **[requirements.md](docs/requirements.md)** — Software Requirements Specification & User Roles
- **[mvp-scope.md](docs/mvp-scope.md)** — Core MVP Scope vs Post-MVP Features
- **[architecture.md](docs/architecture.md)** — Technical Architecture & Layer Responsibilities
- **[database.md](docs/database.md)** — Database Schema & Data Models
- **[authentication.md](docs/authentication.md)** — NextAuth.js & RBAC Security Implementation
- **[security-architecture.md](docs/security-architecture.md)** — Security Guidelines & Threat Model
- **[decisions.md](docs/decisions.md)** — Architectural Decision Records (ADRs)
- **[phase-1-implementation.md](docs/phase-1-implementation.md)** — Phase 1 Implementation Summary
- **[deployment.md](docs/deployment.md)** — Production env vars, security headers, and smoke tests
