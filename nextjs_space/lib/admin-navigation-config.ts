/**
 * ADMIN NAVIGATION CONFIG - SIMPLIFIED VERSION
 * 
 * ✅ VEREENVOUDIGING UITGEVOERD: Van 19+ items naar 8-10 items
 * 
 * Deze configuratie implementeert een vereenvoudigde admin interface met focus op:
 * - Klanten Management (lijst van alle klanten)
 * - Content & Social Media (blog + distributie)
 * - Financieel Dashboard (MRR, facturen)
 * - Statistieken en Analytics
 * - Instellingen
 * 
 * VERWIJDERD/VERBORGEN:
 * ❌ SEO & Linkbuilding (te complex, niet core dienst)
 * ❌ Content Analytics (samengevoegd met Statistieken)
 * ❌ Writgo Marketing (experimenteel, niet essentieel)
 * ❌ Email sectie details (vereenvoudigd naar 1 item)
 * ❌ Projecten (invisible layer architectuur)
 */

import {
  LayoutDashboard,
  Users,
  FileText,
  Share2,
  DollarSign,
  BarChart3,
  Mail,
  Settings,
  Globe,
  LucideIcon,
  FolderKanban,
  Calendar,
  Receipt,
  Repeat,
  CreditCard,
} from 'lucide-react';
import { isFeatureEnabled } from './feature-flags';

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  badge?: string;
}

export interface AdminNavSection {
  title: string;
  items: AdminNavItem[];
}

/**
 * INVISIBLE PROJECT LAYER ARCHITECTURE
 * 
 * In Writgo's simplified business model, each client has ONE default project
 * that is automatically created and managed behind the scenes.
 * 
 * The "Projecten" navigation item has been removed from the admin UI because:
 * - Each client = one project (1:1 mapping)
 * - Project settings are now managed through the "Klanten" interface
 * - Simplifies the admin experience and eliminates redundant pages
 * - The project layer still exists in the backend for data organization
 */

/**
 * ADMIN NAVIGATIE - IDENTIEK AAN CLIENT + ADMIN ITEMS
 * Client items eerst, daarna admin-specifieke items
 */
export const adminNavSections: AdminNavSection[] = [
  // ======================================
  // CLIENT NAVIGATIE (basis items)
  // ======================================
  {
    title: 'Content Platform',
    items: [
      {
        label: 'Dashboard',
        href: '/admin/dashboard',
        icon: LayoutDashboard,
        description: 'Overzicht',
      },
      {
        label: 'Mijn Projecten',
        href: '/admin/projects',
        icon: FolderKanban,
        description: 'Websites beheren',
      },
      {
        label: 'Blog Content',
        href: '/admin/blog',
        icon: FileText,
        description: 'Blogs & artikelen',
      },
      {
        label: 'Social Media',
        href: '/admin/social',
        icon: Share2,
        description: 'Social posts',
      },
      {
        label: 'Content Kalender',
        href: '/admin/kalender',
        icon: Calendar,
        description: 'Planning overzicht',
      },
      {
        label: 'Instellingen',
        href: '/admin/settings',
        icon: Settings,
        description: 'Account & voorkeuren',
      },
    ],
  },
  // ======================================
  // ADMIN SPECIFIEKE ITEMS
  // ======================================
  {
    title: 'Admin',
    items: [
      {
        label: 'Klanten',
        href: '/admin/clients',
        icon: Users,
        description: 'Klantenbeheer',
      },
      {
        label: 'Email Manager',
        href: '/admin/emails',
        icon: Mail,
        description: 'Email beheer',
      },
    ],
  },
  {
    title: 'Financieel',
    items: [
      {
        label: 'Facturen',
        href: '/admin/financien/facturen',
        icon: Receipt,
        description: 'Facturen overzicht',
      },
      {
        label: 'Abonnementen',
        href: '/admin/financien/abonnementen',
        icon: Repeat,
        description: 'Abonnementen',
      },
      {
        label: 'Affiliate Payouts',
        href: '/admin/affiliate-payouts',
        icon: CreditCard,
        description: 'Uitbetalingen',
      },
    ],
  },
];

/**
 * Flatten all nav items for easy lookup
 */
export const allAdminNavItems: AdminNavItem[] = adminNavSections.reduce(
  (acc, section) => [...acc, ...section.items],
  [] as AdminNavItem[]
);

/**
 * Helper function to check if navigation item is active
 */
export function isAdminNavActive(href: string, pathname: string): boolean {
  // For exact matches
  if (href === pathname) return true;
  
  // For /admin root, also match /admin/
  if (href === '/admin' && pathname === '/admin/') {
    return true;
  }
  
  // For other paths, check if pathname starts with href
  if (href !== '/admin' && pathname.startsWith(href)) {
    return true;
  }
  
  return false;
}
