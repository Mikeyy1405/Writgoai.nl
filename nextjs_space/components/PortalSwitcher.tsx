/**
 * PORTAL SWITCHER COMPONENT
 * 
 * Laat admin gebruikers switchen tussen Admin Portal en Client Portal
 * Alleen zichtbaar voor users met admin of superadmin role
 */

'use client';

import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LayoutDashboard, Users, ArrowLeftRight } from 'lucide-react';

export function PortalSwitcher() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  
  // Only show for admin/superadmin
  const userRole = session?.user?.role;
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';
  
  if (!isAdmin) {
    return null;
  }
  
  // Determine current portal
  const isInAdminPortal = pathname?.startsWith('/admin');
  const isInClientPortal = pathname?.startsWith('/client');
  
  const currentPortal = isInAdminPortal ? 'admin' : 'client';
  const currentPortalName = isInAdminPortal ? 'Admin Portal' : 'Client Portal';
  
  const handleSwitchPortal = (portal: 'admin' | 'client') => {
    if (portal === 'admin') {
      router.push('/admin/dashboard');
    } else {
      router.push('/client/overzicht');
    }
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="gap-2 border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white"
        >
          <ArrowLeftRight className="h-4 w-4" />
          <span className="hidden md:inline">{currentPortalName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800">
        <DropdownMenuLabel className="text-zinc-400 text-xs font-normal">
          Switch Portal
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-zinc-800" />
        
        <DropdownMenuItem
          onClick={() => handleSwitchPortal('admin')}
          disabled={currentPortal === 'admin'}
          className="gap-2 cursor-pointer text-white hover:bg-zinc-800 focus:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LayoutDashboard className="h-4 w-4" />
          <div>
            <div className="font-medium">Admin Portal</div>
            <div className="text-xs text-zinc-500">Beheer klanten, content & meer</div>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => handleSwitchPortal('client')}
          disabled={currentPortal === 'client'}
          className="gap-2 cursor-pointer text-white hover:bg-zinc-800 focus:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Users className="h-4 w-4" />
          <div>
            <div className="font-medium">Client Portal</div>
            <div className="text-xs text-zinc-500">Test de client ervaring</div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
