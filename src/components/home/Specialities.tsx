import Link from 'next/link';
import SectionHeader from '@/components/ui/SectionHeader';
import Card from '@/components/ui/Card';

interface Speciality {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
}

interface Dept {
  id: string;
  name: string;
  slug?: string;
  description: string | null;
}

export default function Specialities({
  specialities,
  departments,
}: {
  specialities?: Speciality[];
  departments: Dept[];
}) {
  const items =
    specialities && specialities.length > 0
      ? specialities.map((s) => ({
          id: s.id,
          name: s.name,
          href: `/specialities/${s.slug}`,
          description: s.shortDescription,
        }))
      : departments.map((d) => ({
          id: d.id,
          name: d.name,
          href: d.slug ? `/departments/${d.slug}` : '/departments',
          description: d.description,
        }));

  return (
    <section id="specialities" className="section-pad-sm scroll-mt-28 border-y border-[#dde5e9]/80 bg-white">
      <div className="container-page">
        <SectionHeader
          eyebrow="Specialities"
          title="Departments ready for outpatient care"
          description="Every listed speciality is active in our hospital system and available for patient discovery."
          action={
            <Link href="/specialities" className="btn-secondary">
              View all specialities
            </Link>
          }
        />
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id} padding="sm" hover className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-ink">{item.name}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-ink-muted">
                  {item.description || 'Specialist outpatient consultations'}
                </p>
              </div>
              <Link href={item.href} className="shrink-0 text-sm font-semibold text-brand-700">
                View
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
