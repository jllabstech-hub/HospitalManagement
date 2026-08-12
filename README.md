# Hospital Appointment Management System

A streamlined, concurrent-safe outpatient appointment management web application built as a modular monolith.

---

## 🛠️ Technology Stack

- **Framework & Core:** Next.js 15 (App Router, Server Components & Actions), React 19, TypeScript 5, Node.js (>=20.0.0)
- **Database & Data Layer:** PostgreSQL + Prisma ORM (v6) with Type-Safe Schema & Migrations
- **Authentication & RBAC:** NextAuth.js v5 (Auth.js) with Dual-Mode Auth:
  - **Phone + SMS OTP:** Patient authentication with auto-provisioning
  - **Email & Password:** Patient, Doctor, and Administrator role-based access with `bcryptjs` hashing
- **Telephony & SMS Gateway:** Twilio REST API Integration for real-time 6-digit OTP delivery
- **UI Design & Styling:** Custom Vanilla Tailwind CSS v3, Outfit & Inter Google Typography, Glassmorphism Headers, Medicover-inspired Doctor Cards
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
NEXTAUTH_SECRET="dev-super-secret-key-change-in-prod-min-32-chars"
NEXT_PUBLIC_HOSPITAL_TIMEZONE="Asia/Kolkata"
```

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

> **Note:** Patients can self-register at `/register`.

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
