# Environment & Configuration Guide
## Hospital Appointment Management System

**Document Version:** 1.0.0  

---

## 1. Environment Variable Reference

| Variable Name | Required | Default / Example | Purpose & Notes |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | **Yes** | `postgresql://postgres:postgres@localhost:5432/hospital_db?schema=public` | PostgreSQL connection string used by Prisma ORM. |
| `AUTH_SECRET` | **Yes** | `min-32-character-random-secret-string` | Secret key used to sign and verify JWT authentication session cookies. |
| `NODE_ENV` | **Yes** | `development` | Environment mode (`development`, `production`, `test`). Controls error verbosity and cookie security flags. |
| `NEXT_PUBLIC_APP_URL` | **Yes** | `http://localhost:3000` | Application base URL used for absolute link generation and CORS verification. |
| `NEXT_PUBLIC_HOSPITAL_TIMEZONE` | **Yes** | `Asia/Kolkata` | Standard IANA timezone identifier for the hospital. Controls date/slot calculations. |

---

## 2. Environment Configurations Matrix

### 2.1 Development (`NODE_ENV=development`)
- Uses local PostgreSQL database instance.
- Detailed Prisma SQL logging enabled (`log: ['query', 'info', 'warn', 'error']`).
- Auth cookie `Secure` flag set to `false` to support `http://localhost:3000`.

### 2.2 Testing (`NODE_ENV=test`)
- Connects to isolated test database (e.g. `hospital_db_test`).
- Suppresses verbose console logs during automated test runs.
- Runs database reset scripts prior to Playwright E2E suite execution.

### 2.3 Production (`NODE_ENV=production`)
- Uses production-managed PostgreSQL instance (with SSL connection parameters e.g., `?sslmode=require`).
- Auth cookie `Secure` flag explicitly set to `true` (HTTPS strict).
- `AUTH_SECRET` must be set via secure secret manager (min 32 random characters).
- Internal error stack traces hidden from all HTTP responses.
