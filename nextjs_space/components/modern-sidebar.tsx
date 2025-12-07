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
  Sparkles,
  Search,
  PenTool,
  Users,
  FolderKanban,
  Send,
  Bot
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

// Dashboard & Overview
const overviewItems: NavItem[] = [
  { label: 'Dashboard', href: '/client-portal', icon: <LayoutDashboard size={20} /> },
  { label: 'Content Hub', href: '/client-portal/content-hub', icon: <Sparkles size={20} />, badge: 'Nieuw', badgeColor: 'green' },
  { label: 'Projecten', href: '/client-portal/projects', icon: <Globe size={20} /> },
];

// "Zelf Doen" - AI Tools (gratis te gebruiken)
const selfServiceItems: NavItem[] = [
  { label: 'Blog Generator', href: '/client-portal/blog-generator', icon: <PenTool size={20} /> },
  { label: 'Video Generator', href: '/client-portal/video-generator', icon: <Video size={20} />, badge: 'Pro', badgeColor: 'orange' },
  { label: 'Zoekwoord Onderzoek', href: '/client-portal/zoekwoord-onderzoek', icon: <Search size={20} />, badge: 'Nieuw', badgeColor: 'green' },
  { label: 'Site Planner', href: '/client-portal/site-planner', icon: <Map size={20} /> },
  { label: 'Content Generator', href: '/client-portal/content-generator', icon: <Wand2 size={20} /> },
  { label: 'Afbeelding Generator', href: '/client-portal/image-specialist', icon: <Image size={20} /> },
];

// "Laat Ons Doen" - Agency diensten (verzoeken/facturen)
const agencyServiceItems: NavItem[] = [
  { label: 'Nieuw Verzoek', href: '/client-portal/nieuw-verzoek', icon: <Plus size={20} />, badge: '✨', badgeColor: 'orange' },
  { label: 'Mijn Opdrachten', href: '/client-portal/opdrachten', icon: <FolderKanban size={20} /> },
  { label: 'Mijn Verzoeken', href: '/client-portal/verzoeken', icon: <Send size={20} /> },
  { label: 'Mijn Facturen', href: '/client-portal/facturen', icon: <Receipt size={20} /> },
];

// Overig
const otherItems: NavItem[] = [
  { label: 'Content Library', href: '/client-portal/content-library', icon: <Library size={20} /> },
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
      case 'green': return 'bg-emerald-500/20 text-emerald-400';
      default: return 'bg-blue-500/20 text-blue-400';
    }
  };

  const renderNavSection = (title: string, items: NavItem[], icon?: React.ReactNode, description?: string) => (
    <div className="mb-6">
      <div className="flex items-center gap-2 px-3 mb-3">
        {icon && <span className="text-gray-500">{icon}</span>}
        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">{title}</p>
      </div>
      {description && (
        <p className="text-gray-600 text-[10px] px-3 mb-2">{description}</p>
      )}
      <nav className="space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={closeMobileMenu}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
              ${isActive(item.href)
                ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/20'
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
          <Link href="/client-portal" onClick={closeMobileMenu} className="flex flex-col gap-1">
            <span className="text-2xl font-bold tracking-tight">
              <span className="text-white">Writgo</span>
              <span className="text-[#FF6B35]">Media</span>
            </span>
            <p className="text-gray-400 text-xs uppercase tracking-wide">Client Portal</p>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto scrollbar-hide py-6 px-3">
          {renderNavSection('Overzicht', overviewItems)}
          
          {/* Zelf Doen Section */}
          <div className="mb-6">
            <div className="flex items-center gap-2 px-3 mb-2">
              <Bot size={14} className="text-emerald-500" />
              <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Zelf Doen</p>
            </div>
            <p className="text-gray-600 text-[10px] px-3 mb-2">AI tools - zelf content maken</p>
            <nav className="space-y-1">
              {selfServiceItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                    ${isActive(item.href)
                      ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/20'
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

          {/* Laat Ons Doen Section */}
          <div className="mb-6">
            <div className="flex items-center gap-2 px-3 mb-2">
              <Users size={14} className="text-blue-500" />
              <p className="text-blue-400 text-xs font-bold uppercase tracking-wider">Laat Ons Doen</p>
            </div>
            <p className="text-gray-600 text-[10px] px-3 mb-2">Agency diensten - wij doen het werk</p>
            <nav className="space-y-1">
              {agencyServiceItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                    ${isActive(item.href)
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20'
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

          {renderNavSection('Overig', otherItems)}
        </div>

        {/* Quick Action Buttons */}
        <div className="p-3 border-t border-gray-800 space-y-2">
          <Link href="/client-portal/blog-generator" onClick={closeMobileMenu}>
            <Button className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold shadow-lg shadow-emerald-500/20">
              <Sparkles size={18} className="mr-2" />
              Schrijf Blog
            </Button>
          </Link>
          <Link href="/client-portal/nieuw-verzoek" onClick={closeMobileMenu}>
            <Button variant="outline" className="w-full border-blue-500/50 text-blue-400 hover:bg-blue-500/10">
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
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center text-emerald-400 font-bold border border-emerald-500/20">
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
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/agency" onClick={closeMobileMenu} className="flex items-center gap-2 cursor-pointer">
                    <Settings size={16} />
                    <span>Agency Dashboard</span>
                  </Link>
                </DropdownMenuItem>
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
