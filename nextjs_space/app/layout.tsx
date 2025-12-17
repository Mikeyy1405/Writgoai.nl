
import type { Metadata, Viewport } from 'next';
// import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import RegisterServiceWorker from './register-sw';
import InstallPrompt from '@/components/install-prompt';
import CookieBanner from '@/components/cookie-banner';

// const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://writgo.nl'),
  title: {
    default: 'Writgo Media #OMNIPRESENCE | AI-Gedreven Zichtbaarheid voor Lokale Dienstverleners',
    template: '%s | Writgo Media #OMNIPRESENCE'
  },
  description: 'Domineer Google & Social Media zonder er tijd aan te besteden. 100% AI-powered omnipresence platform voor lokale dienstverleners. 400+ AI modellen, zero-touch, vanaf €197/maand. Maandelijks opzegbaar.',
  keywords: [
    'omnipresence marketing',
    'lokale dienstverleners marketing',
    'AI content marketing',
    'Google zichtbaarheid',
    'social media automatisering',
    'SEO lokaal',
    'AI schrijftool',
    'AI content generator',
    'LinkedIn automatisering',
    'Instagram automatisering',
    'faceless video\'s',
    'Google Mijn Bedrijf',
    'kapper marketing',
    'tandarts marketing',
    'installateur marketing',
    'lokale SEO Nederland'
  ],
  authors: [{ name: 'Mike Schonewille', url: 'https://writgo.nl' }],
  creator: 'Writgo Media by Mike Schonewille',
  publisher: 'Writgo Media',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Writgo Media',
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icon-192.png',
  },
  openGraph: {
    type: 'website',
    locale: 'nl_NL',
    url: 'https://writgo.nl',
    siteName: 'Writgo Media #OMNIPRESENCE',
    title: 'Writgo Media #OMNIPRESENCE | Domineer Google & Social Media',
    description: 'AI-gedreven omnipresence voor lokale dienstverleners. 400+ AI modellen, zero-touch, vanaf €197/maand. Maandelijks opzegbaar, geen setup kosten.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Writgo Media #OMNIPRESENCE - AI-Powered Platform voor Lokale Dienstverleners',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Writgo Media #OMNIPRESENCE | Domineer Google & Social Media',
    description: 'AI-gedreven omnipresence voor lokale dienstverleners. 400+ AI modellen, vanaf €197/maand. Zero-touch, maandelijks opzegbaar.',
    images: ['/og-image.png'],
    creator: '@WritgoMedia',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://writgo.nl',
  },
  verification: {
    google: 'p_boU5OFOBKAI5HGrq85ZU5MOXuddbZPLEU0wtDmAhI',
  },
};

export const viewport: Viewport = {
  themeColor: '#FF9933',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl" className="dark">
      <head>
        <meta name="google-site-verification" content="p_boU5OFOBKAI5HGrq85ZU5MOXuddbZPLEU0wtDmAhI" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Writgo Media" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="font-sans bg-black text-white">
        <Providers>
          {children}
          <InstallPrompt />
          <CookieBanner />
        </Providers>
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
