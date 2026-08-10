# Error Handling & Resilience Specification
## Hospital Appointment Management System

**Document Version:** 1.1.0 (Corrected Specification)  
**Target:** Error Classification, User Safety, and Logging Strategy  

---

## 1. Domain Error Taxonomy

All business and application errors inherit from a custom `DomainError` base class:

```typescript
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'DOCTOR_UNAVAILABLE'
  | 'SLOT_NOT_AVAILABLE'
  | 'APPOINTMENT_IN_PAST'
  | 'INVALID_STATUS_TRANSITION'
  | 'CONFLICT'
  | 'DATABASE_ERROR'
  | 'INTERNAL_SERVER_ERROR';

export class DomainError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public userMessage?: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'DomainError';
  }
}
```

---

## 2. Error Code Matrix & User Exposure Policy

| Error Code | HTTP Status | Expected vs System | User-Facing Message Example | Internal Log Detail |
| :--- | :---: | :---: | :--- | :--- |
| `VALIDATION_ERROR` | 400 | Expected | *"Please check your input values."* | Zod error issue paths & format mismatches. |
| `UNAUTHORIZED` | 401 | Expected | *"Your session has expired. Please log in again."* | Missing or invalid NextAuth JWT token. |
| `FORBIDDEN` | 403 | Expected | *"You do not have permission to access this resource."* | RBAC role check failed (`PATIENT` attempted `/admin`). |
| `NOT_FOUND` | 404 | Expected | *"The requested doctor or appointment was not found."* | Missing record ID lookup in database. |
| `DOCTOR_UNAVAILABLE`| 422 | Expected | *"Dr. Smith is not accepting appointments on this date."* | Doctor blocked date match or inactive status. |
| `SLOT_NOT_AVAILABLE`| 409 | Expected | *"This time slot has already been reserved."* | Unique constraint violation (`P2002`) on slot. |
| `APPOINTMENT_IN_PAST`| 422 | Expected | *"You cannot book or modify an appointment in the past."* | Date/time comparison failed against Hospital Local Time (`Asia/Kolkata`). |
| `INVALID_STATUS_TRANSITION`| 422 | Expected | *"Cannot change status from Cancelled to Completed."* | State machine transition guard violation. |
| `CONFLICT` | 409 | Expected | *"You already have another active appointment at this time."*| Double booking for same patient across doctors. |
| `DATABASE_ERROR` | 500 | System | *"A database error occurred. Please try again later."* | Prisma raw error code & connection pool status. |
| `INTERNAL_SERVER_ERROR`| 500 | System | *"An unexpected error occurred. Please contact support."*| Complete stack trace, environment context. |

---

## 3. Strict Information Hiding Rules

1. **No Database Stack Traces to Client:** Raw PostgreSQL errors, Prisma table schemas, or query strings must NEVER be rendered in client UI toasts or API responses.
2. **Generic Authentication Failures:** Login failures must return generic message *"Invalid email or password"* to prevent user enumeration attacks.
3. **Structured Server Action Result:**
   ```typescript
   export type ActionResult<T> =
     | { success: true; data: T }
     | { success: false; error: { code: ErrorCode; message: string } };
   ```

---

## 4. Server-Side Logging & Monitoring Strategy

1. **Expected Business Errors:** Logged at `INFO` or `WARN` level (e.g. slot unavailable, invalid validation input).
2. **System Errors (`DATABASE_ERROR`, `INTERNAL_SERVER_ERROR`):** Logged at `ERROR` level with full stack trace, timestamp, context payload (sanitized of sensitive passwords), and user ID.
