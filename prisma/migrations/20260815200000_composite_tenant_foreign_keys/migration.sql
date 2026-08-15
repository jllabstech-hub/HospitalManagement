-- Composite tenant-aware foreign keys for clinical/CMS relationships.
-- 1. Fail closed if any cross-tenant rows exist.
-- 2. Add missing (id, tenantId) uniques.
-- 3. Add tenantId to join tables and backfill.
-- 4. Drop obsolete single-column FKs.
-- 5. Create composite FKs (MATCH SIMPLE for optional parents).

DO $$
DECLARE
  bad integer;
BEGIN
  SELECT COUNT(*) INTO bad FROM "DoctorProfile" d
    JOIN "Department" p ON p.id = d."departmentId"
    WHERE d."tenantId" IS DISTINCT FROM p."tenantId";
  IF bad > 0 THEN RAISE EXCEPTION 'Cross-tenant DoctorProfile.departmentId rows: %', bad; END IF;

  SELECT COUNT(*) INTO bad FROM "PatientProfile" p
    JOIN "User" u ON u.id = p."userId"
    WHERE p."tenantId" IS DISTINCT FROM u."tenantId";
  IF bad > 0 THEN RAISE EXCEPTION 'Cross-tenant PatientProfile.userId rows: %', bad; END IF;

  SELECT COUNT(*) INTO bad FROM "Appointment" a
    JOIN "PatientProfile" p ON p.id = a."patientId"
    WHERE a."tenantId" IS DISTINCT FROM p."tenantId";
  IF bad > 0 THEN RAISE EXCEPTION 'Cross-tenant Appointment.patientId rows: %', bad; END IF;

  SELECT COUNT(*) INTO bad FROM "Appointment" a
    JOIN "DoctorProfile" d ON d.id = a."doctorId"
    WHERE a."tenantId" IS DISTINCT FROM d."tenantId";
  IF bad > 0 THEN RAISE EXCEPTION 'Cross-tenant Appointment.doctorId rows: %', bad; END IF;

  SELECT COUNT(*) INTO bad FROM "WeeklyAvailability" w
    JOIN "DoctorProfile" d ON d.id = w."doctorId"
    WHERE w."tenantId" IS DISTINCT FROM d."tenantId";
  IF bad > 0 THEN RAISE EXCEPTION 'Cross-tenant WeeklyAvailability.doctorId rows: %', bad; END IF;

  SELECT COUNT(*) INTO bad FROM "BlockedDate" b
    JOIN "DoctorProfile" d ON d.id = b."doctorId"
    WHERE b."tenantId" IS DISTINCT FROM d."tenantId";
  IF bad > 0 THEN RAISE EXCEPTION 'Cross-tenant BlockedDate.doctorId rows: %', bad; END IF;

  SELECT COUNT(*) INTO bad FROM "Speciality" s
    JOIN "Department" d ON d.id = s."departmentId"
    WHERE s."departmentId" IS NOT NULL AND s."tenantId" IS DISTINCT FROM d."tenantId";
  IF bad > 0 THEN RAISE EXCEPTION 'Cross-tenant Speciality.departmentId rows: %', bad; END IF;

  SELECT COUNT(*) INTO bad FROM "DoctorSpeciality" ds
    JOIN "DoctorProfile" d ON d.id = ds."doctorId"
    JOIN "Speciality" s ON s.id = ds."specialityId"
    WHERE d."tenantId" IS DISTINCT FROM s."tenantId";
  IF bad > 0 THEN RAISE EXCEPTION 'Cross-tenant DoctorSpeciality rows: %', bad; END IF;

  SELECT COUNT(*) INTO bad FROM "DoctorCentre" dc
    JOIN "DoctorProfile" d ON d.id = dc."doctorId"
    JOIN "CentreOfExcellence" c ON c.id = dc."centreId"
    WHERE d."tenantId" IS DISTINCT FROM c."tenantId";
  IF bad > 0 THEN RAISE EXCEPTION 'Cross-tenant DoctorCentre rows: %', bad; END IF;

  SELECT COUNT(*) INTO bad FROM "CentreSpeciality" cs
    JOIN "CentreOfExcellence" c ON c.id = cs."centreId"
    JOIN "Speciality" s ON s.id = cs."specialityId"
    WHERE c."tenantId" IS DISTINCT FROM s."tenantId";
  IF bad > 0 THEN RAISE EXCEPTION 'Cross-tenant CentreSpeciality rows: %', bad; END IF;

  SELECT COUNT(*) INTO bad FROM "CentreService" cs
    JOIN "CentreOfExcellence" c ON c.id = cs."centreId"
    JOIN "HospitalService" s ON s.id = cs."serviceId"
    WHERE c."tenantId" IS DISTINCT FROM s."tenantId";
  IF bad > 0 THEN RAISE EXCEPTION 'Cross-tenant CentreService rows: %', bad; END IF;

  SELECT COUNT(*) INTO bad FROM "HealthArticle" a
    JOIN "Speciality" s ON s.id = a."specialityId"
    WHERE a."specialityId" IS NOT NULL AND a."tenantId" IS DISTINCT FROM s."tenantId";
  IF bad > 0 THEN RAISE EXCEPTION 'Cross-tenant HealthArticle.specialityId rows: %', bad; END IF;

  SELECT COUNT(*) INTO bad FROM "SuccessStory" st
    JOIN "Speciality" s ON s.id = st."specialityId"
    WHERE st."specialityId" IS NOT NULL AND st."tenantId" IS DISTINCT FROM s."tenantId";
  IF bad > 0 THEN RAISE EXCEPTION 'Cross-tenant SuccessStory.specialityId rows: %', bad; END IF;

  SELECT COUNT(*) INTO bad FROM "SuccessStory" st
    JOIN "DoctorProfile" d ON d.id = st."doctorId"
    WHERE st."doctorId" IS NOT NULL AND st."tenantId" IS DISTINCT FROM d."tenantId";
  IF bad > 0 THEN RAISE EXCEPTION 'Cross-tenant SuccessStory.doctorId rows: %', bad; END IF;

  SELECT COUNT(*) INTO bad FROM "Testimonial" t
    JOIN "Speciality" s ON s.id = t."specialityId"
    WHERE t."specialityId" IS NOT NULL AND t."tenantId" IS DISTINCT FROM s."tenantId";
  IF bad > 0 THEN RAISE EXCEPTION 'Cross-tenant Testimonial.specialityId rows: %', bad; END IF;

  SELECT COUNT(*) INTO bad FROM "AppointmentEnquiry" e
    JOIN "Department" d ON d.id = e."departmentId"
    WHERE e."departmentId" IS NOT NULL AND e."tenantId" IS DISTINCT FROM d."tenantId";
  IF bad > 0 THEN RAISE EXCEPTION 'Cross-tenant AppointmentEnquiry.departmentId rows: %', bad; END IF;

  SELECT COUNT(*) INTO bad FROM "AppointmentEnquiry" e
    JOIN "DoctorProfile" d ON d.id = e."preferredDoctorId"
    WHERE e."preferredDoctorId" IS NOT NULL AND e."tenantId" IS DISTINCT FROM d."tenantId";
  IF bad > 0 THEN RAISE EXCEPTION 'Cross-tenant AppointmentEnquiry.preferredDoctorId rows: %', bad; END IF;

  SELECT COUNT(*) INTO bad FROM "Notification" n
    JOIN "User" u ON u.id = n."recipientUserId"
    WHERE n."tenantId" IS DISTINCT FROM u."tenantId";
  IF bad > 0 THEN RAISE EXCEPTION 'Cross-tenant Notification.recipientUserId rows: %', bad; END IF;

  SELECT COUNT(*) INTO bad FROM "Notification" n
    JOIN "Appointment" a ON a.id = n."appointmentId"
    WHERE n."appointmentId" IS NOT NULL AND n."tenantId" IS DISTINCT FROM a."tenantId";
  IF bad > 0 THEN RAISE EXCEPTION 'Cross-tenant Notification.appointmentId rows: %', bad; END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "CentreOfExcellence_id_tenantId_key" ON "CentreOfExcellence"("id", "tenantId");
