import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/public/Breadcrumbs';
import PageHero from '@/components/public/PageHero';
import EmptyState from '@/components/ui/EmptyState';
import Card from '@/components/ui/Card';
import { getPublishedFaqs } from '@/features/cms/queries/catalog';
import { APP_CONFIG } from '@/config';

export const metadata: Metadata = {
  title: `FAQ · Patient Resources · ${APP_CONFIG.appName}`,
  description: `Frequently asked questions about outpatient visits and booking at ${APP_CONFIG.appName}.`,
};

export default async function FaqPage() {
  const faqs = await getPublishedFaqs();
  const grouped = faqs.reduce<Record<string, typeof faqs>>((acc, faq) => {
    const key = faq.category ?? 'General';
    if (!acc[key]) acc[key] = [];
    acc[key].push(faq);
    return acc;
  }, {});

  return (
    <>
      <PageHero
        eyebrow="Patient resources"
        title="Frequently asked questions"
        subtitle="Quick answers about booking, visits, and outpatient services."
      />
      <section className="section-pad">
        <div className="container-page max-w-3xl">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Patient Resources', href: '/patient-resources' },
              { label: 'FAQ' },
            ]}
            className="mb-8"
          />

          {faqs.length === 0 ? (
            <EmptyState
              title="No FAQs published yet"
              description="Common questions and answers will appear here once added to the CMS."
              actionHref="/contact"
              actionLabel="Contact us"
            />
          ) : (
            <div className="space-y-8">
              {Object.entries(grouped).map(([category, items]) => (
                <div key={category}>
                  <h2 className="font-display text-lg font-semibold text-ink">{category}</h2>
                  <div className="mt-4 space-y-3">
                    {items.map((faq) => (
                      <Card key={faq.id} padding="sm">
                        <h3 className="font-medium text-ink">{faq.question}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-ink-muted">{faq.answer}</p>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-10">
            <Link href="/patient-resources" className="btn-secondary">
              ← Back to resources
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
