/**
 * SIMPLIFIED CLIENT NAVIGATION
 * 
 * Vereenvoudigde navigatie voor client portal (/client/*)
 * Alleen de essentiële items voor clients
 */

import {
  LayoutDashboard,
  Calendar,
  Share2,
  User,
  LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
}

/**
 * Client navigatie items (4 hoofditems)
 */
export const clientNavItems: NavItem[] = [
  {
    label: 'Overzicht',
    href: '/client/overzicht',
    icon: LayoutDashboard,
    description: 'Je persoonlijke dashboard',
  },
  {
    label: 'Content',
    href: '/client/content',
    icon: Calendar,
    description: 'Content kalender en overzicht',
  },
  {
    label: 'Platforms',
    href: '/client/platforms',
    icon: Share2,
    description: 'Verbonden social media platforms',
  },
  {
    label: 'Account',
    href: '/client/account',
    icon: User,
    description: 'Account instellingen',
  },
];

/**
 * Get navigation items for client
 */
export function getClientNavItems(): NavItem[] {
  return clientNavItems;
}
