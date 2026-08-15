ALTER TABLE "PatientProfile" ADD COLUMN IF NOT EXISTS "abhaNumber" TEXT;
ALTER TABLE "PatientProfile" ADD COLUMN IF NOT EXISTS "abhaAddress" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "PatientProfile_abhaNumber_key" ON "PatientProfile"("abhaNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "PatientProfile_abhaAddress_key" ON "PatientProfile"("abhaAddress");
