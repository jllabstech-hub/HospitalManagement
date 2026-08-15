-- Harden tenant isolation against existing populated databases.
-- Strategy: drop dangerous defaults → backfill → fail on orphans → FKs/uniques.

-- 1. Remove random UUID defaults (never a valid HospitalProfile id).
ALTER TABLE "Appointment" ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE "AppointmentEnquiry" ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE "BlockedDate" ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE "CentreOfExcellence" ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE "ContactMessage" ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE "Department" ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE "DoctorProfile" ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE "Facility" ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE "FaqItem" ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE "HealthArticle" ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE "HealthPackage" ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE "HomepageSection" ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE "HospitalLocation" ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE "HospitalService" ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE "InsurancePartner" ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE "InternationalPageContent" ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE "InternationalPatientEnquiry" ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE "LeadershipMember" ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE "MediaAsset" ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE "NewsArticle" ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE "PackageInformationRequest" ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE "PatientProfile" ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE "PatientResource" ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE "Speciality" ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE "SuccessStory" ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE "Testimonial" ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE "WeeklyAvailability" ALTER COLUMN "tenantId" DROP DEFAULT;

-- 2. Backfill tenantId from authoritative relationships.
UPDATE "PatientProfile" p
SET "tenantId" = u."tenantId"
FROM "User" u
WHERE p."userId" = u.id
  AND p."tenantId" IS DISTINCT FROM u."tenantId";

UPDATE "DoctorProfile" d
SET "tenantId" = u."tenantId"
FROM "User" u
WHERE d."userId" = u.id
  AND d."tenantId" IS DISTINCT FROM u."tenantId";

UPDATE "WeeklyAvailability" w
SET "tenantId" = d."tenantId"
FROM "DoctorProfile" d
WHERE w."doctorId" = d.id
  AND w."tenantId" IS DISTINCT FROM d."tenantId";

UPDATE "BlockedDate" b
SET "tenantId" = d."tenantId"
FROM "DoctorProfile" d
WHERE b."doctorId" = d.id
  AND b."tenantId" IS DISTINCT FROM d."tenantId";

UPDATE "Appointment" a
SET "tenantId" = d."tenantId"
FROM "DoctorProfile" d
WHERE a."doctorId" = d.id
  AND a."tenantId" IS DISTINCT FROM d."tenantId";

UPDATE "Speciality" s
SET "tenantId" = d."tenantId"
FROM "Department" d
WHERE s."departmentId" = d.id
  AND s."tenantId" IS DISTINCT FROM d."tenantId";

UPDATE "HealthArticle" a
SET "tenantId" = s."tenantId"
FROM "Speciality" s
WHERE a."specialityId" = s.id
  AND a."tenantId" IS DISTINCT FROM s."tenantId";

UPDATE "SuccessStory" st
SET "tenantId" = d."tenantId"
FROM "DoctorProfile" d
WHERE st."doctorId" = d.id
  AND st."tenantId" IS DISTINCT FROM d."tenantId";

UPDATE "AppointmentEnquiry" e
SET "tenantId" = d."tenantId"
FROM "Department" d
WHERE e."departmentId" = d.id
  AND e."tenantId" IS DISTINCT FROM d."tenantId";

UPDATE "AppointmentEnquiry" e
SET "tenantId" = d."tenantId"
FROM "DoctorProfile" d
WHERE e."preferredDoctorId" = d.id
  AND e."tenantId" IS DISTINCT FROM d."tenantId";

-- 3. Fail closed if any tenantId does not reference an active hospital, or clinical rows disagree.
DO $$
DECLARE
  orphan_count integer;
