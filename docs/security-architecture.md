# Security & Access Control Architecture
## Hospital Appointment Management System

**Document Version:** 1.1.0 (Corrected Specification)  
**Security Principles:** Defense in Depth, Principle of Least Privilege, Zero Trust Client Input  

---

## 1. Authentication Strategy (NextAuth.js / Auth.js v5)

To maintain simplicity, security, and maintainability for a beginner developer, authentication is managed using **NextAuth.js (Auth.js v5)** rather than custom authentication primitives.

### Auth Stack Details:
- **Library:** NextAuth.js v5 (`next-auth@beta`) / Auth.js
- **Provider:** Credentials Provider (Email & Password authentication)
- **Database Adapter:** `@auth/prisma-adapter` for Prisma ORM integration
- **Password Hashing:** `bcryptjs` (Cost factor 12) or `argon2`
- **Session Strategy:** **Encrypted JWT Session Cookies**
- **Cookie Security Attributes:**
  - `HttpOnly: true` (Prevents client-side JavaScript access / XSS token theft)
  - `Secure: true` in production (Transmitted strictly over HTTPS)
  - `SameSite: Lax` (Protects against CSRF attacks while allowing smooth navigation)
- **Session Expiration:** 30 days (default), with sliding session window re-issuance on activity.
- **Logout Handling:** Standard NextAuth `signOut()` invalidates client session state and clears HTTP-only cookies cleanly.

---

## 2. Role-Based Access Control (RBAC) Matrix

Authorization answers: **"Is this user allowed to perform this specific operation?"**

| Resource / Action | Unauthenticated | PATIENT | DOCTOR | ADMIN |
| :--- | :---: | :---: | :---: | :---: |
| **Browse Departments & Doctors** | ✅ | ✅ | ✅ | ✅ |
| **Register Account** | ✅ | ❌ | ❌ | ❌ |
| **Book Own Appointment (`BOOKED`)** | ❌ | ✅ | ❌ | ❌ |
| **View Own Appointments** | ❌ | ✅ (Self only) | ❌ | ❌ |
| **Cancel Own Appointment** | ❌ | ✅ (Self only) | ❌ | ❌ |
| **Manage Weekly Availability** | ❌ | ❌ | ✅ (Self only) | ❌ |
| **Manage Blocked Dates** | ❌ | ❌ | ✅ (Self only) | ❌ |
| **View Today's Doctor Schedule** | ❌ | ❌ | ✅ (Self only) | ❌ |
| **Confirm Appointment (`CONFIRMED`)**| ❌ | ❌ | ✅ (Self only) | ✅ |
| **Complete / No-Show Status Update**| ❌ | ❌ | ✅ (Self only) | ✅ |
| **Create/Edit/Disable Doctors** | ❌ | ❌ | ❌ | ✅ |
| **Create/Edit/Disable Departments** | ❌ | ❌ | ❌ | ✅ |
| **View All Hospital Appointments** | ❌ | ❌ | ❌ | ✅ |

---

## 3. Server-Side Enforcement (Two-Tier Guard Model)

UI route hiding (e.g. hiding an "Admin Settings" button in navigation) is purely a visual convenience. **All security boundaries are enforced on the server side.**

```
[Incoming Request]
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│ Tier 1: Next.js Middleware Route Protection (`middleware.ts`)│
│ - Inspects NextAuth token in JWT session cookie.         │
│ - Redirects unauthorized role access attempts.          │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│ Tier 2: Server Action / Service Layer Authorization Guard│
│ - Resolves active session via NextAuth `auth()`.         │
│ - Verifies Resource Ownership (e.g. `appointment.patientId === session.user.patientProfileId`).
└─────────────────────────────────────────────────────────┘
```

### Resource Ownership Check Example (Service Layer Guard):
```typescript
import { auth } from '@/features/auth';

export async function cancelAppointment(appointmentId: string, reason?: string) {
  const session = await auth();
  if (!session || !session.user) throw new DomainError('UNAUTHORIZED', 'You must be logged in.');

  const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appointment) throw new DomainError('NOT_FOUND', 'Appointment not found');

  // RBAC Guard
  if (session.user.role === 'PATIENT') {
    if (appointment.patientId !== session.user.patientProfileId) {
      throw new DomainError('FORBIDDEN', 'You are not authorized to cancel this appointment.');
    }
  } else if (session.user.role === 'DOCTOR') {
    if (appointment.doctorId !== session.user.doctorProfileId) {
      throw new DomainError('FORBIDDEN', 'You can only cancel appointments assigned to you.');
    }
  } // ADMIN passes ownership check

  // Proceed with cancellation logic...
}
```

---

## 4. Input Sanitization & Vulnerability Mitigations

1. **SQL Injection Prevention:** Standardized via Prisma ORM parameterized queries. Raw query strings are strictly prohibited except for fixed static index migrations.
2. **Cross-Site Scripting (XSS):** React automatically escapes rendered strings. HTML injection in free-text fields (e.g., appointment notes) is stripped via Zod sanitization.
3. **Cross-Site Request Forgery (CSRF):** Server Actions in Next.js and NextAuth.js automatically include built-in origin validation and CSRF token protection headers.
4. **Data Exposure Protection:** User password hashes and internal admin notes are explicitly excluded from API responses via Prisma select projections (`select: { id: true, email: true, role: true }`).
