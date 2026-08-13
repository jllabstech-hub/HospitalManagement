-- AlterTable
ALTER TABLE "Appointment" ALTER COLUMN "tenantId" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "AppointmentEnquiry" ALTER COLUMN "tenantId" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "BlockedDate" ALTER COLUMN "tenantId" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "CentreOfExcellence" ALTER COLUMN "tenantId" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "ContactMessage" ALTER COLUMN "tenantId" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "Department" ALTER COLUMN "tenantId" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "DoctorProfile" ALTER COLUMN "tenantId" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "Facility" ALTER COLUMN "tenantId" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "FaqItem" ALTER COLUMN "tenantId" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "HealthArticle" ALTER COLUMN "tenantId" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "HealthPackage" ALTER COLUMN "tenantId" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "HomepageSection" ALTER COLUMN "tenantId" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "HospitalLocation" ALTER COLUMN "tenantId" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "HospitalService" ALTER COLUMN "tenantId" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "InsurancePartner" ALTER COLUMN "tenantId" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "InternationalPageContent" ALTER COLUMN "tenantId" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "InternationalPatientEnquiry" ALTER COLUMN "tenantId" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "LeadershipMember" ALTER COLUMN "tenantId" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "MediaAsset" ALTER COLUMN "tenantId" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "NewsArticle" ALTER COLUMN "tenantId" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "PackageInformationRequest" ALTER COLUMN "tenantId" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "PatientProfile" ALTER COLUMN "tenantId" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "PatientResource" ALTER COLUMN "tenantId" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "Speciality" ALTER COLUMN "tenantId" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "SuccessStory" ALTER COLUMN "tenantId" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "Testimonial" ALTER COLUMN "tenantId" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "tenantId" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "WeeklyAvailability" ALTER COLUMN "tenantId" SET DEFAULT gen_random_uuid();
