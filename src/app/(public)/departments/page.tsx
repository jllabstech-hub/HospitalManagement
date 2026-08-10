import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/public/Breadcrumbs';
import PageHero from '@/components/public/PageHero';
import EmptyState from '@/components/ui/EmptyState';
import Card from '@/components/ui/Card';
import { getPublishedDepartments } from '@/features/cms/queries/catalog';
import { APP_CONFIG } from '@/config';

export const metadata: Metadata = {
  title: `Departments · ${APP_CONFIG.appName}`,
  description: `Browse active hospital departments at ${APP_CONFIG.appName}.`,
};

export default async function DepartmentsPage() {
  const departments = await getPublishedDepartments();

  return (
    <>
      <PageHero
        eyebrow="Clinical departments"
        title="Hospital departments"
        subtitle="Every listed department is active for outpatient discovery and specialist consultations."
      />
      <section className="section-pad">
        <div className="container-page">
          <Breadcrumbs
            items={[{ label: 'Home', href: '/' }, { label: 'Departments' }]}
            className="mb-8"
          />

          {departments.length === 0 ? (
            <EmptyState
              title="No departments published yet"
              description="Department listings will appear here once published in the hospital CMS."
              actionHref="/contact"
              actionLabel="Contact us"
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {departments.map((dept) => (
                <Card key={dept.id} hover className="flex h-full flex-col">
                  <h2 className="text-lg font-semibold text-ink">{dept.name}</h2>
                  <p className="mt-2 flex-1 text-sm text-ink-muted line-clamp-3">
                    {dept.shortDescription ?? dept.description ?? 'Specialist outpatient care.'}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3 text-sm">
                    <Link href={`/departments/${dept.slug}`} className="font-semibold text-brand-700">
                      View department →
                    </Link>
                    <Link
                      href={`/doctors?department=${dept.id}`}
                      className="text-ink-muted hover:text-brand-700"
                    >
                      Find doctors
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
