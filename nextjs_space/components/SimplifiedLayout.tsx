'use client';

import { ReactNode } from 'react';
import SimplifiedNavigation from './SimplifiedNavigation';

interface SimplifiedLayoutProps {
  children: ReactNode;
}

/**
 * SUPER SIMPELE LAYOUT
 * 
 * - Navigatie links
 * - Content rechts
 * - That's it!
 */
export default function SimplifiedLayout({ children }: SimplifiedLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <SimplifiedNavigation />
      
      {/* Main Content */}
      <main className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
