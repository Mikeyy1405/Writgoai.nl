'use client';

import { Menu, Bell, LogOut } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '../ui/button';

interface DashboardHeaderProps {
  onMobileMenuToggle: () => void;
}

export function DashboardHeader({ onMobileMenuToggle }: DashboardHeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-4 lg:px-8 py-4 bg-gray-900 border-b border-gray-800">
      {/* Left: Mobile Menu Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-gray-100 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Right: User Info & Actions */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-gray-100 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User Menu */}
        <div className="flex items-center gap-3 pl-3 border-l border-gray-800">
          <div className="hidden sm:block text-right">
            <div className="text-sm font-medium text-gray-100">
              {session?.user?.name || 'Klant'}
            </div>
            <div className="text-xs text-gray-500">
              {session?.user?.email}
            </div>
          </div>
          
          <button
            onClick={() => signOut({ callbackUrl: '/client-login' })}
            className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-red-400 transition-colors"
            title="Uitloggen"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