BEGIN
  SELECT COUNT(*) INTO orphan_count FROM (
    SELECT p.id FROM "PatientProfile" p
      LEFT JOIN "HospitalProfile" h ON h.id = p."tenantId"
      WHERE h.id IS NULL
    UNION ALL
    SELECT d.id FROM "DoctorProfile" d
      LEFT JOIN "HospitalProfile" h ON h.id = d."tenantId"
      WHERE h.id IS NULL
    UNION ALL
    SELECT u.id FROM "User" u
      LEFT JOIN "HospitalProfile" h ON h.id = u."tenantId"
      WHERE h.id IS NULL
    UNION ALL
    SELECT a.id FROM "Appointment" a
      JOIN "PatientProfile" p ON p.id = a."patientId"
      JOIN "DoctorProfile" d ON d.id = a."doctorId"
      WHERE p."tenantId" <> d."tenantId" OR a."tenantId" <> d."tenantId"
    UNION ALL
    SELECT d.id FROM "DoctorProfile" d
      JOIN "Department" dept ON dept.id = d."departmentId"
      WHERE d."tenantId" <> dept."tenantId"
    UNION ALL
    SELECT d.id FROM "DoctorProfile" d
      JOIN "User" u ON u.id = d."userId"
      WHERE d."tenantId" <> u."tenantId"
    UNION ALL
    SELECT p.id FROM "PatientProfile" p
      JOIN "User" u ON u.id = p."userId"
      WHERE p."tenantId" <> u."tenantId"
  ) orphans;

  IF orphan_count > 0 THEN
    RAISE EXCEPTION 'Tenant isolation backfill failed: % unresolved/cross-tenant rows remain. Aborting to protect data.', orphan_count;
  END IF;
END $$;

-- 4. Drop obsolete global unique indexes (identifiers are tenant-local).
DROP INDEX IF EXISTS "Department_name_key";
DROP INDEX IF EXISTS "Department_slug_key";
DROP INDEX IF EXISTS "DoctorProfile_slug_key";
DROP INDEX IF EXISTS "HospitalLocation_slug_key";
DROP INDEX IF EXISTS "LeadershipMember_slug_key";
DROP INDEX IF EXISTS "Facility_slug_key";
DROP INDEX IF EXISTS "Speciality_name_key";
DROP INDEX IF EXISTS "Speciality_slug_key";
DROP INDEX IF EXISTS "CentreOfExcellence_name_key";
DROP INDEX IF EXISTS "CentreOfExcellence_slug_key";
DROP INDEX IF EXISTS "HospitalService_name_key";
DROP INDEX IF EXISTS "HospitalService_slug_key";
DROP INDEX IF EXISTS "HealthPackage_slug_key";
DROP INDEX IF EXISTS "HealthArticle_slug_key";
DROP INDEX IF EXISTS "NewsArticle_slug_key";
DROP INDEX IF EXISTS "SuccessStory_slug_key";
DROP INDEX IF EXISTS "PatientResource_slug_key";
DROP INDEX IF EXISTS "InsurancePartner_slug_key";

