'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, LayoutDashboard, FileText, Share2, Settings, HelpCircle, LogOut } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { Logo } from '../dashboard/logo';
import ProjectSwitcher from '@/components/project/ProjectSwitcher';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Blog Content', href: '/dashboard/blog', icon: FileText },
  { name: 'Social Media', href: '/dashboard/social', icon: Share2 },
  { name: 'Instellingen', href: '/dashboard/settings', icon: Settings },
  { name: 'Help', href: '/dashboard/help', icon: HelpCircle }
];

interface ClientMobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ClientMobileNav({ isOpen, onClose }: ClientMobileNavProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Mobile Menu */}
      <div className="fixed inset-y-0 left-0 w-72 bg-gray-900 border-r border-gray-800 z-50 lg:hidden flex flex-col">
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Logo size="sm" showText={true} />
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white uppercase">Client</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Project Switcher */}
        <div className="p-4 border-b border-gray-800">
          <ProjectSwitcher />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${isActive 
                    ? 'bg-[#FF9933]/10 text-[#FF9933] shadow-sm' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
                  }
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="flex-1">{item.name}</span>
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FF9933]"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-[#FF9933] rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-100 truncate">
                {session?.user?.name || 'Gebruiker'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {session?.user?.email || ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              onClose();
              signOut({ callbackUrl: '/client-login' });
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Uitloggen</span>
          </button>
        </div>
      </div>
    </>
  );
}
