'use client';

import { useSession, signOut } from 'next-auth/react';
import { Menu, Bell, User, LogOut, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SimplifiedHeaderProps {
  onMobileMenuToggle: () => void;
}

export function SimplifiedHeader({ onMobileMenuToggle }: SimplifiedHeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 backdrop-blur-sm bg-white/95">
      <div className="flex items-center justify-between h-16 px-4 lg:px-8">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-gray-600"
          onClick={onMobileMenuToggle}
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Left side - empty for now, can add breadcrumbs later if needed */}
        <div className="flex-1" />

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {/* Help Button */}
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-600 hover:text-gray-700 hover:bg-gray-100"
          >
            <HelpCircle className="w-5 h-5" />
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-600 hover:text-gray-700 hover:bg-gray-100 relative"
          >
            <Bell className="w-5 h-5" />
            {/* Notification dot - hide for now */}
            {/* <span className="absolute top-2 right-2 w-2 h-2 bg-[#FF9933] rounded-full" /> */}
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 text-gray-700 hover:text-gray-700 hover:bg-gray-100"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-[#FF9933] to-[#FFAD33] text-white text-sm font-medium">
                  {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="hidden md:block text-sm font-medium">
                  {session?.user?.name || 'Gebruiker'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white border-gray-200">
              <DropdownMenuLabel className="text-gray-700">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{session?.user?.name || 'Gebruiker'}</span>
                  <span className="text-xs text-gray-500">{session?.user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-200" />
              <DropdownMenuItem 
                className="text-gray-700 focus:bg-gray-100 focus:text-gray-700 cursor-pointer"
                onClick={() => window.location.href = '/admin/account'}
              >
                <User className="w-4 h-4 mr-2" />
                Account instellingen
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-gray-700 focus:bg-gray-100 focus:text-gray-700 cursor-pointer"
                onClick={() => window.location.href = '/admin/account?tab=support'}
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                Help & Support
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-200" />
              <DropdownMenuItem
                className="text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer"
                onClick={() => signOut({ callbackUrl: '/client-login' })}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Uitloggen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
