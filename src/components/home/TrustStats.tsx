import SectionHeader from '@/components/ui/SectionHeader';
import Card from '@/components/ui/Card';

const STATS = [
  {
    title: 'Experienced Doctors',
    detail: 'Board-qualified specialists across active hospital departments.',
  },
  {
    title: '30-Minute Consults',
    detail: 'Predictable outpatient slots with clear start and end times.',
  },
  {
    title: 'Multiple Specialities',
    detail: 'Cardiology, orthopedics, pediatrics, neurology, and more.',
  },
  {
    title: 'Patient-Centered Care',
    detail: 'Book, confirm, and manage appointments from one secure portal.',
  },
];

export default function TrustStats() {
  return (
    <section className="section-pad-sm bg-white border-b border-[#dde5e9]/80">
      <div className="container-page">
        <SectionHeader
          eyebrow="Why CarePulse"
          title="Healthcare designed around your time"
          description="A calm, trustworthy digital experience for discovering specialists and scheduling outpatient consultations."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((item) => (
            <Card key={item.title} hover className="h-full">
              <div className="mb-4 h-1 w-10 rounded-full bg-brand-500" aria-hidden />
              <h3 className="text-base font-semibold text-ink">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{item.detail}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
