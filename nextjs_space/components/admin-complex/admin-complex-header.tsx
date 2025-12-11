'use client';

import { Menu, Bell, LogOut, User } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '../ui/button';
import Link from 'next/link';

interface AdminComplexHeaderProps {
  onMobileMenuToggle: () => void;
}

export function AdminComplexHeader({ onMobileMenuToggle }: AdminComplexHeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-4 lg:px-8 py-4 bg-white border-b border-gray-200">
      {/* Left: Mobile Menu Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        {/* Admin Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg">
          <User className="w-4 h-4" />
          <span className="text-sm font-semibold">ADMIN INTERFACE</span>
        </div>
      </div>

      {/* Right: User Info & Actions */}
      <div className="flex items-center gap-3">
        {/* Quick Actions */}
        <Link
          href="/dashboard/overzicht"
          className="hidden md:block px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          👤 Klant Weergave
        </Link>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User Menu */}
        <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
          <div className="hidden sm:block text-right">
            <div className="text-sm font-medium text-gray-900">
              {session?.user?.name || 'Admin'}
            </div>
            <div className="text-xs text-red-600 font-semibold">
              Writgo Eigenaar
            </div>
          </div>
          
          <button
            onClick={() => signOut({ callbackUrl: '/client-login' })}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-red-600 transition-colors"
            title="Uitloggen"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
