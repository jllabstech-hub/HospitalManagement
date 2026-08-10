# Admin Module Architecture & Security Specification

This document details the technical architecture, security boundaries, database transactions, validation rules, and testing strategies for the **Admin Portal** in the Hospital Appointment Management System.

---

## 1. Overview & Capabilities

The Admin Portal (`/admin/*`) allows hospital administrators to manage master data:
- **Dashboard Overview:** Displays real-time database counts for total/active departments and total/active doctor accounts.
- **Department Management:** Add, edit, and soft-deactivate/reactivate medical departments.
- **Doctor Management:** Onboard doctor accounts (User + DoctorProfile atomic transaction), assign active departments, edit professional credentials, search/filter, and soft-deactivate/reactivate doctor access.

---

## 2. Server Authorization Boundary

Every Admin Server Action and protected server page enforces two-tier authorization:
1. **Tier 1 (Middleware):** Next.js Edge Middleware checks JWT session token for `role === 'ADMIN'`. Non-admins are redirected.
2. **Tier 2 (Server Guard):** Every Server Action explicitly invokes `await requireAdmin()`. If an unauthorized role attempts a direct RPC call, a `FORBIDDEN` domain error is thrown before any query runs.

```
Client UI (Form / Button)
   │
   ▼
Server Action (e.g., createDoctorAction)
   │
   ├─► requireAuthenticatedUser()
   ├─► requireAdmin() ──[Failed]──► Throws FORBIDDEN Error
   │
   ▼
Zod Input Validation (CreateDoctorSchema)
   │
   ▼
Business Constraint Checks (Active Department, Unique Email)
   │
   ▼
Prisma Atomic Transaction ($transaction)
```

---

## 3. Department Management Rules & Transactions

- **Case-Insensitive Uniqueness:** Department names are checked case-insensitively using `mode: 'insensitive'` to prevent duplicate records like `"Cardiology"` vs `" cardiology "`.
- **Soft Deactivation (`isActive = false`):** Departments are never hard-deleted. Deactivating a department keeps historical doctor associations and appointments intact.
- **Assignment Guard:** Inactive departments cannot be selected when onboarding or updating doctor profiles.

---

## 4. Doctor Onboarding & Atomic Transactions

Doctor creation requires atomic insertion across two tables:
1. `User` table (with `role: Role.DOCTOR`, `isActive: true`, and hashed password).
2. `DoctorProfile` table (linked via `userId` and `departmentId`).
3. Seed default `WeeklyAvailability` (Mon-Fri 09:00 - 17:00, 30-min slots).

If any step fails (e.g., duplicate email), Prisma rolls back the entire transaction.

```typescript
const doctorProfile = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      role: Role.DOCTOR,
      isActive: true,
    },
  });

  const profile = await tx.doctorProfile.create({
    data: {
      userId: user.id,
      departmentId,
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      qualification: qualification.trim(),
      experienceYears,
      bio: bio || null,
    },
  });

  return profile;
});
```

---

## 5. Summary of Server Actions & Schemas

| Action | Path | Security | Validation Schema |
| :--- | :--- | :--- | :--- |
| `createDepartmentAction` | `src/features/departments/actions.ts` | `requireAdmin()` | `CreateDepartmentSchema` |
| `updateDepartmentAction` | `src/features/departments/actions.ts` | `requireAdmin()` | `UpdateDepartmentSchema` |
| `toggleDepartmentStatusAction` | `src/features/departments/actions.ts` | `requireAdmin()` | Explicit ID string check |
| `createDoctorAction` | `src/features/doctors/actions.ts` | `requireAdmin()` | `CreateDoctorSchema` |
| `updateDoctorAction` | `src/features/doctors/actions.ts` | `requireAdmin()` | `UpdateDoctorSchema` |
| `toggleDoctorStatusAction` | `src/features/doctors/actions.ts` | `requireAdmin()` | Explicit ID string check |

---

## 6. Testing Strategy

- **Vitest Unit/Integration (`npm test`):**
  - Department creation, uniqueness, editing, deactivation, and reactivation (`src/features/departments/__tests__/departments.test.ts`).
  - Atomic doctor creation, duplicate email rejection across roles, inactive department guard, and account deactivation (`src/features/doctors/__tests__/doctors.test.ts`).
- **Playwright E2E (`npm run test:e2e`):**
  - Complete browser flow for Admin Login ➔ Dashboard ➔ Department CRUD ➔ Doctor CRUD ➔ Non-Admin Access Denial (`e2e/admin.spec.ts`).
