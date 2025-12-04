
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
    default: 'Writgo Media - Omnipresence Content Platform | Complete Online Aanwezigheid',
    template: '%s | Writgo Media - Content Platform'
  },
  description: 'Writgo Media is jouw complete omnipresence partner. Genereer blogs, social media posts, video content en email marketing. SEO geoptimaliseerd met GPT-5.1, voor consistente zichtbaarheid op alle kanalen. Probeer gratis!',
  keywords: [
    'omnipresence marketing',
    'content marketing',
    'social media content',
    'video content creatie',
    'email marketing',
    'AI schrijftool',
    'AI content generator',
    'blog generator AI',
    'WordPress AI plugin',
    'SEO content tool',
    'content automatisering',
    'complete online aanwezigheid',
    'multi-channel marketing',
    'GPT-5.1',
    'content strategie'
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
    siteName: 'Writgo Media',
    title: 'Writgo Media - Omnipresence Content Platform | Complete Online Aanwezigheid',
    description: 'Bouw een complete online aanwezigheid met Writgo Media. Blogs, social media, video content en email marketing - alles in één platform. SEO geoptimaliseerd met GPT-5.1. Probeer gratis!',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Writgo Media - Omnipresence Content Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Writgo Media - Omnipresence Content Platform',
    description: 'Complete online aanwezigheid: blogs, social media, video en email marketing. AI-powered, SEO geoptimaliseerd. Probeer gratis!',
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
    languages: {
      'nl': 'https://writgoai.nl',
      'en-US': 'https://writgoai.nl/en',
      'de': 'https://writgoai.nl/de',
      'x-default': 'https://writgoai.nl',
    },
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
