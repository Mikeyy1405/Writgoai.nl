'use client';

import { Menu, Bell, User } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { isUserAdmin } from '@/lib/navigation-config';

interface ClientHeaderProps {
  onMobileMenuToggle: () => void;
}

export default function ClientHeader({ onMobileMenuToggle }: ClientHeaderProps) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.email ? isUserAdmin(session.user.email, session.user.role) : false;

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
        
        {/* Client Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg">
          <User className="w-4 h-4" />
          <span className="text-sm font-semibold">CLIENT DASHBOARD</span>
        </div>
      </div>

      {/* Right: Quick Actions */}
      <div className="flex items-center gap-3">
        {/* Switch to Admin (if admin) */}
        {isAdmin && (
          <Link
            href="/admin"
            className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <User className="w-4 h-4" />
            <span>Admin View</span>
          </Link>
        )}

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-gray-100 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF9933] rounded-full" />
        </button>
      </div>
    </header>
  );
}
