import SectionHeader from '@/components/ui/SectionHeader';
import Card from '@/components/ui/Card';
import Link from 'next/link';
import CmsRecordImage from '@/components/cms/CmsRecordImage';

interface ServicesProps {
  services?: Array<{
    id: string;
    name: string;
    slug: string;
    shortDescription?: string | null;
    imageUrl?: string | null;
  }>;
}

export default function Services({ services }: ServicesProps) {
  const displayServices = (services && services.length > 0)
    ? services.map((s) => ({
        title: s.name,
        detail: s.shortDescription || 'Outpatient medical and diagnostic service.',
        slug: s.slug,
        imageUrl: s.imageUrl,
      }))
    : [
        { title: 'Outpatient Consultations', detail: 'Book fixed 30-minute slots with active hospital specialists.', slug: '', imageUrl: undefined as string | undefined },
        { title: 'Doctor Discovery', detail: 'Search by name, qualification, or medical department.', slug: '', imageUrl: undefined },
        { title: 'Appointment Management', detail: 'Track upcoming visits, history, and cancellations in one place.', slug: '', imageUrl: undefined },
        { title: 'Secure Patient Portal', detail: 'Role-based access for patients, doctors, and administrators.', slug: '', imageUrl: undefined },
      ];

  return (
    <section id="services" className="section-pad scroll-mt-28">
      <div className="container-page">
        <SectionHeader
          eyebrow="Patient services"
          title="Hospital services & outpatient care"
          description="Specialized medical services and diagnostic programmes available across our hospital network."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {displayServices.map((service) => (
            <Card key={service.title} padding="none" className="h-full bg-surface-warm flex flex-col justify-between overflow-hidden">
              <CmsRecordImage src={service.imageUrl} fallbackTitle={service.title} alt={`${service.title} hospital service`} />
              <div className="flex h-full flex-col p-6">
              <div>
                <h3 className="text-base font-semibold text-ink">{service.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{service.detail}</p>
              </div>
              {service.slug && (
                <div className="mt-4 pt-2 border-t border-[#dde5e9]">
                  <Link href={`/services/${service.slug}`} className="text-xs font-bold text-brand-700 hover:underline">
                    View Service Details →
                  </Link>
                </div>
              )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
