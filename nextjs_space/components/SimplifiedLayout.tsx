'use client';

import { ReactNode, useState } from 'react';
import SimplifiedNavigation from './SimplifiedNavigation';
import { Menu, X } from 'lucide-react';

interface SimplifiedLayoutProps {
  children: ReactNode;
}

/**
 * SUPER SIMPELE LAYOUT met RESPONSIVE DESIGN
 * 
 * - Navigatie links (fixed op desktop, slide-in op mobiel)
 * - Content rechts
 * - Hamburger menu op mobiel
 * - Dark theme met oranje accenten
 */
export default function SimplifiedLayout({ children }: SimplifiedLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Mobile Header - alleen zichtbaar op mobiel */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">W</span>
            </div>
            <h1 className="text-lg font-bold text-white">WritGo</h1>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-white hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Overlay voor mobiel menu */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <SimplifiedNavigation 
        isMobileMenuOpen={mobileMenuOpen} 
        closeMobileMenu={() => setMobileMenuOpen(false)} 
      />
      
      {/* Main Content */}
      <main className="md:ml-64 pt-16 md:pt-0 p-4 md:p-8 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
