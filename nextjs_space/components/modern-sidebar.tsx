
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { 
  LayoutDashboard, 
  FileText, 
  Wand2, 
  Calendar, 
  Map,
  Library,
  Globe,
  Receipt,
  HelpCircle,
  Plus,
  ChevronDown,
  Settings,
  LogOut,
  User,
  MessageSquare,
  Image,
  Video,
  Share2,
  ShoppingBag,
  ShieldCheck,
  Menu,
  X,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}

const menuItems: NavItem[] = [
  { label: 'Dashboard', href: '/client-portal', icon: <LayoutDashboard size={20} /> },
  { label: 'Mijn Opdrachten', href: '/client-portal/opdrachten', icon: <FileText size={20} /> },
  { label: 'Mijn Verzoeken', href: '/client-portal/verzoeken', icon: <MessageSquare size={20} /> },
  { label: 'Mijn Facturen', href: '/client-portal/facturen', icon: <Receipt size={20} /> },
];

const toolsItems: NavItem[] = [
  { label: 'Nieuw Verzoek', href: '/client-portal/nieuw-verzoek', icon: <Plus size={20} />, badge: '✨', badgeColor: 'orange' },
];

const integrationItems: NavItem[] = [
  { label: 'Content Library', href: '/client-portal/content-library', icon: <Library size={20} /> },
];

const adminItems: NavItem[] = [
  { label: 'Support & Help', href: '/contact', icon: <HelpCircle size={20} /> },
];

export function ModernSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/client-portal') {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  const isSuperAdmin = session?.user?.email === 'info@writgo.nl';

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const getBadgeColor = (color?: string) => {
    switch(color) {
      case 'blue': return 'bg-blue-500/20 text-blue-400';
      case 'orange': return 'bg-orange-500/20 text-orange-400';
      default: return 'bg-blue-500/20 text-blue-400';
    }
  };

  const renderNavSection = (title: string, items: NavItem[]) => (
    <div className="mb-6">
      <p className="text-gray-500 text-xs font-bold uppercase tracking-wider px-3 mb-3">{title}</p>
      <nav className="space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={closeMobileMenu}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
              ${isActive(item.href)
                ? 'bg-gradient-to-r from-blue-500 to-orange-500 text-white shadow-lg shadow-blue-500/20'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }
            `}
          >
            {item.icon}
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getBadgeColor(item.badgeColor)}`}>
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button - Fixed Top Left */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 border border-gray-800 rounded-lg text-white hover:bg-gray-800 transition-colors"
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-screen
        transform transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <Link href="/client-portal" onClick={closeMobileMenu} className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-orange-500 rounded-xl flex items-center justify-center font-bold text-white text-xl">
              W
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">Writgo</h1>
              <p className="text-gray-400 text-xs uppercase tracking-wide">Client Portal</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto scrollbar-hide py-6 px-3">
          {renderNavSection('Menu', menuItems)}
          {renderNavSection('AI Tools', toolsItems)}
          {renderNavSection('Integraties', integrationItems)}
          {renderNavSection('Administratie', adminItems)}
        </div>

        {/* New Request Button */}
        <div className="p-3 border-t border-gray-800">
          <Link href="/client-portal/nieuw-verzoek" onClick={closeMobileMenu}>
            <Button className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold shadow-lg shadow-green-500/20">
              <Plus size={18} className="mr-2" />
              Nieuw Verzoek
            </Button>
          </Link>
        </div>

        {/* User Profile */}
        <div className="p-3 border-t border-gray-800">
          <DropdownMenu open={userMenuOpen} onOpenChange={setUserMenuOpen}>
            <DropdownMenuTrigger className="w-full">
              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-orange-500/20 flex items-center justify-center text-blue-400 font-bold border border-blue-500/20">
                  {session?.user?.name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white text-sm font-medium">{session?.user?.name || 'Gebruiker'}</p>
                  <p className="text-gray-400 text-xs">
                    {isSuperAdmin ? 'Admin' : 'Client'}
                  </p>
                </div>
                <ChevronDown size={16} className="text-gray-400" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-gray-800 border-gray-700">
              {isSuperAdmin && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/agency" onClick={closeMobileMenu} className="flex items-center gap-2 cursor-pointer">
                      <Settings size={16} />
                      <span>Agency Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/superadmin/dashboard" onClick={closeMobileMenu} className="flex items-center gap-2 cursor-pointer">
                      <ShieldCheck size={16} />
                      <span>Super Admin</span>
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem asChild>
                <Link href="/client-portal/account" onClick={closeMobileMenu} className="flex items-center gap-2 cursor-pointer">
                  <User size={16} />
                  <span>Account</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  closeMobileMenu();
                  signOut({ callbackUrl: '/client-login' });
                }}
                className="flex items-center gap-2 text-red-400 focus:text-red-400 cursor-pointer"
              >
                <LogOut size={16} />
                <span>Uitloggen</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </>
  );
}
