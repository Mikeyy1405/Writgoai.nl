'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { 
  Home, 
  FolderKanban, 
  Calendar, 
  Sparkles, 
  Send, 
  BarChart3,
  Settings,
  LogOut
} from 'lucide-react';

/**
 * RESPONSIVE NAVIGATIE met HAMBURGER MENU
 * 
 * Desktop: Fixed sidebar links (altijd zichtbaar)
 * Mobiel: Slide-in sidebar met hamburger menu
 * 
 * 7 functies:
 * - 🏠 Dashboard
 * - 📁 Mijn Projecten
 * - 📝 Content Plan
 * - ✨ Genereren
 * - 🚀 Publiceren
 * - 📊 Statistieken
 * - ⚙️ Instellingen
 */

const menuItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/projects', label: 'Mijn Projecten', icon: FolderKanban },
  { href: '/content-plan', label: 'Content Plan', icon: Calendar },
  { href: '/generate', label: 'Genereren', icon: Sparkles },
  { href: '/publish', label: 'Publiceren', icon: Send },
  { href: '/stats', label: 'Statistieken', icon: BarChart3 },
  { href: '/settings', label: 'Instellingen', icon: Settings },
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
    // Sluit mobile menu wanneer er op een link wordt geklikt
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
        {/* Logo - Verborgen op mobiel (want in header) */}
        <div className="hidden md:block p-6 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">W</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">WritGo</h1>
              <p className="text-xs text-gray-400">Content Platform</p>
            </div>
          </div>
        </div>

        {/* Logo op mobiel */}
        <div className="md:hidden p-6 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">W</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">WritGo</h1>
              <p className="text-xs text-gray-400">Content Platform</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className={`
                  flex items-center space-x-3 px-4 py-3 rounded-lg
                  transition-all duration-200 group
                  min-h-[44px]
                  ${isActive 
                    ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg shadow-orange-500/30' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }
                `}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? '' : 'group-hover:scale-110 transition-transform'}`} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={() => signOut({ callbackUrl: '/inloggen' })}
            className="flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-gray-300 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 min-h-[44px]"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">Uitloggen</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
