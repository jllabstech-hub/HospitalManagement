# Release Candidate Metadata (Phase 7F)

This document establishes the official Release Candidate (RC-1.0) freeze baseline for the **Hospital Appointment Management System**.

---

## 1. Release Candidate Identification
- **Release Version:** `v1.0.0-RC1`
- **Package Name:** `hospital-appointment-system` (`v0.1.0`)
- **Release Date:** `2026-08-10`
- **Target Deployment Platform:** Node.js Runtime (v20+) with PostgreSQL (v14+)
- **Database Schema Migration Status:** **0 Drift (`prisma migrate status` Verified)**

---

## 2. Technology Stack & Dependency Freeze
| Layer / Tool | Frozen Version | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js `15.1.6` (App Router) | Core Web Application Framework |
| **Runtime** | Node.js `v20.x`+ | Server Runtime |
| **Language** | TypeScript `5.7.3` | Type Safety |
| **Database ORM** | Prisma `6.3.0` | ORM & Migration Manager |
| **Database Engine** | PostgreSQL (Asia/Kolkata Timezone) | Persistent Database with Partial Unique Index |
| **Authentication** | NextAuth.js `5.0.0-beta.25` (Auth.js) | Session & Credentials Management |
| **Validation** | Zod `3.24.1` + `@hookform/resolvers` | Runtime Schema Validation |
| **Unit Testing** | Vitest `3.0.4` | Unit & Integration Test Engine |
| **E2E Testing** | Playwright `1.50.0` | End-to-End Browser Automation |

---

## 3. Approved Business Rules & Scope Constraints
- **30-Minute Fixed Slot Grid:** Appointments are rendered strictly in 30-minute intervals (`09:00:00`, `09:30:00`, etc.).
- **Approved Appointment Statuses (EXACTLY 5):** `BOOKED`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`. Status `SCHEDULED` is strictly forbidden and does not exist.
- **Hospital Timezone:** `Asia/Kolkata` (`NEXT_PUBLIC_HOSPITAL_TIMEZONE="Asia/Kolkata"`).
- **Concurrency Protection:** Direct database enforced partial unique index `unique_active_doctor_slot` on `("doctorId", "appointmentDate", "startTime") WHERE status IN ('BOOKED', 'CONFIRMED')`.
