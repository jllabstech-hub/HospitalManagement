import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { APP_CONFIG } from '@/config';
import { getSiteUrl } from '@/lib/seo';
import { getTenantBranding } from '@/lib/tenant/branding';
import './globals.css';

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

  // Extract custom branding colors if available
  const primaryColor = branding?.primaryColor || '#0ea5e9';
  const secondaryColor = branding?.secondaryColor || '#f43f5e';
  const fontFamily = branding?.fontFamily || 'var(--font-inter)';

  return (
    <html lang="en" className={inter.variable}>
      <head>
        <style dangerouslySetInnerHTML={{
          __html: `
            :root {
              --color-brand-500: ${primaryColor};
              --color-brand-600: ${primaryColor};
              --color-brand-700: ${primaryColor};
              --color-accent-500: ${secondaryColor};
              --font-sans: ${fontFamily};
            }
          `
        }} />
      </head>
      <body className="min-h-screen bg-surface-warm font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
