import { APP_CONFIG } from '@/config';
import SectionHeader from '@/components/ui/SectionHeader';
import Card from '@/components/ui/Card';

export default function ContactSection() {
  return (
    <section id="contact" className="section-pad scroll-mt-28">
      <div className="container-page grid gap-8 lg:grid-cols-2">
        <SectionHeader
          eyebrow="Visit & contact"
          title="We are here to help you get care"
          description="Reach the hospital desk for general enquiries, or use the patient portal to book outpatient consultations online."
        />
        <Card className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-600">Phone</p>
            <a
              href={APP_CONFIG.contact.phoneHref}
              className="mt-2 block text-lg font-semibold text-ink hover:text-brand-700"
            >
              {APP_CONFIG.contact.phone}
            </a>
            <p className="mt-1 text-sm text-ink-muted">{APP_CONFIG.contact.emergency}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-600">Email</p>
            <a
              href={`mailto:${APP_CONFIG.contact.email}`}
              className="mt-2 block break-all text-lg font-semibold text-ink hover:text-brand-700"
            >
              {APP_CONFIG.contact.email}
            </a>
            <p className="mt-1 text-sm text-ink-muted">{APP_CONFIG.contact.hours}</p>
          </div>
          <div className="sm:col-span-2 border-t border-[#dde5e9] pt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-600">
              Location
            </p>
            <p className="mt-2 text-base font-medium text-ink">{APP_CONFIG.contact.address}</p>
          </div>
        </Card>
      </div>
    </section>
  );
}
