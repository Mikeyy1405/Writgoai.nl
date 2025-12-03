'use client';

import { signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, LogOut, Settings, User, Menu } from 'lucide-react';
import Link from 'next/link';

interface DashboardHeaderProps {
  onMobileMenuToggle?: () => void;
  title?: string;
  description?: string;
}

export function DashboardHeader({
  onMobileMenuToggle,
  title,
  description,
}: DashboardHeaderProps) {
  const { data: session } = useSession();

  return (
    <div className="sticky top-0 z-40 bg-black/50 backdrop-blur-xl border-b border-zinc-800/50">
      <div className="flex items-center justify-between px-4 lg:px-6 py-3">
        {/* Left: Mobile menu + Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-zinc-800/50 text-zinc-400 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {title && (
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-white">{title}</h1>
              {description && (
                <p className="text-xs text-zinc-400 mt-0.5">{description}</p>
              )}
            </div>
          )}
        </div>

        {/* Right: User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 text-zinc-300 hover:text-white hover:bg-zinc-800/50"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-[#FF9933] to-[#FFAD33] rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {session?.user?.name?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-medium text-zinc-50">
                  {session?.user?.name || 'User'}
                </div>
                <div className="text-xs text-zinc-400">
                  {session?.user?.email || ''}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 bg-zinc-900/95 backdrop-blur-xl border-zinc-800"
          >
            <DropdownMenuItem asChild>
              <Link
                href="/client-portal/account"
                className="cursor-pointer text-zinc-300 hover:text-white flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Mijn Account
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/client-portal/account"
                className="cursor-pointer text-zinc-300 hover:text-white flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Instellingen
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: '/inloggen' })}
              className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-950/50 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Uitloggen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