-- 5. Disambiguate duplicate slugs/names within a tenant before composite unique creation.
DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT id, slug, rn FROM (
      SELECT id, slug, ROW_NUMBER() OVER (PARTITION BY "tenantId", slug ORDER BY "createdAt") AS rn
      FROM "DoctorProfile"
    ) t WHERE rn > 1
  LOOP
    UPDATE "DoctorProfile" SET slug = rec.slug || '-t' || rec.rn WHERE id = rec.id;
  END LOOP;

  FOR rec IN
    SELECT id, slug, rn FROM (
      SELECT id, slug, ROW_NUMBER() OVER (PARTITION BY "tenantId", slug ORDER BY "createdAt") AS rn
      FROM "Department"
    ) t WHERE rn > 1
  LOOP
    UPDATE "Department" SET slug = rec.slug || '-t' || rec.rn WHERE id = rec.id;
  END LOOP;

  FOR rec IN
    SELECT id, name, rn FROM (
      SELECT id, name, ROW_NUMBER() OVER (PARTITION BY "tenantId", name ORDER BY "createdAt") AS rn
      FROM "Department"
    ) t WHERE rn > 1
  LOOP
    UPDATE "Department" SET name = rec.name || ' (' || rec.rn || ')' WHERE id = rec.id;
  END LOOP;

  FOR rec IN
    SELECT id, slug, rn FROM (
      SELECT id, slug, ROW_NUMBER() OVER (PARTITION BY "tenantId", slug ORDER BY "createdAt") AS rn
      FROM "HospitalLocation"
    ) t WHERE rn > 1
  LOOP
    UPDATE "HospitalLocation" SET slug = rec.slug || '-t' || rec.rn WHERE id = rec.id;
  END LOOP;

  FOR rec IN
    SELECT id, slug, rn FROM (
      SELECT id, slug, ROW_NUMBER() OVER (PARTITION BY "tenantId", slug ORDER BY "createdAt") AS rn
      FROM "LeadershipMember"
    ) t WHERE rn > 1
  LOOP
    UPDATE "LeadershipMember" SET slug = rec.slug || '-t' || rec.rn WHERE id = rec.id;
  END LOOP;

  FOR rec IN
    SELECT id, slug, rn FROM (
      SELECT id, slug, ROW_NUMBER() OVER (PARTITION BY "tenantId", slug ORDER BY "createdAt") AS rn
      FROM "Facility"
    ) t WHERE rn > 1
  LOOP
    UPDATE "Facility" SET slug = rec.slug || '-t' || rec.rn WHERE id = rec.id;
  END LOOP;

  FOR rec IN
    SELECT id, slug, rn FROM (
      SELECT id, slug, ROW_NUMBER() OVER (PARTITION BY "tenantId", slug ORDER BY "createdAt") AS rn
      FROM "Speciality"
    ) t WHERE rn > 1
  LOOP
    UPDATE "Speciality" SET slug = rec.slug || '-t' || rec.rn WHERE id = rec.id;
  END LOOP;

  FOR rec IN
    SELECT id, name, rn FROM (
      SELECT id, name, ROW_NUMBER() OVER (PARTITION BY "tenantId", name ORDER BY "createdAt") AS rn
      FROM "Speciality"
    ) t WHERE rn > 1
  LOOP
    UPDATE "Speciality" SET name = rec.name || ' (' || rec.rn || ')' WHERE id = rec.id;
  END LOOP;

  FOR rec IN
    SELECT id, slug, rn FROM (
      SELECT id, slug, ROW_NUMBER() OVER (PARTITION BY "tenantId", slug ORDER BY "createdAt") AS rn
      FROM "CentreOfExcellence"
    ) t WHERE rn > 1
  LOOP
    UPDATE "CentreOfExcellence" SET slug = rec.slug || '-t' || rec.rn WHERE id = rec.id;
  END LOOP;

  FOR rec IN
    SELECT id, name, rn FROM (
      SELECT id, name, ROW_NUMBER() OVER (PARTITION BY "tenantId", name ORDER BY "createdAt") AS rn
      FROM "CentreOfExcellence"
    ) t WHERE rn > 1
  LOOP
    UPDATE "CentreOfExcellence" SET name = rec.name || ' (' || rec.rn || ')' WHERE id = rec.id;
  END LOOP;

  FOR rec IN
    SELECT id, slug, rn FROM (
      SELECT id, slug, ROW_NUMBER() OVER (PARTITION BY "tenantId", slug ORDER BY "createdAt") AS rn
      FROM "HospitalService"
    ) t WHERE rn > 1
  LOOP
    UPDATE "HospitalService" SET slug = rec.slug || '-t' || rec.rn WHERE id = rec.id;
  END LOOP;

  FOR rec IN
    SELECT id, name, rn FROM (
      SELECT id, name, ROW_NUMBER() OVER (PARTITION BY "tenantId", name ORDER BY "createdAt") AS rn
      FROM "HospitalService"
    ) t WHERE rn > 1
  LOOP
    UPDATE "HospitalService" SET name = rec.name || ' (' || rec.rn || ')' WHERE id = rec.id;
  END LOOP;

  FOR rec IN
    SELECT id, slug, rn FROM (
      SELECT id, slug, ROW_NUMBER() OVER (PARTITION BY "tenantId", slug ORDER BY "createdAt") AS rn
      FROM "HealthPackage"
    ) t WHERE rn > 1
  LOOP
    UPDATE "HealthPackage" SET slug = rec.slug || '-t' || rec.rn WHERE id = rec.id;
  END LOOP;

  FOR rec IN
    SELECT id, slug, rn FROM (
      SELECT id, slug, ROW_NUMBER() OVER (PARTITION BY "tenantId", slug ORDER BY "createdAt") AS rn
      FROM "HealthArticle"
    ) t WHERE rn > 1
  LOOP
    UPDATE "HealthArticle" SET slug = rec.slug || '-t' || rec.rn WHERE id = rec.id;
  END LOOP;

  FOR rec IN
    SELECT id, slug, rn FROM (
      SELECT id, slug, ROW_NUMBER() OVER (PARTITION BY "tenantId", slug ORDER BY "createdAt") AS rn
      FROM "NewsArticle"
    ) t WHERE rn > 1
  LOOP
    UPDATE "NewsArticle" SET slug = rec.slug || '-t' || rec.rn WHERE id = rec.id;
  END LOOP;

  FOR rec IN
    SELECT id, slug, rn FROM (
      SELECT id, slug, ROW_NUMBER() OVER (PARTITION BY "tenantId", slug ORDER BY "createdAt") AS rn
      FROM "SuccessStory"
    ) t WHERE rn > 1
  LOOP
    UPDATE "SuccessStory" SET slug = rec.slug || '-t' || rec.rn WHERE id = rec.id;
  END LOOP;

  FOR rec IN
    SELECT id, slug, rn FROM (
      SELECT id, slug, ROW_NUMBER() OVER (PARTITION BY "tenantId", slug ORDER BY "createdAt") AS rn
      FROM "PatientResource"
    ) t WHERE rn > 1
  LOOP
    UPDATE "PatientResource" SET slug = rec.slug || '-t' || rec.rn WHERE id = rec.id;
  END LOOP;

  FOR rec IN
    SELECT id, slug, rn FROM (
      SELECT id, slug, ROW_NUMBER() OVER (PARTITION BY "tenantId", slug ORDER BY "createdAt") AS rn
      FROM "InsurancePartner"
    ) t WHERE rn > 1
  LOOP
    UPDATE "InsurancePartner" SET slug = rec.slug || '-t' || rec.rn WHERE id = rec.id;
  END LOOP;
