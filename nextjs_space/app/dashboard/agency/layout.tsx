'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  FileText,
  ClipboardList,
  MessageSquare,
  Menu,
  X,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOut } from 'next-auth/react';

interface AgencyLayoutProps {
  children: React.ReactNode;
}

export default function AgencyLayout({ children }: AgencyLayoutProps) {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/inloggen');
    }
  }, [status, router]);

  const menuItems = [
    {
      name: 'Dashboard',
      href: '/dashboard/agency',
      icon: LayoutDashboard,
    },
    {
      name: 'Klanten',
      href: '/dashboard/agency/clients',
      icon: Users,
    },
    {
      name: 'Opdrachten',
      href: '/dashboard/agency/assignments',
      icon: ClipboardList,
    },
    {
      name: 'Verzoeken',
      href: '/dashboard/agency/requests',
      icon: MessageSquare,
    },
    {
      name: 'Facturen',
      href: '/dashboard/agency/invoices',
      icon: FileText,
    },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard/agency') {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Top Navigation Bar */}
      <div className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <Link href="/dashboard/agency" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">W</span>
              </div>
              <span className="text-white font-semibold text-lg hidden sm:block">
                WritGo AI Agency
              </span>
            </Link>
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 text-gray-300 hover:text-white"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {session?.user?.name?.[0] || 'A'}
                  </span>
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium">{session?.user?.name || 'Admin'}</div>
                  <div className="text-xs text-gray-400">Agency Admin</div>
                </div>
                <ChevronDown size={16} className="hidden sm:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-gray-900 border-gray-800">
              <DropdownMenuItem asChild>
                <Link href="/client-portal" className="cursor-pointer text-gray-300 hover:text-white">
                  Client Portal
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-800" />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: '/inloggen' })}
                className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-950"
              >
                <LogOut size={16} className="mr-2" />
                Uitloggen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 bg-gray-900 border-r border-gray-800 min-h-[calc(100vh-57px)] sticky top-[57px]">
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    active
                      ? 'bg-gradient-to-r from-green-500/20 to-emerald-600/20 text-green-400 border border-green-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-gray-900/95 backdrop-blur-sm">
            <nav className="p-4 space-y-2 mt-16">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      active
                        ? 'bg-gradient-to-r from-green-500/20 to-emerald-600/20 text-green-400 border border-green-500/30'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