CREATE UNIQUE INDEX IF NOT EXISTS "HospitalService_id_tenantId_key" ON "HospitalService"("id", "tenantId");
CREATE UNIQUE INDEX IF NOT EXISTS "HealthArticle_id_tenantId_key" ON "HealthArticle"("id", "tenantId");
CREATE UNIQUE INDEX IF NOT EXISTS "SuccessStory_id_tenantId_key" ON "SuccessStory"("id", "tenantId");
CREATE UNIQUE INDEX IF NOT EXISTS "Testimonial_id_tenantId_key" ON "Testimonial"("id", "tenantId");
CREATE UNIQUE INDEX IF NOT EXISTS "AppointmentEnquiry_id_tenantId_key" ON "AppointmentEnquiry"("id", "tenantId");
CREATE UNIQUE INDEX IF NOT EXISTS "Notification_id_tenantId_key" ON "Notification"("id", "tenantId");
CREATE UNIQUE INDEX IF NOT EXISTS "User_id_tenantId_key" ON "User"("id", "tenantId");
CREATE UNIQUE INDEX IF NOT EXISTS "PatientProfile_id_tenantId_key" ON "PatientProfile"("id", "tenantId");
CREATE UNIQUE INDEX IF NOT EXISTS "PatientProfile_userId_tenantId_key" ON "PatientProfile"("userId", "tenantId");
CREATE UNIQUE INDEX IF NOT EXISTS "DoctorProfile_userId_tenantId_key" ON "DoctorProfile"("userId", "tenantId");
CREATE UNIQUE INDEX IF NOT EXISTS "Department_id_tenantId_key" ON "Department"("id", "tenantId");
CREATE UNIQUE INDEX IF NOT EXISTS "DoctorProfile_id_tenantId_key" ON "DoctorProfile"("id", "tenantId");
CREATE UNIQUE INDEX IF NOT EXISTS "WeeklyAvailability_id_tenantId_key" ON "WeeklyAvailability"("id", "tenantId");
CREATE UNIQUE INDEX IF NOT EXISTS "BlockedDate_id_tenantId_key" ON "BlockedDate"("id", "tenantId");
CREATE UNIQUE INDEX IF NOT EXISTS "Appointment_id_tenantId_key" ON "Appointment"("id", "tenantId");
CREATE UNIQUE INDEX IF NOT EXISTS "Speciality_id_tenantId_key" ON "Speciality"("id", "tenantId");

