'use client';

import { useState } from 'react';
import { AdminComplexSidebar } from './admin-complex-sidebar';
import { AdminComplexHeader } from './admin-complex-header';
import { AdminComplexMobileNav } from './admin-complex-mobile-nav';

interface AdminComplexLayoutProps {
  children: React.ReactNode;
}

export function AdminComplexLayout({ children }: AdminComplexLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Desktop Sidebar */}
      <AdminComplexSidebar 
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Mobile Navigation */}
      <AdminComplexMobileNav isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <AdminComplexHeader onMobileMenuToggle={() => setMobileMenuOpen(true)} />

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden">
          <div className="p-4 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
