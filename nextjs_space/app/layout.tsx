
import type { Metadata, Viewport } from 'next';
// import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import RegisterServiceWorker from './register-sw';
import InstallPrompt from '@/components/install-prompt';
import CookieBanner from '@/components/cookie-banner';

// const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://writgoai.nl'),
  title: {
    default: 'WritgoAI - AI Schrijftool & Content Generator voor WordPress | Blog Generator AI',
    template: '%s | WritgoAI - AI Content Platform'
  },
  description: 'WritgoAI is dé AI schrijftool voor professionals. Genereer blogs, social media posts en WooCommerce product beschrijvingen in seconden. WordPress AI plugin met GPT-5.1, SEO optimalisatie en Originality.AI integratie. Probeer gratis!',
  keywords: [
    'AI schrijftool',
    'AI content generator',
    'blog generator AI',
    'AI tekstschrijver',
    'WordPress AI plugin',
    'social media planner',
    'SEO content tool',
    'AI copywriter',
    'automatische blog schrijver',
    'WooCommerce product beschrijvingen',
    'AI tekstgenerator Nederlands',
    'content automatisering',
    'GPT-5.1',
    'blog schrijven AI',
    'content marketing tool'
  ],
  authors: [{ name: 'Mike Schonewille', url: 'https://writgoai.nl' }],
  creator: 'WritgoAI by Mike Schonewille',
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
    url: 'https://writgoai.nl',
    siteName: 'WritgoAI',
    title: 'WritgoAI - AI Schrijftool & Content Generator voor WordPress',
    description: 'Genereer professionele blogs, social media posts en WooCommerce producten met AI. WordPress plugin met GPT-5.1, SEO optimalisatie en Originality.AI. Automatiseer je content in seconden!',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'WritgoAI - AI Content Generator Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WritgoAI - AI Schrijftool & Content Generator',
    description: 'Genereer professionele content met AI. WordPress plugin, GPT-5.1, SEO tools. Probeer gratis!',
    images: ['/og-image.png'],
    creator: '@WritgoAI',
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
    canonical: 'https://writgoai.nl',
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
    <html lang="nl">
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
      <body className="font-sans">
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