ALTER TABLE "DoctorSpeciality" ADD COLUMN IF NOT EXISTS "tenantId" UUID;
UPDATE "DoctorSpeciality" ds SET "tenantId" = d."tenantId" FROM "DoctorProfile" d WHERE ds."doctorId" = d.id AND ds."tenantId" IS NULL;
ALTER TABLE "DoctorCentre" ADD COLUMN IF NOT EXISTS "tenantId" UUID;
UPDATE "DoctorCentre" dc SET "tenantId" = d."tenantId" FROM "DoctorProfile" d WHERE dc."doctorId" = d.id AND dc."tenantId" IS NULL;
ALTER TABLE "CentreSpeciality" ADD COLUMN IF NOT EXISTS "tenantId" UUID;
UPDATE "CentreSpeciality" cs SET "tenantId" = c."tenantId" FROM "CentreOfExcellence" c WHERE cs."centreId" = c.id AND cs."tenantId" IS NULL;
ALTER TABLE "CentreService" ADD COLUMN IF NOT EXISTS "tenantId" UUID;
UPDATE "CentreService" cs SET "tenantId" = c."tenantId" FROM "CentreOfExcellence" c WHERE cs."centreId" = c.id AND cs."tenantId" IS NULL;

DO $$
DECLARE
  null_count integer;
