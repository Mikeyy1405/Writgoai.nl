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
  LogOut
} from 'lucide-react';

/**
 * SUPER SIMPELE NAVIGATIE
 * 
 * 6 functies - that's it!
 * - 🏠 Dashboard
 * - 📁 Mijn Projecten
 * - 📝 Content Plan
 * - ✨ Genereren
 * - 🚀 Publiceren
 * - 📊 Statistieken
 */

const menuItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/projects', label: 'Mijn Projecten', icon: FolderKanban },
  { href: '/content-plan', label: 'Content Plan', icon: Calendar },
  { href: '/generate', label: 'Genereren', icon: Sparkles },
  { href: '/publish', label: 'Publiceren', icon: Send },
  { href: '/stats', label: 'Statistieken', icon: BarChart3 },
];

export default function SimplifiedNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">W</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">WritGo</h1>
              <p className="text-xs text-slate-400">Content Platform</p>
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
                className={`
                  flex items-center space-x-3 px-4 py-3 rounded-lg
                  transition-all duration-200 group
                  ${isActive 
                    ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? '' : 'group-hover:scale-110 transition-transform'}`} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={() => signOut({ callbackUrl: '/inloggen' })}
            className="flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-slate-300 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Uitloggen</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
