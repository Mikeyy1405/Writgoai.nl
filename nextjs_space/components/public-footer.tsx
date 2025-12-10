
'use client';

import Link from 'next/link';
import { Mail, MapPin, Phone, FileText, Shield, Building2 } from 'lucide-react';
import { BrandLogo } from '@/components/brand/brand-logo';

export default function PublicFooter() {
  return (
    <footer className="bg-gray-900 border-t border-orange-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Over Ons */}
          <div>
            <div className="mb-4">
              <BrandLogo variant="full" size="md" />
            </div>
            <p className="text-gray-400 text-sm mb-4">
              100% Autonome AI Content Marketing voor lokale dienstverleners. 
              SEO + Social Media + Video - volledig geautomatiseerd, zonder meetings.
            </p>
          </div>

          {/* Navigatie */}
          <div>
            <h3 className="text-white font-semibold mb-4 flex items-center">
              <FileText className="w-4 h-4 mr-2 text-orange-500" />
              Pagina's
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/hoe-het-werkt" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
                  Hoe Het Werkt
                </Link>
              </li>
              <li>
                <Link href="/prijzen" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
                  Prijzen
                </Link>
              </li>
              <li>
                <Link href="/over-ons" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
                  Over Ons
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/inloggen" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
                  Inloggen
                </Link>
              </li>
            </ul>
          </div>

          {/* Juridisch */}
          <div>
            <h3 className="text-white font-semibold mb-4 flex items-center">
              <Shield className="w-4 h-4 mr-2 text-orange-500" />
              Juridisch
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacybeleid" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
                  Privacybeleid
                </Link>
              </li>
              <li>
                <Link href="/algemene-voorwaarden" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
                  Algemene Voorwaarden
                </Link>
              </li>
              <li>
                <Link href="/terugbetalingsbeleid" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
                  Terugbetalingsbeleid
                </Link>
              </li>
              <li>
                <Link href="/cookiebeleid" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
                  Cookiebeleid
                </Link>
              </li>
            </ul>
          </div>

          {/* Bedrijfsgegevens */}
          <div>
            <h3 className="text-white font-semibold mb-4 flex items-center">
              <Building2 className="w-4 h-4 mr-2 text-orange-500" />
              Contactgegevens
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start text-gray-400">
                <MapPin className="w-4 h-4 mr-2 text-orange-500 mt-0.5 flex-shrink-0" />
                <span>
                  Langerakbaan 183-1287<br />
                  3544PE Utrecht
                </span>
              </li>
              <li className="flex items-center text-gray-400">
                <Mail className="w-4 h-4 mr-2 text-orange-500 flex-shrink-0" />
                <a href="mailto:info@writgo.nl" className="hover:text-orange-500 transition-colors">
                  info@writgo.nl
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bedrijfsdetails */}
        <div className="border-t border-gray-800 pt-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="text-sm">
              <span className="text-gray-500">KVK:</span>
              <span className="text-gray-400 ml-2">96200960</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">BTW:</span>
              <span className="text-gray-400 ml-2">NL867510675B01</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">IBAN:</span>
              <span className="text-gray-400 ml-2">NL31KNAB0623012014</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">Bedrijf:</span>
              <span className="text-gray-400 ml-2">Writgo Media</span>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} Writgo Media. Alle rechten voorbehouden.
          </div>
        </div>
      </div>
    </footer>
  );
}
