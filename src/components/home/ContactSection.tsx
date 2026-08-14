import { APP_CONFIG } from '@/config';
import SectionHeader from '@/components/ui/SectionHeader';
import Card from '@/components/ui/Card';

interface ContactSectionProps {
  profile?: {
    phone?: string | null;
    email?: string | null;
    emergencyPhone?: string | null;
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    workingHours?: string | null;
  } | null;
}

export default function ContactSection({ profile }: ContactSectionProps) {
  const phone = profile?.phone ?? APP_CONFIG.contact.phone;
  const email = profile?.email ?? APP_CONFIG.contact.email;
  const emergencyPhone = profile?.emergencyPhone ?? APP_CONFIG.contact.emergency;
  const workingHours = profile?.workingHours ?? APP_CONFIG.contact.hours;
  const address = profile
    ? [profile.addressLine1, profile.addressLine2, profile.city, profile.state, profile.postalCode].filter(Boolean).join(', ')
    : APP_CONFIG.contact.address;
  const phoneHref = profile?.phone ? `tel:${profile.phone.replace(/[^0-9+]/g, '')}` : APP_CONFIG.contact.phoneHref;

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
              href={phoneHref}
              className="mt-2 block text-lg font-semibold text-ink hover:text-brand-700"
            >
              {phone}
            </a>
            <p className="mt-1 text-sm text-ink-muted">{emergencyPhone}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-600">Email</p>
            <a
              href={`mailto:${email}`}
              className="mt-2 block break-all text-lg font-semibold text-ink hover:text-brand-700"
            >
              {email}
            </a>
            <p className="mt-1 text-sm text-ink-muted">{workingHours}</p>
          </div>
          <div className="sm:col-span-2 border-t border-[#dde5e9] pt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-600">
              Location
            </p>
            <p className="mt-2 text-base font-medium text-ink">{address}</p>
          </div>
        </Card>
      </div>
    </section>
  );
}
