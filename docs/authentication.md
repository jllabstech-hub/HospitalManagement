# Authentication & Server-Side Authorization Specification
## Hospital Appointment Management System

**Document Version:** 1.0.0 (Phase 2 Specification)  
**Authentication Engine:** NextAuth.js v5 (Auth.js)  
**Session Strategy:** Encrypted HTTP-Only JWT Cookies  

---

## 1. Executive Summary

Phase 2 implements end-to-end authentication and server-side role-based access control (RBAC) for the three system roles: **`PATIENT`**, **`DOCTOR`**, and **`ADMIN`**.

Authentication uses **NextAuth.js v5 (Auth.js)** with the Credentials Provider, `bcryptjs` password hashing, and Next.js App Router middleware route protection.

---

## 2. Authentication Architecture & Technology Stack

- **Library:** NextAuth.js v5 (`next-auth@beta`) / Auth.js
- **Provider:** Credentials Provider (`email` + `password`)
- **Password Hashing:** `bcryptjs` (Cost factor / salt rounds = 10)
- **Session Mechanism:** **JWT Cookies** stored in HTTP-Only, `SameSite=Lax` cookies.
- **Session Duration:** 30 days default with sliding session window re-issuance.
- **Cookie Security:** `HttpOnly: true`, `SameSite: Lax`, `Secure: true` in production (`NODE_ENV=production`).

---

## 3. Role-Based Access Control (RBAC) Matrix

| Resource / Route | Unauthenticated | PATIENT | DOCTOR | ADMIN |
| :--- | :---: | :---: | :---: | :---: |
| **`/login` & `/register`** | ✅ | 🔄 Auto-Redirect | 🔄 Auto-Redirect | 🔄 Auto-Redirect |
| **`/patient/*`** | ❌ Redirect `/login` | ✅ Allowed | 🔄 Redirect `/doctor/dashboard` | 🔄 Redirect `/admin/dashboard` |
| **`/doctor/*`** | ❌ Redirect `/login` | 🔄 Redirect `/patient/dashboard` | ✅ Allowed | 🔄 Redirect `/admin/dashboard` |
| **`/admin/*`** | ❌ Redirect `/login` | 🔄 Redirect `/patient/dashboard` | 🔄 Redirect `/doctor/dashboard` | ✅ Allowed |

---

## 4. Credentials Authentication & Login Flow

```
Client Browser                  NextAuth.js Server             PostgreSQL Database
     │                                  │                              │
     │ 1. POST Credentials              │                              │
     ├─────────────────────────────────►│                              │
     │    (email, password)             │ 2. Query user by email       │
     │                                  ├─────────────────────────────►│
     │                                  │◄─────────────────────────────┤
     │                                  │ 3. Check isActive === true   │
     │                                  │ 4. Verify bcrypt.compare()   │
     │ 5. Issue HTTP-Only JWT Cookie    │                              │
     │◄─────────────────────────────────┤                              │
     │                                  │                              │
     │ 6. Redirect to Role Dashboard    │                              │
     ├─────────────────────────────────►│                              │
```

---

## 5. Session Data Model

To optimize performance and security, JWT tokens and `session.user` objects contain only non-sensitive authorization primitives:

```typescript
interface SessionUser {
  id: string;                 // User UUID
  email: string;              // User Email
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
  isActive: boolean;
  patientProfileId?: string | null; // Available if role === 'PATIENT'
  doctorProfileId?: string | null;  // Available if role === 'DOCTOR'
}
```

> **Security Guard:** `passwordHash`, medical history, and sensitive profile information are explicitly excluded from session payloads.

---

## 6. Server-Side Authorization Helpers (`src/server/security/auth-helpers.ts`)

Route-level middleware hiding is supplemented by strict server-side service guards:

- **`getCurrentUser()`**: Resolves active NextAuth session user or `null`.
- **`requireAuthenticatedUser()`**: Throws `UNAUTHORIZED` (401) if unauthenticated.
- **`requireRole(Role)`**: Throws `FORBIDDEN` (403) if user role does not match.
- **`requirePatient()`**: Enforces `PATIENT` role and resolves `patientProfileId`.
- **`requireDoctor()`**: Enforces `DOCTOR` role and resolves `doctorProfileId`.
- **`requireAdmin()`**: Enforces `ADMIN` role.
- **`requirePatientOwnership(patientProfileId)`**: Verifies patient is accessing their own record or user is `ADMIN`.
- **`requireDoctorOwnership(doctorProfileId)`**: Verifies doctor is accessing their own record or user is `ADMIN`.

---

## 7. Patient Self-Registration & Role Tampering Protection

- **Endpoint:** `/register` / `registerPatientAction(payload)` Server Action.
- **Self-Registering Role:** Only **`PATIENT`** accounts can be registered publicly.
- **Role Tampering Guard:** The `role` property in `registerPatientAction` is strictly hardcoded to `Role.PATIENT`. Any `role` property injected into client payloads is discarded.
- **Atomic Creation:** `User` and `PatientProfile` are created within a single database transaction (`prisma.$transaction`).

---

## 8. Inactive Users Handling (`isActive = false`)

- **Login Rejection:** `authorize()` callback checks `user.isActive`. If `false`, login is rejected with error code `ACCOUNT_INACTIVE`.
- **Server Guard:** `requireAuthenticatedUser()` verifies `user.isActive === true`.
- **Preserved History:** Deactivated accounts are soft-disabled in the database (`isActive = false`), leaving historical appointments completely intact.

---

## 9. Error Handling & Security Exposure Safeguards

- **Generic Credentials Error:** Invalid passwords or unregistered emails return generic response: *"Invalid email or password."* to prevent account enumeration.
- **Password Hash Safety:** Password hashes are never logged, returned in API payloads, or exposed to browser components.
