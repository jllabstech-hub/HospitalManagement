import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/public/Breadcrumbs';
import PageHero from '@/components/public/PageHero';
import DoctorCard from '@/components/doctors/DoctorCard';
import GlobalSearchInput from '@/components/shared/GlobalSearchInput';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { globalPublicSearch } from '@/features/cms/queries/search';
import { APP_CONFIG } from '@/config';

export const metadata: Metadata = {
  title: `Search · ${APP_CONFIG.appName}`,
  description: `Search doctors, departments, services, and health content at ${APP_CONFIG.appName}.`,
};

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = params.q?.trim() ?? '';
  const results = q ? await globalPublicSearch(q) : null;

  const totalResults = results
    ? results.doctors.length +
      results.departments.length +
      results.specialities.length +
      results.services.length +
      results.articles.length +
      results.news.length
    : 0;

  return (
    <>
      <PageHero
        eyebrow="Site search"
        title="Search CarePulse"
        subtitle="Find doctors, departments, specialities, services, articles, and news."
      />
      <section className="section-pad">
        <div className="container-page">
          <Breadcrumbs
            items={[{ label: 'Home', href: '/' }, { label: 'Search' }]}
            className="mb-8"
          />

          <GlobalSearchInput />

          {!q && (
            <EmptyState
              title="Enter a search term"
              description="Try a doctor name, department, speciality, or health topic."
            />
          )}

          {q && results && totalResults === 0 && (
            <EmptyState
              title={`No results for "${q}"`}
              description="Try different keywords or browse our doctor directory."
              actionHref="/doctors"
              actionLabel="Browse doctors"
            />
          )}

          {q && results && totalResults > 0 && (
            <div className="space-y-10">
              {results.doctors.length > 0 && (
                <section>
                  <h2 className="font-display text-xl font-semibold text-ink">Doctors</h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {results.doctors.map((doc) => (
                      <DoctorCard
                        key={doc.id}
                        doctor={{
                          id: doc.id,
                          fullName: doc.publicDisplayName ?? doc.fullName,
                          qualification: doc.qualification,
                          experienceYears: doc.experienceYears,
                          department: doc.department,
                        }}
                        href={`/doctors/${doc.slug ?? doc.id}`}
                        bookHref={`/book-appointment?doctorId=${doc.id}`}
                        publicMode
                      />
                    ))}
                  </div>
                </section>
              )}

              {results.departments.length > 0 && (
                <section>
                  <h2 className="font-display text-xl font-semibold text-ink">Departments</h2>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {results.departments.map((dept) => (
                      <Card key={dept.id} padding="sm" hover>
                        <Link href={`/departments/${dept.slug}`} className="font-semibold text-brand-700">
                          {dept.name}
                        </Link>
                        {dept.shortDescription && (
                          <p className="mt-1 text-sm text-ink-muted">{dept.shortDescription}</p>
                        )}
                      </Card>
                    ))}
                  </div>
                </section>
              )}

              {results.specialities.length > 0 && (
                <section>
                  <h2 className="font-display text-xl font-semibold text-ink">Specialities</h2>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {results.specialities.map((spec) => (
                      <Card key={spec.id} padding="sm" hover>
                        <Link
                          href={`/specialities/${spec.slug}`}
                          className="font-semibold text-brand-700"
                        >
                          {spec.name}
                        </Link>
                      </Card>
                    ))}
                  </div>
                </section>
              )}

              {results.services.length > 0 && (
                <section>
                  <h2 className="font-display text-xl font-semibold text-ink">Services</h2>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {results.services.map((svc) => (
                      <Card key={svc.id} padding="sm" hover>
                        <Link href={`/services/${svc.slug}`} className="font-semibold text-brand-700">
                          {svc.name}
                        </Link>
                      </Card>
                    ))}
                  </div>
                </section>
              )}

              {results.articles.length > 0 && (
                <section>
                  <h2 className="font-display text-xl font-semibold text-ink">Health library</h2>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {results.articles.map((article) => (
                      <Card key={article.id} padding="sm" hover>
                        <Link
                          href={`/health-library/${article.slug}`}
                          className="font-semibold text-brand-700"
                        >
                          {article.title}
                        </Link>
                      </Card>
                    ))}
                  </div>
                </section>
              )}

              {results.news.length > 0 && (
                <section>
                  <h2 className="font-display text-xl font-semibold text-ink">News</h2>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {results.news.map((item) => (
                      <Card key={item.id} padding="sm" hover>
                        <Link href={`/news/${item.slug}`} className="font-semibold text-brand-700">
                          {item.title}
                        </Link>
                      </Card>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
