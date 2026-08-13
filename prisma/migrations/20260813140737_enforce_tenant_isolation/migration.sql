/*
  Warnings:

  - Added the required column `tenantId` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `AppointmentEnquiry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `BlockedDate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `CentreOfExcellence` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `ContactMessage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `Department` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `DoctorProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `Facility` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `FaqItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `HealthArticle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `HealthPackage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `HomepageSection` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `HospitalLocation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `HospitalService` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `InsurancePartner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `InternationalPageContent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `InternationalPatientEnquiry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `LeadershipMember` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `MediaAsset` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `NewsArticle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `PackageInformationRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `PatientProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `PatientResource` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `Speciality` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `SuccessStory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `Testimonial` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `WeeklyAvailability` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "tenantId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "AppointmentEnquiry" ADD COLUMN     "tenantId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "BlockedDate" ADD COLUMN     "tenantId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "CentreOfExcellence" ADD COLUMN     "tenantId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "ContactMessage" ADD COLUMN     "tenantId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "tenantId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "DoctorProfile" ADD COLUMN     "tenantId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "Facility" ADD COLUMN     "tenantId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "FaqItem" ADD COLUMN     "tenantId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "HealthArticle" ADD COLUMN     "tenantId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "HealthPackage" ADD COLUMN     "tenantId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "HomepageSection" ADD COLUMN     "tenantId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "HospitalLocation" ADD COLUMN     "tenantId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "HospitalService" ADD COLUMN     "tenantId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "InsurancePartner" ADD COLUMN     "tenantId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "InternationalPageContent" ADD COLUMN     "tenantId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "InternationalPatientEnquiry" ADD COLUMN     "tenantId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "LeadershipMember" ADD COLUMN     "tenantId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "MediaAsset" ADD COLUMN     "tenantId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "NewsArticle" ADD COLUMN     "tenantId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "PackageInformationRequest" ADD COLUMN     "tenantId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "PatientProfile" ADD COLUMN     "tenantId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "PatientResource" ADD COLUMN     "tenantId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "Speciality" ADD COLUMN     "tenantId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "SuccessStory" ADD COLUMN     "tenantId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "Testimonial" ADD COLUMN     "tenantId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "tenantId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "WeeklyAvailability" ADD COLUMN     "tenantId" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "HospitalProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientProfile" ADD CONSTRAINT "PatientProfile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "HospitalProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "HospitalProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorProfile" ADD CONSTRAINT "DoctorProfile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "HospitalProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyAvailability" ADD CONSTRAINT "WeeklyAvailability_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "HospitalProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedDate" ADD CONSTRAINT "BlockedDate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "HospitalProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "HospitalProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HospitalLocation" ADD CONSTRAINT "HospitalLocation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "HospitalProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadershipMember" ADD CONSTRAINT "LeadershipMember_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "HospitalProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Facility" ADD CONSTRAINT "Facility_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "HospitalProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Speciality" ADD CONSTRAINT "Speciality_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "HospitalProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CentreOfExcellence" ADD CONSTRAINT "CentreOfExcellence_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "HospitalProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HospitalService" ADD CONSTRAINT "HospitalService_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "HospitalProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthPackage" ADD CONSTRAINT "HealthPackage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "HospitalProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthArticle" ADD CONSTRAINT "HealthArticle_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "HospitalProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsArticle" ADD CONSTRAINT "NewsArticle_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "HospitalProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuccessStory" ADD CONSTRAINT "SuccessStory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "HospitalProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "HospitalProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FaqItem" ADD CONSTRAINT "FaqItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "HospitalProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientResource" ADD CONSTRAINT "PatientResource_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "HospitalProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsurancePartner" ADD CONSTRAINT "InsurancePartner_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "HospitalProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternationalPageContent" ADD CONSTRAINT "InternationalPageContent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "HospitalProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomepageSection" ADD CONSTRAINT "HomepageSection_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "HospitalProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "HospitalProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentEnquiry" ADD CONSTRAINT "AppointmentEnquiry_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "HospitalProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactMessage" ADD CONSTRAINT "ContactMessage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "HospitalProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternationalPatientEnquiry" ADD CONSTRAINT "InternationalPatientEnquiry_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "HospitalProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageInformationRequest" ADD CONSTRAINT "PackageInformationRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "HospitalProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
