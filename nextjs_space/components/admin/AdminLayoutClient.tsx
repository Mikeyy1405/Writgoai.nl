'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import AdminMobileNav from './AdminMobileNav';
import { PortalSwitcher } from '@/components/PortalSwitcher';

interface AdminLayoutClientProps {
  children: React.ReactNode;
}

export default function AdminLayoutClient({ children }: AdminLayoutClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar - Hidden on mobile */}
      <AdminSidebar />

      {/* Mobile Navigation */}
      <AdminMobileNav isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        {/* Header Bar - Visible on all screen sizes */}
        <div className="sticky top-0 z-40 bg-zinc-900 border-b border-zinc-800 px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Mobile Menu Button - Only on mobile */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-zinc-800 text-white transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            {/* Desktop spacer */}
            <div className="hidden lg:block flex-1" />
            
            {/* Portal Switcher - Visible on all screen sizes */}
            <div className="ml-auto">
              <PortalSwitcher />
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
