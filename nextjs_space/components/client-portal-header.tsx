
'use client';

import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Settings, 
  LogOut, 
  Shield, 
  Menu, 
  X,
  Home,
  Wand2,
  FileText,
  Map,
  Library,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { BrandLogo } from '@/components/brand/brand-logo';

export function ClientPortalHeader() {
  const { data: session } = useSession() || {};
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = () => {
    signOut({ callbackUrl: '/client-login' });
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isSuperAdmin = session?.user?.email === 'info@writgo.nl';

  const navItems = [
    { href: '/client-portal', label: 'Dashboard', icon: Home },
    { href: '/client-portal/auto-writer', label: 'Auto Writer', icon: Wand2, badge: 'NEW' },
    { href: '/client-portal/topical-mapping', label: 'Topical Map', icon: Map },
    { href: '/client-portal/blog-generator', label: 'Writer', icon: FileText },
    { href: '/client-portal/content-library', label: 'Library', icon: Library },
  ];

  return (
    <>
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/client-portal" className="flex items-center">
              <BrandLogo variant="full" size="md" showTagline={false} />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button 
                    variant="ghost" 
                    className="text-gray-300 hover:text-white hover:bg-gray-800 relative"
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.label}
                    {item.badge && (
                      <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                        {item.badge}
                      </span>
                    )}
                  </Button>
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              {/* Admin Button - Only for info@writgo.nl */}
              {isSuperAdmin && (
                <Link href="/admin">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Admin</span>
                  </Button>
                </Link>
              )}

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden text-gray-300"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
                        {getInitials(session?.user?.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-gray-900 border-gray-800" align="end">
                  <div className="flex flex-col space-y-1 p-3 border-b border-gray-800">
                    <p className="text-sm font-medium text-white">{session?.user?.name}</p>
                    <p className="text-xs text-gray-400">
                      {session?.user?.email}
                    </p>
                  </div>
                  
                  {isSuperAdmin && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center cursor-pointer text-purple-400 hover:text-purple-300">
                          <Shield className="mr-2 h-4 w-4" />
                          <span>Admin Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-gray-800" />
                    </>
                  )}
                  
                  <DropdownMenuItem asChild>
                    <Link href="/client-portal/settings" className="flex items-center cursor-pointer text-gray-300 hover:text-white">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Instellingen</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleSignOut}
                    className="text-gray-300 hover:text-white cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Uitloggen</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-gray-900 border-b border-gray-800">
          <nav className="px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white transition-colors">
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                      {item.badge}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
