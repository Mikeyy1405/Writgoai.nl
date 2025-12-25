'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import CreditBalance from './CreditBalance';
import Logo from './Logo';

interface MenuItem {
  icon: string;
  label: string;
  href: string;
  subItems?: { icon: string; label: string; href: string }[];
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: {
    id?: string;
    email?: string;
    user_metadata?: {
      name?: string;
    };
  };
  isAdmin?: boolean;
}

export default function DashboardLayout({ children, user, isAdmin = false }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [contentMenuOpen, setContentMenuOpen] = useState(false);
  const [mediaMenuOpen, setMediaMenuOpen] = useState(false);
  const [publishMenuOpen, setPublishMenuOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Listen for auth state changes and session expiration
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || (!session && event !== 'INITIAL_SESSION')) {
          router.push('/login');
        }

        // Refresh the page when token is refreshed to get updated user data
        if (event === 'TOKEN_REFRESHED') {
          router.refresh();
        }
      }
    );

    // Check session validity on mount and periodically
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      }
    };

    checkSession();
    const interval = setInterval(checkSession, 60000); // Check every minute

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [router]);

  const baseMenuItems: MenuItem[] = [
    { icon: '🏠', label: 'Dashboard', href: '/dashboard' },
    { icon: '📝', label: 'Projecten', href: '/dashboard/projects' },
    {
      icon: '✍️',
      label: 'Content',
      href: '/dashboard/content',
      subItems: [
        { icon: '📋', label: 'Content Plan', href: '/dashboard/content-plan' },
        { icon: '✍️', label: 'Content Writer', href: '/dashboard/writer' },
        { icon: '📰', label: 'News Writer', href: '/dashboard/news-writer' },
        { icon: '📑', label: 'Writgo Blog', href: '/dashboard/writgo-blog' },
        { icon: '🔗', label: 'Affiliate Opportunities', href: '/dashboard/affiliate-opportunities' },
      ],
    },
    {
      icon: '🎨',
      label: 'Media',
      href: '/dashboard/media',
      subItems: [
        { icon: '🎨', label: 'Image Studio', href: '/dashboard/image-studio' },
        { icon: '🎬', label: 'Video Studio', href: '/dashboard/video-studio' },
        { icon: '🖼️', label: 'Media Bibliotheek', href: '/dashboard/media-library' },
        { icon: '📚', label: 'Bibliotheek', href: '/dashboard/library' },
      ],
    },
    {
      icon: '🚀',
      label: 'Publishing',
      href: '/dashboard/publishing',
      subItems: [
        { icon: '🔄', label: 'WordPress Posts', href: '/dashboard/wordpress-posts' },
        { icon: '📱', label: 'Social Media', href: '/dashboard/social' },
      ],
    },
    { icon: '🤖', label: 'Autopilot', href: '/dashboard/writgo-autopilot' },
  ];

  // Admin menu with sub-items
  const adminMenuItem: MenuItem = {
    icon: '👑',
    label: 'Admin',
    href: '/dashboard/admin',
    subItems: [
      { icon: '👥', label: 'Gebruikers', href: '/dashboard/admin' },
    ],
  };

  // Add admin menu item if user is admin
  const menuItems: MenuItem[] = isAdmin
    ? [
        ...baseMenuItems,
        adminMenuItem,
        { icon: '⚙️', label: 'Instellingen', href: '/dashboard/settings' },
      ]
    : [
        ...baseMenuItems,
        { icon: '⚙️', label: 'Instellingen', href: '/dashboard/settings' },
      ];

  // Auto-expand menus based on current page
  useEffect(() => {
    if (pathname?.startsWith('/dashboard/admin')) {
      setAdminMenuOpen(true);
    }
    // Content menu
    if (pathname?.includes('/content-plan') ||
        pathname?.includes('/writer') ||
        pathname?.includes('/news-writer') ||
        pathname?.includes('/writgo-blog') ||
        pathname?.includes('/affiliate-opportunities')) {
      setContentMenuOpen(true);
    }
    // Media menu
    if (pathname?.includes('/image-studio') ||
        pathname?.includes('/video-studio') ||
        pathname?.includes('/media-library') ||
        pathname?.includes('/library')) {
      setMediaMenuOpen(true);
    }
    // Publishing menu
    if (pathname?.includes('/wordpress-posts') ||
        pathname?.includes('/social')) {
      setPublishMenuOpen(true);
    }
  }, [pathname]);

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
          <Logo size="sm" />
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
          <div className="hidden lg:flex items-center px-6 h-16 border-b border-gray-800">
            <Logo size="sm" />
          </div>

          {/* Menu Items */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto mt-16 lg:mt-0">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              const hasSubItems = item.subItems && item.subItems.length > 0;

              // Determine which menu state to use and if section is active
              let isMenuOpen = false;
              let isSectionActive = false;
              let toggleMenu = () => {};

              if (hasSubItems) {
                // Check if any subitem is active
                isSectionActive = item.subItems!.some(sub => pathname === sub.href);

                // Determine which menu this is and set appropriate state
                if (item.label === 'Content') {
                  isMenuOpen = contentMenuOpen;
                  toggleMenu = () => setContentMenuOpen(!contentMenuOpen);
                } else if (item.label === 'Media') {
                  isMenuOpen = mediaMenuOpen;
                  toggleMenu = () => setMediaMenuOpen(!mediaMenuOpen);
                } else if (item.label === 'Publishing') {
                  isMenuOpen = publishMenuOpen;
                  toggleMenu = () => setPublishMenuOpen(!publishMenuOpen);
                } else if (item.label === 'Admin') {
                  isMenuOpen = adminMenuOpen;
                  toggleMenu = () => setAdminMenuOpen(!adminMenuOpen);
                  isSectionActive = pathname?.startsWith('/dashboard/admin') || false;
                }
              }

              // Render item with sub-menu
              if (hasSubItems) {
                return (
                  <div key={item.label}>
                    <button
                      onClick={toggleMenu}
                      className={`
                        w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all
                        ${isSectionActive
                          ? 'bg-orange-500/20 text-orange-400'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        }
                      `}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{item.icon}</span>
                        <span className="font-medium">{item.label}</span>
                      </div>
                      <svg
                        className={`w-4 h-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {/* Sub Items */}
                    {isMenuOpen && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.subItems!.map((subItem) => {
                          const isSubActive = pathname === subItem.href;
                          return (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              onClick={() => setSidebarOpen(false)}
                              className={`
                                flex items-center space-x-3 px-4 py-2 rounded-lg transition-all text-sm
                                ${isSubActive
                                  ? 'bg-orange-500 text-white'
                                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                }
                              `}
                            >
                              <span className="text-lg">{subItem.icon}</span>
                              <span className="font-medium">{subItem.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              // Regular menu item
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
