import { requireAdmin } from '@/server/security/auth-helpers';
import { prisma } from '@/server/db/client';
import EnquiriesManager from '@/features/cms/components/EnquiriesManager';

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
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Enquiries</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Review contact messages, appointment requests, international patient enquiries, and package information requests.
        </p>
      </div>

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
