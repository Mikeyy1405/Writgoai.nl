'use client';

import { useState } from 'react';
import { AdminSidebar } from './admin-sidebar';
import { AdminHeader } from './admin-header';
import { AdminMobileNav } from './admin-mobile-nav';

interface AdminLayoutProps {
  children: React.ReactNode;
  unreadCount?: number;
}

export function AdminLayout({ children, unreadCount = 0 }: AdminLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black flex">
      {/* Desktop Sidebar */}
      <AdminSidebar />

      {/* Mobile Navigation */}
      <AdminMobileNav isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <AdminHeader
          onMobileMenuToggle={() => setMobileMenuOpen(true)}
          unreadCount={unreadCount}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden">
          <div className="p-4 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
