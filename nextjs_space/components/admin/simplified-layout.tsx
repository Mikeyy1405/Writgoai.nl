'use client';

import { useState } from 'react';
import { SimplifiedSidebar } from './simplified-sidebar';
import { SimplifiedHeader } from './simplified-header';
import { SimplifiedMobileNav } from './simplified-mobile-nav';

interface SimplifiedLayoutProps {
  children: React.ReactNode;
}

export function SimplifiedLayout({ children }: SimplifiedLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-800 flex">
      {/* Desktop Sidebar */}
      <SimplifiedSidebar />

      {/* Mobile Navigation */}
      <SimplifiedMobileNav isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <SimplifiedHeader onMobileMenuToggle={() => setMobileMenuOpen(true)} />

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden">
          <div className="p-4 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
