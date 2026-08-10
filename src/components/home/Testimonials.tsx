import SectionHeader from '@/components/ui/SectionHeader';
import Card from '@/components/ui/Card';

const FALLBACK_TESTIMONIALS = [
  {
    quote:
      'Booking was straightforward—I found a cardiologist, picked a morning slot, and received clear confirmation in the portal.',
    name: 'Ananya R.',
    context: 'Outpatient consultation · Demo content',
  },
  {
    quote:
      'The schedule felt calm and predictable. I could see my upcoming visit details without calling the front desk.',
    name: 'Vikram S.',
    context: 'Follow-up appointment · Demo content',
  },
  {
    quote:
      'Searching by department helped me choose the right specialist quickly. The patient portal kept everything organized.',
    name: 'Meera K.',
    context: 'First-time visit · Demo content',
  },
];

interface CmsTestimonial {
  displayName: string;
  text: string;
  rating: number | null;
  isDemoContent: boolean;
  speciality?: { name: string } | null;
}

export default function Testimonials({ testimonials }: { testimonials?: CmsTestimonial[] }) {
  const items =
    testimonials && testimonials.length > 0
      ? testimonials.slice(0, 6).map((t) => ({
          quote: t.text,
          name: t.displayName,
          context: [
            t.speciality?.name,
            t.isDemoContent ? 'Demo content' : 'Patient feedback',
          ]
            .filter(Boolean)
            .join(' · '),
        }))
      : FALLBACK_TESTIMONIALS;

  return (
    <section className="section-pad bg-surface-soft">
      <div className="container-page">
        <SectionHeader
          eyebrow="Patient voices"
          title="Experiences from our outpatient community"
          description="Reflections illustrating the booking experience. Demo-labelled entries are illustrative placeholders—not medical endorsements."
          align="center"
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.name + item.quote.slice(0, 20)} className="flex h-full flex-col bg-white">
              <p className="flex-1 text-base leading-relaxed text-ink">&ldquo;{item.quote}&rdquo;</p>
              <div className="mt-6 border-t border-[#dde5e9] pt-4">
                <p className="font-semibold text-ink">{item.name}</p>
                <p className="text-xs text-ink-muted">{item.context}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
