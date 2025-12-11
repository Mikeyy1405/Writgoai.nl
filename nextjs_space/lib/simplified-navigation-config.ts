/**
 * SIMPLIFIED NAVIGATION FOR WRITGO.NL
 * 
 * This configuration implements the new UX design with only 4 main pages:
 * 1. OVERZICHT (Overview/Dashboard) - System status, activity feed, platforms
 * 2. PLATFORMS - Social media platform management (THE KEY USP!)
 * 3. CONTENT - Calendar view of scheduled/published content
 * 4. ACCOUNT - Package, payments, profile, support
 * 
 * Design Principles:
 * - Extreme simplicity (understand in 5 minutes)
 * - Zero-touch autonomy (system works for you)
 * - Platform flexibility is central (client chooses platforms)
 * - Show system activity, not tasks
 * - Mobile-first responsive
 */

import {
  LayoutDashboard,
  Share2,
  Calendar,
  User,
  LucideIcon,
} from 'lucide-react';

export interface SimplifiedNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
}

export const simplifiedNavItems: SimplifiedNavItem[] = [
  {
    label: 'Overzicht',
    href: '/admin/overzicht',
    icon: LayoutDashboard,
    description: 'Systeemstatus en activiteit',
  },
  {
    label: 'Platforms',
    href: '/admin/platforms',
    icon: Share2,
    description: 'Verbind je social media',
  },
  {
    label: 'Content',
    href: '/admin/content',
    icon: Calendar,
    description: 'Geplande en gepubliceerde content',
  },
  {
    label: 'Account',
    href: '/admin/account',
    icon: User,
    description: 'Pakket, betalingen en instellingen',
  },
];

/**
 * Helper function to check if navigation item is active
 */
export function isSimplifiedNavActive(href: string, pathname: string): boolean {
  // For exact matches
  if (href === pathname) return true;
  
  // For /admin/overzicht, also match /admin and /admin/
  if (href === '/admin/overzicht' && (pathname === '/admin' || pathname === '/admin/')) {
    return true;
  }
  
  // For other paths, check if pathname starts with href
  if (href !== '/admin/overzicht' && pathname.startsWith(href)) {
    return true;
  }
  
  return false;
}