BEGIN
  SELECT COUNT(*) INTO null_count FROM "DoctorSpeciality" WHERE "tenantId" IS NULL;
  IF null_count > 0 THEN RAISE EXCEPTION 'DoctorSpeciality.tenantId still null: %', null_count; END IF;
  SELECT COUNT(*) INTO null_count FROM "DoctorCentre" WHERE "tenantId" IS NULL;
  IF null_count > 0 THEN RAISE EXCEPTION 'DoctorCentre.tenantId still null: %', null_count; END IF;
  SELECT COUNT(*) INTO null_count FROM "CentreSpeciality" WHERE "tenantId" IS NULL;
  IF null_count > 0 THEN RAISE EXCEPTION 'CentreSpeciality.tenantId still null: %', null_count; END IF;
  SELECT COUNT(*) INTO null_count FROM "CentreService" WHERE "tenantId" IS NULL;
  IF null_count > 0 THEN RAISE EXCEPTION 'CentreService.tenantId still null: %', null_count; END IF;
END $$;

ALTER TABLE "DoctorSpeciality" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "DoctorCentre" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "CentreSpeciality" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "CentreService" ALTER COLUMN "tenantId" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "DoctorSpeciality_tenantId_idx" ON "DoctorSpeciality"("tenantId");
CREATE INDEX IF NOT EXISTS "DoctorCentre_tenantId_idx" ON "DoctorCentre"("tenantId");
CREATE INDEX IF NOT EXISTS "CentreSpeciality_tenantId_idx" ON "CentreSpeciality"("tenantId");
CREATE INDEX IF NOT EXISTS "CentreService_tenantId_idx" ON "CentreService"("tenantId");

ALTER TABLE "PatientProfile" DROP CONSTRAINT IF EXISTS "PatientProfile_userId_fkey";
ALTER TABLE "DoctorProfile" DROP CONSTRAINT IF EXISTS "DoctorProfile_userId_fkey";
ALTER TABLE "DoctorProfile" DROP CONSTRAINT IF EXISTS "DoctorProfile_departmentId_fkey";
ALTER TABLE "WeeklyAvailability" DROP CONSTRAINT IF EXISTS "WeeklyAvailability_doctorId_fkey";
ALTER TABLE "BlockedDate" DROP CONSTRAINT IF EXISTS "BlockedDate_doctorId_fkey";
ALTER TABLE "Appointment" DROP CONSTRAINT IF EXISTS "Appointment_patientId_fkey";
ALTER TABLE "Appointment" DROP CONSTRAINT IF EXISTS "Appointment_doctorId_fkey";
ALTER TABLE "Speciality" DROP CONSTRAINT IF EXISTS "Speciality_departmentId_fkey";
ALTER TABLE "DoctorSpeciality" DROP CONSTRAINT IF EXISTS "DoctorSpeciality_doctorId_fkey";
ALTER TABLE "DoctorSpeciality" DROP CONSTRAINT IF EXISTS "DoctorSpeciality_specialityId_fkey";
ALTER TABLE "DoctorCentre" DROP CONSTRAINT IF EXISTS "DoctorCentre_doctorId_fkey";
ALTER TABLE "DoctorCentre" DROP CONSTRAINT IF EXISTS "DoctorCentre_centreId_fkey";
ALTER TABLE "CentreSpeciality" DROP CONSTRAINT IF EXISTS "CentreSpeciality_centreId_fkey";
ALTER TABLE "CentreSpeciality" DROP CONSTRAINT IF EXISTS "CentreSpeciality_specialityId_fkey";
ALTER TABLE "CentreService" DROP CONSTRAINT IF EXISTS "CentreService_centreId_fkey";
ALTER TABLE "CentreService" DROP CONSTRAINT IF EXISTS "CentreService_serviceId_fkey";
ALTER TABLE "HealthArticle" DROP CONSTRAINT IF EXISTS "HealthArticle_specialityId_fkey";
ALTER TABLE "SuccessStory" DROP CONSTRAINT IF EXISTS "SuccessStory_specialityId_fkey";
ALTER TABLE "SuccessStory" DROP CONSTRAINT IF EXISTS "SuccessStory_doctorId_fkey";
ALTER TABLE "Testimonial" DROP CONSTRAINT IF EXISTS "Testimonial_specialityId_fkey";
ALTER TABLE "AppointmentEnquiry" DROP CONSTRAINT IF EXISTS "AppointmentEnquiry_departmentId_fkey";
ALTER TABLE "AppointmentEnquiry" DROP CONSTRAINT IF EXISTS "AppointmentEnquiry_preferredDoctorId_fkey";
ALTER TABLE "Notification" DROP CONSTRAINT IF EXISTS "Notification_recipientUserId_fkey";
ALTER TABLE "Notification" DROP CONSTRAINT IF EXISTS "Notification_appointmentId_fkey";
ALTER TABLE "AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_actorUserId_fkey";

