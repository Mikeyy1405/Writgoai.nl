'use client';

import { Bell, Menu } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { BrandLogo } from '@/components/brand/brand-logo';

interface AdminHeaderProps {
  onMobileMenuToggle?: () => void;
  unreadCount?: number;
}

export function AdminHeader({ onMobileMenuToggle, unreadCount = 0 }: AdminHeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-40 bg-black border-b border-zinc-800 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 lg:px-8 py-4">
        {/* Mobile menu button */}
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Brand on mobile */}
        <div className="lg:hidden flex items-center gap-2">
          <BrandLogo variant="text" size="sm" />
          <span className="text-gray-400 text-sm">Admin</span>
        </div>

        {/* User info */}
        <div className="ml-auto flex items-center gap-4">
          {/* Notifications */}
          <div className="relative">
            <button className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#FF6B35] text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Admin email */}
          <div className="hidden md:block text-right">
            <p className="text-sm text-zinc-500">Ingelogd als</p>
            <p className="text-sm font-medium text-white">{session?.user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
