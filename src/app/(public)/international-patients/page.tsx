import type { Metadata } from 'next';
import Breadcrumbs from '@/components/public/Breadcrumbs';
import PageHero from '@/components/public/PageHero';
import InternationalEnquiryForm from '@/features/cms/components/InternationalEnquiryForm';
import { getInternationalPageContent } from '@/features/cms/queries/catalog';
import { APP_CONFIG } from '@/config';

export const metadata: Metadata = {
  title: `International Patients · ${APP_CONFIG.appName}`,
  description: `Information and enquiry support for international patients visiting ${APP_CONFIG.appName}.`,
};

export default async function InternationalPatientsPage() {
  const content = await getInternationalPageContent();

  return (
    <>
      <PageHero
        eyebrow="Global care"
        title={content?.title ?? 'International patients'}
        subtitle={
          content?.introduction ??
          'Coordinated outpatient and elective care for patients travelling to Bengaluru. Demo content — contact our coordinator for current policies.'
        }
      />
      <section className="section-pad">
        <div className="container-page">
          <Breadcrumbs
            items={[{ label: 'Home', href: '/' }, { label: 'International Patients' }]}
            className="mb-8"
          />

          <div className="grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {content?.howToRequest && (
                <div className="card-surface p-6">
                  <h2 className="font-semibold text-ink">How to request care</h2>
                  <p className="mt-2 text-sm text-ink-muted whitespace-pre-line">
                    {content.howToRequest}
                  </p>
                </div>
              )}
              {content?.secondOpinion && (
                <div className="card-surface p-6">
                  <h2 className="font-semibold text-ink">Second opinion</h2>
                  <p className="mt-2 text-sm text-ink-muted whitespace-pre-line">
                    {content.secondOpinion}
                  </p>
                </div>
              )}
              {content?.requiredDocuments && (
                <div className="card-surface p-6">
                  <h2 className="font-semibold text-ink">Required documents</h2>
                  <p className="mt-2 text-sm text-ink-muted whitespace-pre-line">
                    {content.requiredDocuments}
                  </p>
                </div>
              )}
              {content?.travelInformation && (
                <div className="card-surface p-6">
                  <h2 className="font-semibold text-ink">Travel information</h2>
                  <p className="mt-2 text-sm text-ink-muted whitespace-pre-line">
                    {content.travelInformation}
                  </p>
                </div>
              )}
              {content?.accommodationInfo && (
                <div className="card-surface p-6">
                  <h2 className="font-semibold text-ink">Accommodation</h2>
                  <p className="mt-2 text-sm text-ink-muted whitespace-pre-line">
                    {content.accommodationInfo}
                  </p>
                </div>
              )}
              {!content && (
                <div className="card-surface p-6">
                  <p className="text-sm text-ink-muted">
                    International patient programme details will be published soon. Submit an enquiry
                    and our coordinator will assist with travel and appointment planning. This page
                    uses demo placeholder content until CMS entries are added.
                  </p>
                </div>
              )}
              {content?.coordinatorContact && (
                <div className="rounded-card bg-brand-50 p-4 text-sm text-brand-900">
                  <strong>Coordinator:</strong> {content.coordinatorContact}
                </div>
              )}
            </div>

            <aside>
              <h2 className="font-display text-lg font-semibold text-ink">Enquiry form</h2>
              <p className="mt-2 text-sm text-ink-muted">
                Tell us about your treatment interest and we will respond with next steps.
              </p>
              <div className="mt-4">
                <InternationalEnquiryForm />
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
