-- Align HospitalProfile with the Prisma schema used for tenant host resolution and branding.
ALTER TABLE "HospitalProfile" ADD COLUMN IF NOT EXISTS "hfrId" TEXT;
ALTER TABLE "HospitalProfile" ADD COLUMN IF NOT EXISTS "customDomain" TEXT;
ALTER TABLE "HospitalProfile" ADD COLUMN IF NOT EXISTS "subdomain" TEXT;
ALTER TABLE "HospitalProfile" ADD COLUMN IF NOT EXISTS "primaryColor" TEXT DEFAULT '#0ea5e9';
ALTER TABLE "HospitalProfile" ADD COLUMN IF NOT EXISTS "secondaryColor" TEXT DEFAULT '#f43f5e';
ALTER TABLE "HospitalProfile" ADD COLUMN IF NOT EXISTS "fontFamily" TEXT DEFAULT 'Inter, sans-serif';
ALTER TABLE "HospitalProfile" ADD COLUMN IF NOT EXISTS "facebookUrl" TEXT;
ALTER TABLE "HospitalProfile" ADD COLUMN IF NOT EXISTS "twitterUrl" TEXT;
ALTER TABLE "HospitalProfile" ADD COLUMN IF NOT EXISTS "instagramUrl" TEXT;
ALTER TABLE "HospitalProfile" ADD COLUMN IF NOT EXISTS "linkedinUrl" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "HospitalProfile_hfrId_key" ON "HospitalProfile"("hfrId");
CREATE UNIQUE INDEX IF NOT EXISTS "HospitalProfile_customDomain_key" ON "HospitalProfile"("customDomain");
CREATE UNIQUE INDEX IF NOT EXISTS "HospitalProfile_subdomain_key" ON "HospitalProfile"("subdomain");
