import SectionHeader from '@/components/ui/SectionHeader';
import Card from '@/components/ui/Card';

const TRUST_ITEMS = [
  {
    title: 'Secure access',
    detail: 'Role-based portals protect patient, doctor, and admin workflows.',
  },
  {
    title: 'Transparent statuses',
    detail: 'Appointments move through clear states: booked, confirmed, completed, and more.',
  },
  {
    title: 'Reliable scheduling',
    detail: 'Slot availability respects doctor schedules and hospital timezone rules.',
  },
];

export default function TrustSection() {
  return (
    <section className="section-pad-sm bg-white">
      <div className="container-page">
        <SectionHeader
          eyebrow="Trust & standards"
          title="Built for responsible hospital operations"
          description="CarePulse focuses on operational clarity and secure access. Formal accreditation claims are not displayed unless verified by the hospital."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {TRUST_ITEMS.map((item) => (
            <Card key={item.title} className="border-brand-100 bg-brand-50/40">
              <h3 className="font-semibold text-ink">{item.title}</h3>
              <p className="mt-2 text-sm text-ink-muted">{item.detail}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
