'use client';

import { useState } from 'react';
import { LucideIcon } from 'lucide-react';
import { Sidebar } from './sidebar';
import { DashboardHeader } from './header';
import { MobileNav } from './mobile-nav';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  adminOnly?: boolean;
}

interface UnifiedLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  isAdmin?: boolean;
  headerTitle?: string;
  headerDescription?: string;
}

export function UnifiedLayout({
  children,
  navItems,
  isAdmin = false,
  headerTitle,
  headerDescription,
}: UnifiedLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black flex">
      {/* Desktop Sidebar */}
      <Sidebar items={navItems} isAdmin={isAdmin} />

      {/* Mobile Navigation */}
      <MobileNav
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        items={navItems}
        isAdmin={isAdmin}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <DashboardHeader
          onMobileMenuToggle={() => setMobileMenuOpen(true)}
          title={headerTitle}
          description={headerDescription}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden">
          <div className="p-4 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
