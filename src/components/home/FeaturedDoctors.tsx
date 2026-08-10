import Link from 'next/link';
import SectionHeader from '@/components/ui/SectionHeader';
import DoctorCard from '@/components/doctors/DoctorCard';

interface Doctor {
  id: string;
  fullName: string;
  qualification: string;
  experienceYears: number;
  bio?: string | null;
  department: { name: string };
}

export default function FeaturedDoctors({ doctors }: { doctors: Doctor[] }) {
  return (
    <section id="doctors" className="section-pad scroll-mt-28">
      <div className="container-page">
        <SectionHeader
          eyebrow="Find a doctor"
          title="Meet our specialists"
          description="Search by name or speciality in the patient portal, then book a 30-minute consultation that fits your schedule."
          action={
            <Link href="/doctors" className="btn-primary">
              Open doctor directory
            </Link>
          }
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((doc) => (
            <DoctorCard
              key={doc.id}
              doctor={doc}
              href={`/doctors/${doc.id}`}
              bookHref={`/book-appointment?doctorId=${doc.id}`}
              publicMode
            />
          ))}
        </div>
      </div>
    </section>
  );
}
