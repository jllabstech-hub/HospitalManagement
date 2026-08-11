import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Source_Serif_4 } from 'next/font/google';
import { APP_CONFIG } from '@/config';
import { getSiteUrl } from '@/lib/seo';
import './globals.css';

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const display = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: APP_CONFIG.appName,
    template: `%s · ${APP_CONFIG.shortName}`,
  },
  description:
    'Premium outpatient hospital experience—find specialists, book 30-minute consultations, and manage appointments securely.',
  applicationName: APP_CONFIG.appName,
  keywords: [
    'hospital',
    'appointment',
    'doctor',
    'outpatient',
    'CarePulse',
    'Bengaluru',
  ],
  openGraph: {
    siteName: APP_CONFIG.appName,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body className="min-h-screen bg-surface-warm font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
