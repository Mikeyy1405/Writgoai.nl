
'use client';

import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, Users, BarChart3, Settings, LogOut, Plus } from 'lucide-react';
import Link from 'next/link';
import LanguageSwitcher from '@/components/language-switcher';
import { useLanguage } from '@/lib/i18n/context';

export function DashboardHeader() {
  const { data: session } = useSession() || {};
  const { t } = useLanguage();

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">W</span>
              </div>
              <span className="text-xl font-bold text-gray-700">Writgo Planning</span>
            </Link>

            <nav className="hidden md:flex space-x-6">
              <Link 
                href="/dashboard" 
                className="flex items-center space-x-2 text-gray-700 hover:text-writgo-orange transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                <span>{t('nav.dashboard')}</span>
              </Link>
              <Link 
                href="/tasks" 
                className="flex items-center space-x-2 text-gray-700 hover:text-writgo-orange transition-colors"
              >
                <Calendar className="w-4 h-4" />
                <span>{t('nav.tasks')}</span>
              </Link>
              <Link 
                href="/calendar" 
                className="flex items-center space-x-2 text-gray-700 hover:text-writgo-orange transition-colors"
              >
                <Calendar className="w-4 h-4" />
                <span>{t('nav.calendar')}</span>
              </Link>
              <Link 
                href="/writers" 
                className="flex items-center space-x-2 text-gray-700 hover:text-writgo-orange transition-colors"
              >
                <Users className="w-4 h-4" />
                <span>{t('nav.writers')}</span>
              </Link>
            </nav>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              {t('nav.newTask')}
            </Button>
            
            {/* Language Switcher */}
            <LanguageSwitcher />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-600 text-white">
                      {getInitials(session?.user?.name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium leading-none">{session?.user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session?.user?.email}
                  </p>
                </div>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>{t('nav.settings')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t('nav.logout')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