ALTER TABLE "PatientProfile" DROP CONSTRAINT IF EXISTS "PatientProfile_user_tenant_fkey";
ALTER TABLE "DoctorProfile" DROP CONSTRAINT IF EXISTS "DoctorProfile_user_tenant_fkey";
ALTER TABLE "DoctorProfile" DROP CONSTRAINT IF EXISTS "DoctorProfile_department_tenant_fkey";
ALTER TABLE "WeeklyAvailability" DROP CONSTRAINT IF EXISTS "WeeklyAvailability_doctor_tenant_fkey";
ALTER TABLE "BlockedDate" DROP CONSTRAINT IF EXISTS "BlockedDate_doctor_tenant_fkey";
ALTER TABLE "Appointment" DROP CONSTRAINT IF EXISTS "Appointment_patient_tenant_fkey";
ALTER TABLE "Appointment" DROP CONSTRAINT IF EXISTS "Appointment_doctor_tenant_fkey";

ALTER TABLE "PatientProfile"
  ADD CONSTRAINT "PatientProfile_userId_tenantId_fkey"
  FOREIGN KEY ("userId", "tenantId") REFERENCES "User"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DoctorProfile"
  ADD CONSTRAINT "DoctorProfile_userId_tenantId_fkey"
  FOREIGN KEY ("userId", "tenantId") REFERENCES "User"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DoctorProfile"
  ADD CONSTRAINT "DoctorProfile_departmentId_tenantId_fkey"
  FOREIGN KEY ("departmentId", "tenantId") REFERENCES "Department"("id", "tenantId") ON UPDATE CASCADE;

ALTER TABLE "WeeklyAvailability"
  ADD CONSTRAINT "WeeklyAvailability_doctorId_tenantId_fkey"
  FOREIGN KEY ("doctorId", "tenantId") REFERENCES "DoctorProfile"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BlockedDate"
  ADD CONSTRAINT "BlockedDate_doctorId_tenantId_fkey"
  FOREIGN KEY ("doctorId", "tenantId") REFERENCES "DoctorProfile"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Appointment"
  ADD CONSTRAINT "Appointment_patientId_tenantId_fkey"
  FOREIGN KEY ("patientId", "tenantId") REFERENCES "PatientProfile"("id", "tenantId") ON UPDATE CASCADE;

ALTER TABLE "Appointment"
  ADD CONSTRAINT "Appointment_doctorId_tenantId_fkey"
  FOREIGN KEY ("doctorId", "tenantId") REFERENCES "DoctorProfile"("id", "tenantId") ON UPDATE CASCADE;

ALTER TABLE "Speciality"
  ADD CONSTRAINT "Speciality_departmentId_tenantId_fkey"
  FOREIGN KEY ("departmentId", "tenantId") REFERENCES "Department"("id", "tenantId")
  ON DELETE SET NULL ("departmentId") ON UPDATE CASCADE;