END $$;

-- Keep a single international page per tenant.
DELETE FROM "InternationalPageContent" a
USING "InternationalPageContent" b
WHERE a."tenantId" = b."tenantId"
  AND (
    a."createdAt" > b."createdAt"
    OR (a."createdAt" = b."createdAt" AND a.id > b.id)
  );

-- 6. Composite unique constraints and supporting unique(id, tenantId) for integrity.
CREATE UNIQUE INDEX IF NOT EXISTS "User_id_tenantId_key" ON "User"("id", "tenantId");
CREATE INDEX IF NOT EXISTS "User_tenantId_idx" ON "User"("tenantId");

CREATE UNIQUE INDEX IF NOT EXISTS "PatientProfile_id_tenantId_key" ON "PatientProfile"("id", "tenantId");
CREATE INDEX IF NOT EXISTS "PatientProfile_tenantId_idx" ON "PatientProfile"("tenantId");

CREATE UNIQUE INDEX IF NOT EXISTS "Department_id_tenantId_key" ON "Department"("id", "tenantId");
CREATE UNIQUE INDEX IF NOT EXISTS "Department_tenantId_name_key" ON "Department"("tenantId", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "Department_tenantId_slug_key" ON "Department"("tenantId", "slug");
CREATE INDEX IF NOT EXISTS "Department_tenantId_idx" ON "Department"("tenantId");

CREATE UNIQUE INDEX IF NOT EXISTS "DoctorProfile_id_tenantId_key" ON "DoctorProfile"("id", "tenantId");
CREATE UNIQUE INDEX IF NOT EXISTS "DoctorProfile_tenantId_slug_key" ON "DoctorProfile"("tenantId", "slug");
CREATE INDEX IF NOT EXISTS "DoctorProfile_tenantId_idx" ON "DoctorProfile"("tenantId");

CREATE UNIQUE INDEX IF NOT EXISTS "WeeklyAvailability_id_tenantId_key" ON "WeeklyAvailability"("id", "tenantId");
CREATE INDEX IF NOT EXISTS "WeeklyAvailability_tenantId_idx" ON "WeeklyAvailability"("tenantId");

CREATE UNIQUE INDEX IF NOT EXISTS "BlockedDate_id_tenantId_key" ON "BlockedDate"("id", "tenantId");
CREATE INDEX IF NOT EXISTS "BlockedDate_tenantId_idx" ON "BlockedDate"("tenantId");

CREATE UNIQUE INDEX IF NOT EXISTS "Appointment_id_tenantId_key" ON "Appointment"("id", "tenantId");
CREATE INDEX IF NOT EXISTS "Appointment_tenantId_idx" ON "Appointment"("tenantId");

CREATE UNIQUE INDEX IF NOT EXISTS "HospitalLocation_tenantId_slug_key" ON "HospitalLocation"("tenantId", "slug");
CREATE INDEX IF NOT EXISTS "HospitalLocation_tenantId_idx" ON "HospitalLocation"("tenantId");

CREATE UNIQUE INDEX IF NOT EXISTS "LeadershipMember_tenantId_slug_key" ON "LeadershipMember"("tenantId", "slug");
CREATE INDEX IF NOT EXISTS "LeadershipMember_tenantId_idx" ON "LeadershipMember"("tenantId");

CREATE UNIQUE INDEX IF NOT EXISTS "Facility_tenantId_slug_key" ON "Facility"("tenantId", "slug");
CREATE INDEX IF NOT EXISTS "Facility_tenantId_idx" ON "Facility"("tenantId");

CREATE UNIQUE INDEX IF NOT EXISTS "Speciality_id_tenantId_key" ON "Speciality"("id", "tenantId");
CREATE UNIQUE INDEX IF NOT EXISTS "Speciality_tenantId_name_key" ON "Speciality"("tenantId", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "Speciality_tenantId_slug_key" ON "Speciality"("tenantId", "slug");
CREATE INDEX IF NOT EXISTS "Speciality_tenantId_idx" ON "Speciality"("tenantId");

CREATE UNIQUE INDEX IF NOT EXISTS "CentreOfExcellence_tenantId_name_key" ON "CentreOfExcellence"("tenantId", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "CentreOfExcellence_tenantId_slug_key" ON "CentreOfExcellence"("tenantId", "slug");
CREATE INDEX IF NOT EXISTS "CentreOfExcellence_tenantId_idx" ON "CentreOfExcellence"("tenantId");

CREATE UNIQUE INDEX IF NOT EXISTS "HospitalService_tenantId_name_key" ON "HospitalService"("tenantId", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "HospitalService_tenantId_slug_key" ON "HospitalService"("tenantId", "slug");
CREATE INDEX IF NOT EXISTS "HospitalService_tenantId_idx" ON "HospitalService"("tenantId");

CREATE UNIQUE INDEX IF NOT EXISTS "HealthPackage_tenantId_slug_key" ON "HealthPackage"("tenantId", "slug");
CREATE INDEX IF NOT EXISTS "HealthPackage_tenantId_idx" ON "HealthPackage"("tenantId");

CREATE UNIQUE INDEX IF NOT EXISTS "HealthArticle_tenantId_slug_key" ON "HealthArticle"("tenantId", "slug");
CREATE INDEX IF NOT EXISTS "HealthArticle_tenantId_idx" ON "HealthArticle"("tenantId");

CREATE UNIQUE INDEX IF NOT EXISTS "NewsArticle_tenantId_slug_key" ON "NewsArticle"("tenantId", "slug");
CREATE INDEX IF NOT EXISTS "NewsArticle_tenantId_idx" ON "NewsArticle"("tenantId");

CREATE UNIQUE INDEX IF NOT EXISTS "SuccessStory_tenantId_slug_key" ON "SuccessStory"("tenantId", "slug");
CREATE INDEX IF NOT EXISTS "SuccessStory_tenantId_idx" ON "SuccessStory"("tenantId");

CREATE INDEX IF NOT EXISTS "Testimonial_tenantId_idx" ON "Testimonial"("tenantId");
CREATE INDEX IF NOT EXISTS "FaqItem_tenantId_idx" ON "FaqItem"("tenantId");

CREATE UNIQUE INDEX IF NOT EXISTS "PatientResource_tenantId_slug_key" ON "PatientResource"("tenantId", "slug");
CREATE INDEX IF NOT EXISTS "PatientResource_tenantId_idx" ON "PatientResource"("tenantId");

CREATE UNIQUE INDEX IF NOT EXISTS "InsurancePartner_tenantId_slug_key" ON "InsurancePartner"("tenantId", "slug");
CREATE INDEX IF NOT EXISTS "InsurancePartner_tenantId_idx" ON "InsurancePartner"("tenantId");

CREATE UNIQUE INDEX IF NOT EXISTS "InternationalPageContent_tenantId_key" ON "InternationalPageContent"("tenantId");
CREATE INDEX IF NOT EXISTS "InternationalPageContent_tenantId_idx" ON "InternationalPageContent"("tenantId");

CREATE INDEX IF NOT EXISTS "HomepageSection_tenantId_idx" ON "HomepageSection"("tenantId");

CREATE INDEX IF NOT EXISTS "MediaAsset_tenantId_idx" ON "MediaAsset"("tenantId");
CREATE INDEX IF NOT EXISTS "AppointmentEnquiry_tenantId_idx" ON "AppointmentEnquiry"("tenantId");
CREATE INDEX IF NOT EXISTS "ContactMessage_tenantId_idx" ON "ContactMessage"("tenantId");
CREATE INDEX IF NOT EXISTS "InternationalPatientEnquiry_tenantId_idx" ON "InternationalPatientEnquiry"("tenantId");
CREATE INDEX IF NOT EXISTS "PackageInformationRequest_tenantId_idx" ON "PackageInformationRequest"("tenantId");

-- 7. Composite foreign keys prevent cross-tenant clinical references.
ALTER TABLE "PatientProfile"
  DROP CONSTRAINT IF EXISTS "PatientProfile_user_tenant_fkey",
  ADD CONSTRAINT "PatientProfile_user_tenant_fkey"
    FOREIGN KEY ("userId", "tenantId") REFERENCES "User"("id", "tenantId") ON DELETE CASCADE;

ALTER TABLE "DoctorProfile"
  DROP CONSTRAINT IF EXISTS "DoctorProfile_user_tenant_fkey",
  ADD CONSTRAINT "DoctorProfile_user_tenant_fkey"
    FOREIGN KEY ("userId", "tenantId") REFERENCES "User"("id", "tenantId") ON DELETE CASCADE;

ALTER TABLE "DoctorProfile"
  DROP CONSTRAINT IF EXISTS "DoctorProfile_department_tenant_fkey",
  ADD CONSTRAINT "DoctorProfile_department_tenant_fkey"
    FOREIGN KEY ("departmentId", "tenantId") REFERENCES "Department"("id", "tenantId");

ALTER TABLE "WeeklyAvailability"
  DROP CONSTRAINT IF EXISTS "WeeklyAvailability_doctor_tenant_fkey",
  ADD CONSTRAINT "WeeklyAvailability_doctor_tenant_fkey"
    FOREIGN KEY ("doctorId", "tenantId") REFERENCES "DoctorProfile"("id", "tenantId") ON DELETE CASCADE;

ALTER TABLE "BlockedDate"
  DROP CONSTRAINT IF EXISTS "BlockedDate_doctor_tenant_fkey",
  ADD CONSTRAINT "BlockedDate_doctor_tenant_fkey"
    FOREIGN KEY ("doctorId", "tenantId") REFERENCES "DoctorProfile"("id", "tenantId") ON DELETE CASCADE;

ALTER TABLE "Appointment"
  DROP CONSTRAINT IF EXISTS "Appointment_patient_tenant_fkey",
  ADD CONSTRAINT "Appointment_patient_tenant_fkey"
    FOREIGN KEY ("patientId", "tenantId") REFERENCES "PatientProfile"("id", "tenantId");

ALTER TABLE "Appointment"
  DROP CONSTRAINT IF EXISTS "Appointment_doctor_tenant_fkey",
  ADD CONSTRAINT "Appointment_doctor_tenant_fkey"
    FOREIGN KEY ("doctorId", "tenantId") REFERENCES "DoctorProfile"("id", "tenantId");

-- 8. Notification outbox columns + required tenantId.
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "attemptCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "maxAttempts" INTEGER NOT NULL DEFAULT 8;
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "nextRetryAt" TIMESTAMP(3);
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "lastError" TEXT;

UPDATE "Notification" n
SET "tenantId" = u."tenantId"
FROM "User" u
WHERE n."recipientUserId" = u.id
  AND (n."tenantId" IS NULL OR n."tenantId" IS DISTINCT FROM u."tenantId");

DO $$
DECLARE
  null_count integer;
BEGIN
  SELECT COUNT(*) INTO null_count FROM "Notification" WHERE "tenantId" IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Cannot require Notification.tenantId: % rows remain unscoped.', null_count;
  END IF;
END $$;

ALTER TABLE "Notification" ALTER COLUMN "tenantId" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Notification_tenantId_fkey'
  ) THEN
    ALTER TABLE "Notification"
      ADD CONSTRAINT "Notification_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "HospitalProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "Notification_idempotencyKey_key" ON "Notification"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "Notification_status_nextRetryAt_idx" ON "Notification"("status", "nextRetryAt");

-- 9. OTP, audit, and auth-attempt tables.
CREATE TABLE IF NOT EXISTS "OtpChallenge" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "phone" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "consumedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpChallenge_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "OtpChallenge_tenantId_phone_createdAt_idx" ON "OtpChallenge"("tenantId", "phone", "createdAt");
CREATE INDEX IF NOT EXISTS "OtpChallenge_expiresAt_idx" ON "OtpChallenge"("expiresAt");

ALTER TABLE "OtpChallenge"
  DROP CONSTRAINT IF EXISTS "OtpChallenge_tenantId_fkey",
  ADD CONSTRAINT "OtpChallenge_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "HospitalProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "actorUserId" UUID,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "correlationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AuditLog_tenantId_createdAt_idx" ON "AuditLog"("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "AuditLog_actorUserId_idx" ON "AuditLog"("actorUserId");

ALTER TABLE "AuditLog"
  DROP CONSTRAINT IF EXISTS "AuditLog_tenantId_fkey",
  ADD CONSTRAINT "AuditLog_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "HospitalProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuditLog"
  DROP CONSTRAINT IF EXISTS "AuditLog_actorUserId_fkey",
  ADD CONSTRAINT "AuditLog_actorUserId_fkey"
    FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "AuthAttempt" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" UUID,
    "key" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthAttempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AuthAttempt_kind_key_createdAt_idx" ON "AuthAttempt"("kind", "key", "createdAt");
CREATE INDEX IF NOT EXISTS "AuthAttempt_tenantId_createdAt_idx" ON "AuthAttempt"("tenantId", "createdAt");

ALTER TABLE "AuthAttempt"
  DROP CONSTRAINT IF EXISTS "AuthAttempt_tenantId_fkey",
  ADD CONSTRAINT "AuthAttempt_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "HospitalProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
