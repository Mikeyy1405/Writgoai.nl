'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import CreditBalance from './CreditBalance';

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: {
    id?: string;
    email?: string;
    user_metadata?: {
      name?: string;
    };
  };
}

export default function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    { icon: '🏠', label: 'Dashboard', href: '/dashboard' },
    { icon: '📝', label: 'Projecten', href: '/dashboard/projects' },
    { icon: '📋', label: 'Content Plan', href: '/dashboard/content-plan' },
    { icon: '✍️', label: 'Content Writer', href: '/dashboard/writer' },
    { icon: '📝', label: 'Editor', href: '/dashboard/editor' },
    { icon: '📑', label: 'Writgo Blog', href: '/dashboard/writgo-blog' },
    { icon: '🔄', label: 'WordPress Posts', href: '/dashboard/wordpress-posts' },
    { icon: '📚', label: 'Bibliotheek', href: '/dashboard/library' },
    { icon: '📱', label: 'Social Media', href: '/dashboard/social' },
    { icon: '⚙️', label: 'Instellingen', href: '/dashboard/settings' },
  ];

  const handleLogout = async () => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/api/auth/signout';
    document.body.appendChild(form);
    form.submit();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg"></div>
            <span className="text-xl font-bold text-white">WritGo AI</span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-white p-2"
          >
            {sidebarOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen w-64 bg-black/50 backdrop-blur-sm border-r border-gray-800
          transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="hidden lg:flex items-center space-x-2 px-6 h-16 border-b border-gray-800">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg"></div>
            <span className="text-xl font-bold text-white">WritGo AI</span>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto mt-16 lg:mt-0">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-lg transition-all
                    ${isActive 
                      ? 'bg-orange-500 text-white' 
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }
                  `}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Credit Balance */}
          <div className="px-4">
            {user.id && <CreditBalance userId={user.id} />}
          </div>

          {/* User Section */}
          <div className="border-t border-gray-800 p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                {user.user_metadata?.name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {user.user_metadata?.name || user.email || 'User'}
                </div>
                <div className="text-xs text-gray-400 truncate">{user.email || ''}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
            >
              Uitloggen
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
