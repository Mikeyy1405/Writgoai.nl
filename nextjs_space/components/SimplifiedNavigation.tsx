'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { 
  Home, 
  FileText,
  Settings,
  LogOut,
  Map
} from 'lucide-react';

/**
 * SUPER VEREENVOUDIGDE NAVIGATIE - 4 menu items
 * 
 * Desktop: Fixed sidebar links (altijd zichtbaar)
 * Mobiel: Slide-in sidebar met hamburger menu
 * 
 * 4 functies:
 * - 🏠 Dashboard (alles op één scherm)
 * - 🗺️ Content Planning (Topical Authority Maps)
 * - 📄 Content (uitgebreid overzicht)
 * - ⚙️ Instellingen
 */

const menuItems = [
  { 
    href: '/', 
    label: 'Dashboard', 
    icon: Home,
    description: 'Sites, Genereren & Overzicht'
  },
  { 
    href: '/topical-authority', 
    label: 'Content Planning', 
    icon: Map,
    description: '400+ artikel strategieën'
  },
  { 
    href: '/content', 
    label: 'Content Overzicht', 
    icon: FileText,
    description: 'Al je artikelen'
  },
  { 
    href: '/instellingen', 
    label: 'Instellingen', 
    icon: Settings,
    description: 'Account & voorkeuren'
  },
];

interface SimplifiedNavigationProps {
  isMobileMenuOpen?: boolean;
  closeMobileMenu?: () => void;
}

export default function SimplifiedNavigation({ 
  isMobileMenuOpen = false, 
  closeMobileMenu 
}: SimplifiedNavigationProps) {
  const pathname = usePathname();

  const handleLinkClick = () => {
    if (closeMobileMenu) {
      closeMobileMenu();
    }
  };

  return (
    <nav 
      className={`
        fixed left-0 top-0 h-screen w-64 
        bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 
        text-white shadow-2xl z-50
        transform transition-transform duration-300 ease-in-out
        md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">W</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                WritGo
              </h1>
              <p className="text-xs text-white">Content Platform</p>
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="px-6 py-4 bg-gradient-to-r from-orange-500/10 to-orange-600/10 border-b border-gray-700">
          <p className="text-sm text-white">
            ✨ Maak elke dag content voor al je WordPress sites
          </p>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className={`
                  flex flex-col px-4 py-4 rounded-xl
                  transition-all duration-200 group
                  ${isActive 
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }
                `}
              >
                <div className="flex items-center space-x-3 mb-1">
                  <Icon className={`w-6 h-6 flex-shrink-0 ${isActive ? '' : 'group-hover:scale-110 transition-transform'}`} />
                  <span className="font-semibold text-base">{item.label}</span>
                </div>
                <p className={`text-xs ml-9 ${isActive ? 'text-white/90' : 'text-slate-200'}`}>
                  {item.description}
                </p>
              </Link>
            );
          })}
        </div>

        {/* Info Box */}
        <div className="p-4 mx-4 mb-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-xs text-white font-semibold mb-2">💡 Snelle workflow:</p>
          <ol className="text-xs text-slate-200 space-y-1">
            <li>1. Voeg WordPress site toe</li>
            <li>2. Voer onderwerp in</li>
            <li>3. Klik "Genereer"</li>
            <li>4. Klik "Publiceer"</li>
          </ol>
          <p className="text-xs text-green-400 mt-2 font-semibold">✅ Klaar in 30 seconden!</p>
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={() => signOut({ callbackUrl: '/inloggen' })}
            className="flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-gray-300 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">Uitloggen</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
