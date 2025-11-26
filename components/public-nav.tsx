
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Menu, X, LogIn, BookOpen, Users, Mail, Home, LayoutDashboard } from 'lucide-react';
import Image from 'next/image';
import LanguageSwitcher from '@/components/language-switcher';
import { useLanguage } from '@/lib/i18n/context';

export default function PublicNav() {
  const { data: session } = useSession() || {};
  const { t } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { href: '/', label: t('nav.home'), icon: Home },
    { href: '/blog', label: t('nav.blog'), icon: BookOpen },
    { href: '/over-ons', label: t('nav.about'), icon: Users },
    { href: '/contact', label: t('nav.contact'), icon: Mail },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-gray-900/95 backdrop-blur-md border-b border-blue-500/20 shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24 sm:h-28 md:h-32">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative w-80 h-20 sm:w-96 sm:h-24 md:w-[28rem] md:h-28">
              <Image
                src="/writgo-media-logo.png"
                alt="Writgo Media Logo"
                fill
                className="object-contain transition-transform group-hover:scale-105"
                priority
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive(item.href)
                      ? 'bg-gradient-to-r from-blue-500 to-orange-500 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            {session ? (
              <Link href="/client-portal">
                <Button className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg shadow-blue-500/30">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  {t('nav.dashboard')}
                </Button>
              </Link>
            ) : (
              <Link href="/inloggen">
                <Button className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg shadow-blue-500/30">
                  <LogIn className="w-4 h-4 mr-2" />
                  {t('nav.login')}
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800/50 transition-colors"
            aria-label="Menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-gray-900/98 backdrop-blur-md border-t border-blue-500/20">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-all ${
                    isActive(item.href)
                      ? 'bg-gradient-to-r from-blue-500 to-orange-500 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <div className="pt-2 space-y-2">
              <div className="flex justify-center">
                <LanguageSwitcher />
              </div>
              {session ? (
                <Link href="/client-portal" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-orange-500 hover:from-orange-600 hover:to-orange-700 text-white font-semibold">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    {t('nav.dashboard')}
                  </Button>
                </Link>
              ) : (
                <Link href="/inloggen" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-orange-500 hover:from-orange-600 hover:to-orange-700 text-white font-semibold">
                    <LogIn className="w-4 h-4 mr-2" />
                    {t('nav.login')}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
