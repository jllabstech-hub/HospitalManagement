import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { APP_CONFIG } from '@/config';
import { getSiteUrl } from '@/lib/seo';
import { getTenantBranding } from '@/lib/tenant/branding';
import { brandingStyleVars } from '@/server/security/branding';
import './globals.css';

export const dynamic = 'force-dynamic';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getTenantBranding();
  const siteName = branding?.hospitalName || APP_CONFIG.appName;
  
  return {
    metadataBase: new URL(getSiteUrl()),
    title: {
      default: siteName,
      template: `%s · ${siteName}`,
    },
    description: branding?.shortDescription || 'Premium outpatient hospital experience—find specialists, book 30-minute consultations, and manage appointments securely.',
    applicationName: siteName,
    keywords: [
      'hospital',
      'appointment',
      'doctor',
      'outpatient',
      siteName,
    ],
    openGraph: {
      siteName: siteName,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
    },
    icons: branding?.logoUrl ? [{ url: branding.logoUrl }] : undefined,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const branding = await getTenantBranding();
  const cssVars = brandingStyleVars({
    primaryColor: branding?.primaryColor,
    secondaryColor: branding?.secondaryColor,
    fontFamily: branding?.fontFamily,
  });

  return (
    <html lang="en" className={inter.variable}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: cssVars }} />
      </head>
      <body className="min-h-screen bg-surface-warm font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
