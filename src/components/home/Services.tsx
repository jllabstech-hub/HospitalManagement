import SectionHeader from '@/components/ui/SectionHeader';
import Card from '@/components/ui/Card';

const SERVICES = [
  {
    title: 'Outpatient Consultations',
    detail: 'Book fixed 30-minute slots with active hospital specialists.',
  },
  {
    title: 'Doctor Discovery',
    detail: 'Search by name, qualification, or medical department.',
  },
  {
    title: 'Appointment Management',
    detail: 'Track upcoming visits, history, and cancellations in one place.',
  },
  {
    title: 'Secure Patient Portal',
    detail: 'Role-based access for patients, doctors, and administrators.',
  },
];

export default function Services() {
  return (
    <section id="services" className="section-pad scroll-mt-28">
      <div className="container-page">
        <SectionHeader
          eyebrow="Patient services"
          title="Digital services available today"
          description="We only highlight capabilities this hospital platform actually supports—so you always know what to expect."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((service) => (
            <Card key={service.title} className="h-full bg-surface-warm">
              <h3 className="text-base font-semibold text-ink">{service.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{service.detail}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