ALTER TABLE "DoctorSpeciality"
  ADD CONSTRAINT "DoctorSpeciality_doctorId_tenantId_fkey"
  FOREIGN KEY ("doctorId", "tenantId") REFERENCES "DoctorProfile"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DoctorSpeciality"
  ADD CONSTRAINT "DoctorSpeciality_specialityId_tenantId_fkey"
  FOREIGN KEY ("specialityId", "tenantId") REFERENCES "Speciality"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DoctorCentre"
  ADD CONSTRAINT "DoctorCentre_doctorId_tenantId_fkey"
  FOREIGN KEY ("doctorId", "tenantId") REFERENCES "DoctorProfile"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DoctorCentre"
  ADD CONSTRAINT "DoctorCentre_centreId_tenantId_fkey"
  FOREIGN KEY ("centreId", "tenantId") REFERENCES "CentreOfExcellence"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CentreSpeciality"
  ADD CONSTRAINT "CentreSpeciality_centreId_tenantId_fkey"
  FOREIGN KEY ("centreId", "tenantId") REFERENCES "CentreOfExcellence"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CentreSpeciality"
  ADD CONSTRAINT "CentreSpeciality_specialityId_tenantId_fkey"
  FOREIGN KEY ("specialityId", "tenantId") REFERENCES "Speciality"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CentreService"
  ADD CONSTRAINT "CentreService_centreId_tenantId_fkey"
  FOREIGN KEY ("centreId", "tenantId") REFERENCES "CentreOfExcellence"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CentreService"
  ADD CONSTRAINT "CentreService_serviceId_tenantId_fkey"
  FOREIGN KEY ("serviceId", "tenantId") REFERENCES "HospitalService"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HealthArticle"
  ADD CONSTRAINT "HealthArticle_specialityId_tenantId_fkey"
  FOREIGN KEY ("specialityId", "tenantId") REFERENCES "Speciality"("id", "tenantId")
  ON DELETE SET NULL ("specialityId") ON UPDATE CASCADE;

ALTER TABLE "SuccessStory"
  ADD CONSTRAINT "SuccessStory_specialityId_tenantId_fkey"
  FOREIGN KEY ("specialityId", "tenantId") REFERENCES "Speciality"("id", "tenantId")
  ON DELETE SET NULL ("specialityId") ON UPDATE CASCADE;

ALTER TABLE "SuccessStory"
  ADD CONSTRAINT "SuccessStory_doctorId_tenantId_fkey"
  FOREIGN KEY ("doctorId", "tenantId") REFERENCES "DoctorProfile"("id", "tenantId")
  ON DELETE SET NULL ("doctorId") ON UPDATE CASCADE;

ALTER TABLE "Testimonial"
  ADD CONSTRAINT "Testimonial_specialityId_tenantId_fkey"
  FOREIGN KEY ("specialityId", "tenantId") REFERENCES "Speciality"("id", "tenantId")
  ON DELETE SET NULL ("specialityId") ON UPDATE CASCADE;

ALTER TABLE "AppointmentEnquiry"
  ADD CONSTRAINT "AppointmentEnquiry_departmentId_tenantId_fkey"
  FOREIGN KEY ("departmentId", "tenantId") REFERENCES "Department"("id", "tenantId")
  ON DELETE SET NULL ("departmentId") ON UPDATE CASCADE;

ALTER TABLE "AppointmentEnquiry"
  ADD CONSTRAINT "AppointmentEnquiry_preferredDoctorId_tenantId_fkey"
  FOREIGN KEY ("preferredDoctorId", "tenantId") REFERENCES "DoctorProfile"("id", "tenantId")
  ON DELETE SET NULL ("preferredDoctorId") ON UPDATE CASCADE;

ALTER TABLE "Notification"
  ADD CONSTRAINT "Notification_recipientUserId_tenantId_fkey"
  FOREIGN KEY ("recipientUserId", "tenantId") REFERENCES "User"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Notification"
  ADD CONSTRAINT "Notification_appointmentId_tenantId_fkey"
  FOREIGN KEY ("appointmentId", "tenantId") REFERENCES "Appointment"("id", "tenantId")
  ON DELETE SET NULL ("appointmentId") ON UPDATE CASCADE;

ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_actorUserId_tenantId_fkey"
  FOREIGN KEY ("actorUserId", "tenantId") REFERENCES "User"("id", "tenantId")
  ON DELETE SET NULL ("actorUserId") ON UPDATE CASCADE;
