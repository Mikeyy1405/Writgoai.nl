'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { 
  LayoutDashboard, 
  FolderKanban, 
  FileText, 
  Share2,
  Calendar,
  Settings,
  LogOut,
  Sparkles,
  LucideIcon
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  description?: string;
}

export default function ClientSidebar() {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { 
      href: '/dashboard/overzicht', 
      label: 'Dashboard', 
      icon: LayoutDashboard,
      description: 'Overzicht' 
    },
    { 
      href: '/dashboard/projects', 
      label: 'Mijn Projecten', 
      icon: FolderKanban,
      description: 'Websites beheren' 
    },
    { 
      href: '/dashboard/content-hub', 
      label: 'Blog Content', 
      icon: FileText,
      description: 'Blogs & artikelen' 
    },
    { 
      href: '/dashboard/social-media-suite', 
      label: 'Social Media', 
      icon: Share2,
      description: 'Social posts' 
    },
    { 
      href: '/dashboard/content-kalender', 
      label: 'Content Kalender', 
      icon: Calendar,
      description: 'Planning overzicht' 
    },
    { 
      href: '/dashboard/settings', 
      label: 'Instellingen', 
      icon: Settings,
      description: 'Account & voorkeuren' 
    },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard/overzicht') {
      return pathname === '/dashboard/overzicht' || pathname === '/dashboard/overzicht/';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="hidden lg:flex w-64 bg-gray-900 text-white min-h-screen flex-col border-r border-gray-800">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <Link href="/dashboard/overzicht" className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-orange-500" />
          <div>
            <span className="text-2xl font-bold text-white">WritGo</span>
            <p className="text-xs text-gray-400 mt-0.5">Content Platform</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                    ${active 
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/50' 
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }
                  `}
                  title={item.description}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-400'}`} />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm block truncate">{item.label}</span>
                    {item.description && !active && (
                      <span className="text-xs text-gray-500 block truncate">{item.description}</span>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={() => signOut({ callbackUrl: '/client-login' })}
          className="flex items-center gap-3 px-3 py-2.5 text-red-400 hover:bg-gray-800 hover:text-red-300 rounded-lg transition-all duration-200 w-full"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">Uitloggen</span>
        </button>
      </div>
    </div>
  );
}
