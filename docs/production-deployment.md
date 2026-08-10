# Production Deployment Guide: Vercel + Neon PostgreSQL

This guide provides a step-by-step procedure to deploy the **Hospital Appointment Management System** to **Vercel** with a managed **Neon PostgreSQL** serverless database.

---

## 📋 Summary of Current Deployment State

| Layer | Status | Target Provider | Action Required |
| :--- | :--- | :--- | :--- |
| **Application Codebase** | **READY** | Vercel (Next.js 15 App Router) | Connect Git repository to Vercel |
| **Database Engine** | **NOT PROVISIONED** | Neon PostgreSQL (Serverless) | Provision database & obtain `DATABASE_URL` |
| **Production Secrets** | **NOT CONFIGURED** | Vercel Environment Variables | Add `DATABASE_URL`, `AUTH_SECRET`, etc. |
| **Database Schema** | **READY FOR MIGRATION** | `npx prisma migrate deploy` | Execute migration against Neon database |

---

## 🚀 Step-by-Step Deployment Procedure

### STEP 1: Provision Neon PostgreSQL Database
1. Go to [Neon.tech](https://neon.tech) and create a free or team account.
2. Click **Create Project**, name your project `hospital-appointment-db`, and select your preferred region.
3. Once created, navigate to **Dashboard** -> **Connection Details**.
4. Select **Prisma** or **Pooled Connection** string.
5. Copy the complete connection string:
   ```
   postgresql://user:password@ep-sample-123456.pooler.region.aws.neon.tech/neondb?sslmode=require
   ```

---

### STEP 2: Configure Environment Variables in Local Terminal
In your local development environment terminal, temporarily point `DATABASE_URL` to your new Neon connection string to run migrations:

```bash
# Set your Neon connection string in your local terminal session
export DATABASE_URL="postgresql://user:password@ep-sample-123456.pooler.region.aws.neon.tech/neondb?sslmode=require"
```
*(On Windows PowerShell: `$env:DATABASE_URL="postgresql://..."`)*

---

### STEP 3: Apply Database Migrations to Neon PostgreSQL
Execute Prisma versioned migrations against the Neon production database:

```bash
# 1. Generate Prisma client for schema
npx prisma generate

# 2. Deploy versioned migrations to Neon PostgreSQL (DO NOT USE db push or migrate reset)
npx prisma migrate deploy

# 3. Verify database migration status
npx prisma migrate status
```

> **IMPORTANT DATABASE RULES:**
> - **NEVER** run `npx prisma migrate reset` (causes permanent data loss).
> - **NEVER** run `npx prisma db push` (bypasses versioned migration tracking).
> - **NEVER** run `npm run prisma:seed` in production unless bootstrapping an initial admin.

---

### STEP 4: Create Vercel Project & Connect Repository
1. Go to [Vercel.com](https://vercel.com) and log into your account.
2. Click **Add New...** -> **Project**.
3. Import your Git repository (`HospitalAppointmentSystem`).
4. Select **Next.js** as the Framework Preset.

---

### STEP 5: Configure Vercel Environment Variables
In the Vercel project configuration screen, add the following Environment Variables:

| Variable Name | Environment | Recommended Value / Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | Production, Preview | Neon PostgreSQL connection string (`sslmode=require`) |
| `AUTH_SECRET` | Production, Preview | Generate via `openssl rand -hex 32` (min 32 characters) |
| `NEXTAUTH_SECRET` | Production, Preview | Same value as `AUTH_SECRET` |
| `NODE_ENV` | Production | `"production"` |
| `NEXT_PUBLIC_APP_URL` | Production | `https://your-app-name.vercel.app` (or custom domain) |
| `NEXT_PUBLIC_HOSPITAL_TIMEZONE` | Production, Preview | `"Asia/Kolkata"` |

---

### STEP 6: Deploy Project on Vercel
1. Click **Deploy**.
2. Vercel will run `npm ci`, `prisma generate`, and `next build`.
3. Wait for the build to complete (approx. 1-2 minutes).

---

### STEP 7: Verify Production Health Endpoint
Once deployment finishes, open your browser and navigate to:
```
https://<your-vercel-domain>.vercel.app/api/health
```
**Expected HTTP 200 Response:**
```json
{
  "status": "ok",
  "database": "connected"
}
```

---

### STEP 8: Post-Deployment Smoke Test
1. Visit `https://<your-vercel-domain>.vercel.app/register` and create a test patient account.
2. Log in as patient and browse doctors on `https://<your-vercel-domain>.vercel.app/patient/doctors`.
3. Select an available slot and complete a test booking.
4. Verify the appointment status displays **`BOOKED`**.

---

## 🔒 Neon Connection Strategy Details
- **Runtime Queries:** Serverless functions on Vercel should use Neon's Pooled connection string (`...pooler.region.aws.neon.tech...`) to handle concurrent database connections efficiently.
- **Prisma Migrations:** `npx prisma migrate deploy` can run using the pooled or direct connection string with `sslmode=require`.
