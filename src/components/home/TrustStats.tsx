import SectionHeader from '@/components/ui/SectionHeader';

const STATS = [
  {
    title: 'Experienced doctors',
    detail: 'Board-qualified specialists across active hospital departments.',
  },
  {
    title: '30-minute consults',
    detail: 'Predictable outpatient slots with clear start and end times.',
  },
  {
    title: 'Multiple specialities',
    detail: 'Cardiology, orthopaedics, paediatrics, neurology, and more.',
  },
  {
    title: 'Patient-centered care',
    detail: 'Book, confirm, and manage appointments from one secure portal.',
  },
];

export default function TrustStats() {
  return (
    <section className="border-b border-[#dde5e9]/80 bg-white py-16 sm:py-20">
      <div className="container-page">
        <SectionHeader
          eyebrow="Why CarePulse"
          title="Healthcare designed around your time"
          description="A calm, considered experience for discovering specialists and scheduling outpatient consultations."
        />
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((item, index) => (
            <article key={item.title} className="border-t border-brand-200 pt-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-600">
                {String(index + 1).padStart(2, '0')}
              </p>
              <h3 className="mt-3 text-lg font-semibold text-ink">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{item.detail}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
