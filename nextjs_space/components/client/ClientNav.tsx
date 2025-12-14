'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { 
  LayoutDashboard, 
  FileText, 
  Share2, 
  LogOut,
  Settings
} from 'lucide-react';

export default function ClientNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard/overzicht', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/content-hub', label: 'Blogs', icon: FileText },
    { href: '/dashboard/social-media-suite', label: 'Social Media', icon: Share2 },
    { href: '/dashboard/settings', label: 'Instellingen', icon: Settings },
  ];

  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard/overzicht" className="flex items-center">
            <span className="text-2xl font-bold text-[#FF9933]">WritGo</span>
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-[#FF9933] text-white' 
                      : 'text-gray-300 hover:bg-gray-800'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}

            {/* Logout */}
            <button
              onClick={() => signOut({ callbackUrl: '/client-login' })}
              className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-gray-800 rounded-lg transition-colors ml-4"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Uitloggen</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
