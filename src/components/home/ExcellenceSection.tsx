import Link from 'next/link';
import SectionHeader from '@/components/ui/SectionHeader';
import Card from '@/components/ui/Card';

interface Centre {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
}

interface Dept {
  id: string;
  name: string;
  description: string | null;
}

export default function ExcellenceSection({
  centres,
  departments,
}: {
  centres?: Centre[];
  departments: Dept[];
}) {
  const featuredCentres = centres?.slice(0, 5) ?? [];
  const featuredDepts = departments.slice(0, 5);
  const useCentres = featuredCentres.length > 0;

  return (
    <section id="excellence" className="section-pad scroll-mt-28 bg-surface-soft">
      <div className="container-page">
        <SectionHeader
          eyebrow="Centres of excellence"
          title="Specialist care, thoughtfully organized"
          description="Browse active centres and departments, then connect with the clinicians who practice there."
          action={
            <Link href="/centres-of-excellence" className="btn-secondary">
              View all centres
            </Link>
          }
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {useCentres
            ? featuredCentres.map((centre, index) => (
                <Card key={centre.id} hover className="flex h-full flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-xs font-semibold text-brand-600">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="rounded-pill bg-brand-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                      Centre
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-ink">{centre.name}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
                    {centre.shortDescription ||
                      `Coordinated specialist care through ${centre.name}.`}
                  </p>
                  <Link
                    href={`/centres-of-excellence/${centre.slug}`}
                    className="mt-5 text-sm font-semibold text-brand-700 hover:text-brand-900"
                  >
                    Learn more →
                  </Link>
                </Card>
              ))
            : featuredDepts.map((dept, index) => (
                <Card key={dept.id} hover className="flex h-full flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-xs font-semibold text-brand-600">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="rounded-pill bg-brand-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                      Department
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-ink">{dept.name}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
                    {dept.description ||
                      `Outpatient consultations and specialist care in ${dept.name}.`}
                  </p>
                  <Link
                    href="/departments"
                    className="mt-5 text-sm font-semibold text-brand-700 hover:text-brand-900"
                  >
                    Find doctors →
                  </Link>
                </Card>
              ))}
        </div>
      </div>
    </section>
  );
}
