-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EnquiryStatus" AS ENUM ('NEW', 'CONTACTED', 'RESOLVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ContactMessageStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'RESOLVED');

-- CreateEnum
CREATE TYPE "HomepageSectionType" AS ENUM ('HERO', 'ABOUT', 'FEATURED_DEPARTMENTS', 'CENTRES_OF_EXCELLENCE', 'FEATURED_DOCTORS', 'SPECIALITIES', 'SERVICES', 'HEALTH_PACKAGES', 'TESTIMONIALS', 'SUCCESS_STORIES', 'NEWS', 'HEALTH_LIBRARY', 'TRUST', 'CONTACT_CTA');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'DOCUMENT', 'VIDEO', 'OTHER');

-- AlterTable Department (slug nullable first, then backfill)
ALTER TABLE "Department" ADD COLUMN "slug" TEXT,
ADD COLUMN "shortDescription" TEXT,
ADD COLUMN "fullDescription" TEXT,
ADD COLUMN "imageUrl" TEXT,
ADD COLUMN "icon" TEXT,
ADD COLUMN "displayOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "seoTitle" TEXT,
ADD COLUMN "seoDescription" TEXT,
ADD COLUMN "contentStatus" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED';

UPDATE "Department"
SET "slug" = lower(regexp_replace(regexp_replace("name", '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g')),
    "shortDescription" = COALESCE("shortDescription", "description");

ALTER TABLE "Department" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "Department_slug_key" ON "Department"("slug");
CREATE INDEX "Department_isActive_contentStatus_displayOrder_idx" ON "Department"("isActive", "contentStatus", "displayOrder");

-- AlterTable DoctorProfile
ALTER TABLE "DoctorProfile" ADD COLUMN "slug" TEXT,
ADD COLUMN "profileImageUrl" TEXT,
ADD COLUMN "publicDisplayName" TEXT,
ADD COLUMN "designation" TEXT,
ADD COLUMN "languages" TEXT,
ADD COLUMN "publicBio" TEXT,
ADD COLUMN "education" TEXT,
ADD COLUMN "certifications" TEXT,
ADD COLUMN "memberships" TEXT,
ADD COLUMN "areasOfInterest" TEXT,
ADD COLUMN "displayOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "seoTitle" TEXT,
ADD COLUMN "seoDescription" TEXT,
ADD COLUMN "contentStatus" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED';

UPDATE "DoctorProfile"
SET "slug" = lower(regexp_replace(regexp_replace("fullName", '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g')),
    "publicDisplayName" = COALESCE("publicDisplayName", "fullName"),
    "publicBio" = COALESCE("publicBio", "bio");

-- Ensure unique doctor slugs if collisions
UPDATE "DoctorProfile" d
SET "slug" = d."slug" || '-' || substring(replace(d."id"::text, '-', ''), 1, 8)
WHERE EXISTS (
  SELECT 1 FROM "DoctorProfile" d2
  WHERE d2."slug" = d."slug" AND d2."id" <> d."id"
);

ALTER TABLE "DoctorProfile" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "DoctorProfile_slug_key" ON "DoctorProfile"("slug");
CREATE INDEX "DoctorProfile_contentStatus_isFeatured_displayOrder_idx" ON "DoctorProfile"("contentStatus", "isFeatured", "displayOrder");

-- CreateTable HospitalProfile
CREATE TABLE "HospitalProfile" (
    "id" UUID NOT NULL,
    "hospitalName" TEXT NOT NULL,
    "legalName" TEXT,
    "shortDescription" TEXT,
    "fullDescription" TEXT,
    "tagline" TEXT,
    "phone" TEXT,
    "emergencyPhone" TEXT,
    "email" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT DEFAULT 'India',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "timezone" TEXT DEFAULT 'Asia/Kolkata',
    "websiteUrl" TEXT,
    "logoUrl" TEXT,
    "heroImageUrl" TEXT,
    "mission" TEXT,
    "vision" TEXT,
    "values" TEXT,
    "workingHours" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HospitalProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HospitalLocation" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postalCode" TEXT,
    "phone" TEXT,
    "emergencyPhone" TEXT,
    "email" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "mapUrl" TEXT,
    "directionsUrl" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "contentStatus" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HospitalLocation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HospitalLocation_slug_key" ON "HospitalLocation"("slug");
CREATE INDEX "HospitalLocation_isActive_contentStatus_idx" ON "HospitalLocation"("isActive", "contentStatus");

CREATE TABLE "LeadershipMember" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "shortBio" TEXT,
    "fullBio" TEXT,
    "imageUrl" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "contentStatus" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadershipMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LeadershipMember_slug_key" ON "LeadershipMember"("slug");
CREATE INDEX "LeadershipMember_isActive_contentStatus_displayOrder_idx" ON "LeadershipMember"("isActive", "contentStatus", "displayOrder");

CREATE TABLE "Facility" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "category" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "contentStatus" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Facility_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Facility_slug_key" ON "Facility"("slug");
CREATE INDEX "Facility_isActive_contentStatus_displayOrder_idx" ON "Facility"("isActive", "contentStatus", "displayOrder");

CREATE TABLE "Speciality" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortDescription" TEXT,
    "fullDescription" TEXT,
    "imageUrl" TEXT,
    "icon" TEXT,
    "departmentId" UUID,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "contentStatus" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Speciality_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Speciality_name_key" ON "Speciality"("name");
CREATE UNIQUE INDEX "Speciality_slug_key" ON "Speciality"("slug");
CREATE INDEX "Speciality_isActive_contentStatus_displayOrder_idx" ON "Speciality"("isActive", "contentStatus", "displayOrder");
CREATE INDEX "Speciality_departmentId_idx" ON "Speciality"("departmentId");

CREATE TABLE "CentreOfExcellence" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortDescription" TEXT,
    "fullDescription" TEXT,
    "clinicalFocus" TEXT,
    "heroImageUrl" TEXT,
    "icon" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "contentStatus" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CentreOfExcellence_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CentreOfExcellence_name_key" ON "CentreOfExcellence"("name");
CREATE UNIQUE INDEX "CentreOfExcellence_slug_key" ON "CentreOfExcellence"("slug");
CREATE INDEX "CentreOfExcellence_isActive_contentStatus_displayOrder_idx" ON "CentreOfExcellence"("isActive", "contentStatus", "displayOrder");

CREATE TABLE "DoctorSpeciality" (
    "doctorId" UUID NOT NULL,
    "specialityId" UUID NOT NULL,

    CONSTRAINT "DoctorSpeciality_pkey" PRIMARY KEY ("doctorId","specialityId")
);

CREATE TABLE "DoctorCentre" (
    "doctorId" UUID NOT NULL,
    "centreId" UUID NOT NULL,

    CONSTRAINT "DoctorCentre_pkey" PRIMARY KEY ("doctorId","centreId")
);

CREATE TABLE "CentreSpeciality" (
    "centreId" UUID NOT NULL,
    "specialityId" UUID NOT NULL,

    CONSTRAINT "CentreSpeciality_pkey" PRIMARY KEY ("centreId","specialityId")
);

CREATE TABLE "HospitalService" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortDescription" TEXT,
    "fullDescription" TEXT,
    "imageUrl" TEXT,
    "icon" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "contentStatus" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HospitalService_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HospitalService_name_key" ON "HospitalService"("name");
CREATE UNIQUE INDEX "HospitalService_slug_key" ON "HospitalService"("slug");
CREATE INDEX "HospitalService_isActive_contentStatus_displayOrder_idx" ON "HospitalService"("isActive", "contentStatus", "displayOrder");

CREATE TABLE "CentreService" (
    "centreId" UUID NOT NULL,
    "serviceId" UUID NOT NULL,

    CONSTRAINT "CentreService_pkey" PRIMARY KEY ("centreId","serviceId")
);

CREATE TABLE "HealthPackage" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "detailedDescription" TEXT,
    "imageUrl" TEXT,
    "price" DECIMAL(10,2),
    "currency" TEXT DEFAULT 'INR',
    "duration" TEXT,
    "eligibility" TEXT,
    "includedItems" TEXT,
    "preparationInstructions" TEXT,
    "isDemoPricing" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "contentStatus" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthPackage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HealthPackage_slug_key" ON "HealthPackage"("slug");
CREATE INDEX "HealthPackage_isActive_contentStatus_displayOrder_idx" ON "HealthPackage"("isActive", "contentStatus", "displayOrder");

CREATE TABLE "HealthArticle" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "author" TEXT,
    "specialityId" UUID,
    "tags" TEXT,
    "publishedAt" TIMESTAMP(3),
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "contentStatus" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthArticle_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HealthArticle_slug_key" ON "HealthArticle"("slug");
CREATE INDEX "HealthArticle_contentStatus_publishedAt_idx" ON "HealthArticle"("contentStatus", "publishedAt");
CREATE INDEX "HealthArticle_specialityId_idx" ON "HealthArticle"("specialityId");

CREATE TABLE "NewsArticle" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "category" TEXT,
    "author" TEXT,
    "publishedAt" TIMESTAMP(3),
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "contentStatus" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsArticle_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NewsArticle_slug_key" ON "NewsArticle"("slug");
CREATE INDEX "NewsArticle_contentStatus_publishedAt_idx" ON "NewsArticle"("contentStatus", "publishedAt");

CREATE TABLE "SuccessStory" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT NOT NULL,
    "patientDisplayName" TEXT NOT NULL,
    "ageGroup" TEXT,
    "specialityId" UUID,
    "doctorId" UUID,
    "imageUrl" TEXT,
    "videoUrl" TEXT,
    "isAnonymizedDemo" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3),
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "contentStatus" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuccessStory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SuccessStory_slug_key" ON "SuccessStory"("slug");
CREATE INDEX "SuccessStory_contentStatus_publishedAt_idx" ON "SuccessStory"("contentStatus", "publishedAt");

CREATE TABLE "Testimonial" (
    "id" UUID NOT NULL,
    "displayName" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "specialityId" UUID,
    "imageUrl" TEXT,
    "publishedAt" TIMESTAMP(3),
    "isDemoContent" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "contentStatus" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Testimonial_contentStatus_displayOrder_idx" ON "Testimonial"("contentStatus", "displayOrder");

CREATE TABLE "FaqItem" (
    "id" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "contentStatus" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FaqItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FaqItem_contentStatus_displayOrder_idx" ON "FaqItem"("contentStatus", "displayOrder");

CREATE TABLE "PatientResource" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT,
    "category" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "contentStatus" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientResource_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PatientResource_slug_key" ON "PatientResource"("slug");
CREATE INDEX "PatientResource_isActive_contentStatus_displayOrder_idx" ON "PatientResource"("isActive", "contentStatus", "displayOrder");

CREATE TABLE "InsurancePartner" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "contentStatus" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsurancePartner_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InsurancePartner_slug_key" ON "InsurancePartner"("slug");
CREATE INDEX "InsurancePartner_isActive_contentStatus_displayOrder_idx" ON "InsurancePartner"("isActive", "contentStatus", "displayOrder");

CREATE TABLE "InternationalPageContent" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "introduction" TEXT,
    "howToRequest" TEXT,
    "secondOpinion" TEXT,
    "requiredDocuments" TEXT,
    "travelInformation" TEXT,
    "accommodationInfo" TEXT,
    "coordinatorContact" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternationalPageContent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HomepageSection" (
    "id" UUID NOT NULL,
    "sectionType" "HomepageSectionType" NOT NULL,
    "title" TEXT,
    "subtitle" TEXT,
    "content" TEXT,
    "imageUrl" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomepageSection_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HomepageSection_isEnabled_displayOrder_idx" ON "HomepageSection"("isEnabled", "displayOrder");

CREATE TABLE "MediaAsset" (
    "id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "caption" TEXT,
    "type" "MediaType" NOT NULL DEFAULT 'IMAGE',
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AppointmentEnquiry" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "departmentId" UUID,
    "preferredDoctorId" UUID,
    "preferredDate" DATE,
    "message" TEXT,
    "status" "EnquiryStatus" NOT NULL DEFAULT 'NEW',
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppointmentEnquiry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AppointmentEnquiry_status_createdAt_idx" ON "AppointmentEnquiry"("status", "createdAt");

CREATE TABLE "ContactMessage" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "ContactMessageStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContactMessage_status_createdAt_idx" ON "ContactMessage"("status", "createdAt");

CREATE TABLE "InternationalPatientEnquiry" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "country" TEXT NOT NULL,
    "treatmentInterest" TEXT,
    "preferredDepartment" TEXT,
    "message" TEXT,
    "status" "EnquiryStatus" NOT NULL DEFAULT 'NEW',
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InternationalPatientEnquiry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InternationalPatientEnquiry_status_createdAt_idx" ON "InternationalPatientEnquiry"("status", "createdAt");

CREATE TABLE "PackageInformationRequest" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "packageSlug" TEXT,
    "packageName" TEXT,
    "message" TEXT,
    "status" "EnquiryStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackageInformationRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PackageInformationRequest_status_createdAt_idx" ON "PackageInformationRequest"("status", "createdAt");

-- Foreign keys
ALTER TABLE "Speciality" ADD CONSTRAINT "Speciality_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DoctorSpeciality" ADD CONSTRAINT "DoctorSpeciality_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "DoctorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DoctorSpeciality" ADD CONSTRAINT "DoctorSpeciality_specialityId_fkey" FOREIGN KEY ("specialityId") REFERENCES "Speciality"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DoctorCentre" ADD CONSTRAINT "DoctorCentre_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "DoctorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DoctorCentre" ADD CONSTRAINT "DoctorCentre_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "CentreOfExcellence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CentreSpeciality" ADD CONSTRAINT "CentreSpeciality_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "CentreOfExcellence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CentreSpeciality" ADD CONSTRAINT "CentreSpeciality_specialityId_fkey" FOREIGN KEY ("specialityId") REFERENCES "Speciality"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CentreService" ADD CONSTRAINT "CentreService_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "CentreOfExcellence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CentreService" ADD CONSTRAINT "CentreService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "HospitalService"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HealthArticle" ADD CONSTRAINT "HealthArticle_specialityId_fkey" FOREIGN KEY ("specialityId") REFERENCES "Speciality"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SuccessStory" ADD CONSTRAINT "SuccessStory_specialityId_fkey" FOREIGN KEY ("specialityId") REFERENCES "Speciality"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SuccessStory" ADD CONSTRAINT "SuccessStory_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "DoctorProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_specialityId_fkey" FOREIGN KEY ("specialityId") REFERENCES "Speciality"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AppointmentEnquiry" ADD CONSTRAINT "AppointmentEnquiry_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AppointmentEnquiry" ADD CONSTRAINT "AppointmentEnquiry_preferredDoctorId_fkey" FOREIGN KEY ("preferredDoctorId") REFERENCES "DoctorProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
