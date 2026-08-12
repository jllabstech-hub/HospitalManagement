import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { APP_CONFIG } from '@/config';
import { getSiteUrl } from '@/lib/seo';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
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
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-surface-warm font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
