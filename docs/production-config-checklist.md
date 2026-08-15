# Production environment checklist

Startup validation lives in `src/server/config/config-validation.ts` and runs from `src/instrumentation.ts` when `NODE_ENV=production` (skipped during `NEXT_PHASE=phase-production-build`).

## Required

| Variable | Purpose |
| :--- | :--- |
| `AUTH_SECRET` or `NEXTAUTH_SECRET` | Session signing secret, unique, at least 32 characters. Weak placeholders are rejected. |
| `DATABASE_URL` | Production PostgreSQL. Never reuse the E2E/unit databases. |
| `NEXTAUTH_URL` or `AUTH_URL` or `NEXT_PUBLIC_APP_URL` | Canonical application URL. |
| `METRICS_TOKEN` | Protects `/api/metrics`. |
| `CRON_SECRET` or `METRICS_TOKEN` | Authorizes `/api/cron/notifications`. |
| `MEDIA_BUCKET` | Object storage bucket. Production fails closed without it. |
| `STORAGE_PROVIDER` | `s3` (default) or `gcs`. `local` is rejected in production. |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Required for the S3 adapter unless an injectable client is used. |
| `RESEND_API_KEY` and/or Twilio (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`) | At least one notification provider must be configured. |

## Dangerous flags (rejected in production)

These must be unset or `false`. Startup throws if any is `true`:

- `ALLOW_DESTRUCTIVE_SEED`
- `ALLOW_DEV_TENANT_FALLBACK`
- `E2E_TEST_MODE`
- `ALLOW_MOCK_SESSION`
- `OTP_DEMO_MODE`
- `SHOW_DEMO_CREDENTIALS`
- `RATE_LIMIT_DISABLED`
- `STORAGE_PROVIDER=local`

## Isolated test databases

- Unit: `UNIT_TEST_DATABASE_URL` (default `postgresql://postgres:postgres@127.0.0.1:5432/hospital_unit`)
- E2E: `E2E_DATABASE_URL` (default `postgresql://postgres:postgres@127.0.0.1:5432/hospital_e2e`)
- `npm test` and `npm run test:e2e` refuse Neon / shared production URLs.

Optional Docker: `docker compose -f docker-compose.e2e.yml up -d`
