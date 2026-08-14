import { requireAdmin } from '@/server/security/auth-helpers';
import { prisma } from '@/server/db/client';
import EnquiriesManager from '@/features/cms/components/EnquiriesManager';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

export default async function AdminEnquiriesPage() {
  await requireAdmin();

  const [contactMessages, appointmentEnquiries, internationalEnquiries, packageRequests] =
    await Promise.all([
      prisma.contactMessage.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.appointmentEnquiry.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          department: { select: { name: true } },
          preferredDoctor: { select: { fullName: true } },
        },
      }),
      prisma.internationalPatientEnquiry.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.packageInformationRequest.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Enquiries & Contact Supervision"
        description="Review contact messages, appointment requests, international patient enquiries, and package information requests."
        frontendPath="/contact"
      />

      <EnquiriesManager
        contactMessages={contactMessages}
        appointmentEnquiries={appointmentEnquiries.map((row) => ({
          id: row.id,
          name: row.name,
          email: row.email,
          phone: row.phone,
          status: row.status,
          createdAt: row.createdAt,
          detail: [
            row.department?.name,
            row.preferredDoctor?.fullName,
            row.message,
          ]
            .filter(Boolean)
            .join(' · '),
        }))}
        internationalEnquiries={internationalEnquiries.map((row) => ({
          id: row.id,
          name: row.name,
          email: row.email,
          phone: row.phone,
          status: row.status,
          createdAt: row.createdAt,
          detail: [row.country, row.treatmentInterest, row.preferredDepartment, row.message]
            .filter(Boolean)
            .join(' · '),
        }))}
        packageRequests={packageRequests.map((row) => ({
          id: row.id,
          name: row.name,
          email: row.email,
          phone: row.phone,
          status: row.status,
          createdAt: row.createdAt,
          packageName: row.packageName,
        }))}
      />
    </div>
  );
}
