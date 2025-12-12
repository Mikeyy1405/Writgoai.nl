/**
 * CLIENT NAVIGATION CONFIG - SIMPLIFIED DASHBOARD
 * 
 * ✅ NIEUWE VEREENVOUDIGDE CLIENT INTERFACE: Slechts 4 hoofditems
 * 
 * Deze configuratie vervangt de oude client portal (/client-portal) met een
 * nieuwe, simpele dashboard (/dashboard) die perfect past bij de doelgroep:
 * lokale dienstverleners die geen technische kennis hebben.
 * 
 * OUDE PORTAL: 20+ menu items (❌ te complex)
 * NIEUWE DASHBOARD: 4 menu items (✅ perfect)
 */

import {
  LayoutDashboard,
  Share2,
  Calendar,
  User,
  LucideIcon,
} from 'lucide-react';

export interface ClientNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
}

/**
 * VEREENVOUDIGDE CLIENT NAVIGATIE
 * Slechts 4 items voor maximale duidelijkheid
 */
export const clientNavItems: ClientNavItem[] = [
  {
    label: 'Overzicht',
    href: '/dashboard/overzicht',
    icon: LayoutDashboard,
    description: 'Systeemstatus en activiteit',
  },
  {
    label: 'Platforms',
    href: '/dashboard/platforms',
    icon: Share2,
    description: 'Verbind je social media',
  },
  {
    label: 'Content',
    href: '/dashboard/content',
    icon: Calendar,
    description: 'Geplande en gepubliceerde content',
  },
  {
    label: 'Account',
    href: '/dashboard/account',
    icon: User,
    description: 'Pakket, betalingen en instellingen',
  },
];

/**
 * Helper function to check if navigation item is active
 */
export function isClientNavActive(href: string, pathname: string): boolean {
  // For exact matches
  if (href === pathname) return true;
  
  // For /dashboard/overzicht, also match /dashboard and /dashboard/
  if (href === '/dashboard/overzicht' && (pathname === '/dashboard' || pathname === '/dashboard/')) {
    return true;
  }
  
  // For other paths, check if pathname starts with href
  if (href !== '/dashboard/overzicht' && pathname.startsWith(href)) {
    return true;
  }
  
  return false;
}

/**
 * Get navigation item by href
 */
export function getClientNavItem(href: string): ClientNavItem | undefined {
  return clientNavItems.find(item => item.href === href);
}
