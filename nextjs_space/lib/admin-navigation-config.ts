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
  LucideIcon,
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
 * VEREENVOUDIGDE ADMIN NAVIGATIE
 * Van 19+ items naar 8-10 essentiële items
 */
export const adminNavSections: AdminNavSection[] = [
  // ======================================
  // SECTIE 1: OVERZICHT (1 item)
  // ======================================
  {
    title: 'Overzicht',
    items: [
      {
        label: 'Dashboard',
        href: '/admin/dashboard',
        icon: LayoutDashboard,
        description: 'MRR, klanten, content overzicht',
      },
    ],
  },
  
  // ======================================
  // SECTIE 2: KLANTEN (1 item)
  // ======================================
  {
    title: 'Klanten',
    items: [
      {
        label: 'Klanten Beheer',
        href: '/admin/klanten',
        icon: Users,
        description: 'Alle klanten beheren',
      },
    ],
  },
  
  // ======================================
  // SECTIE 3: CONTENT & SOCIAL MEDIA (2 items)
  // ======================================
  {
    title: 'Content & Social Media',
    items: [
      {
        label: 'Blog Management',
        href: '/admin/blog',
        icon: FileText,
        description: 'Blog posts voor klanten',
      },
      {
        label: 'Social Media',
        href: '/admin/social',
        icon: Share2,
        description: 'Social media strategie & content',
      },
    ],
  },
  
  // ======================================
  // SECTIE 4: FINANCIEEL (2 items)
  // ======================================
  {
    title: 'Financieel',
    items: [
      {
        label: 'Overzicht',
        href: '/admin/financieel',
        icon: DollarSign,
        description: 'MRR, winst, kosten',
      },
      {
        label: 'Facturen',
        href: '/admin/invoices',
        icon: DollarSign,
        description: 'Facturatie',
      },
    ],
  },
  
  // ======================================
  // SECTIE 5: STATISTIEKEN (1 item)
  // ======================================
  {
    title: 'Statistieken',
    items: [
      {
        label: 'Analytics',
        href: '/admin/statistieken',
        icon: BarChart3,
        description: 'KPIs en performance',
      },
    ],
  },
  
  // ======================================
  // SECTIE 6: EMAIL (optioneel - 1 item)
  // ======================================
  ...(isFeatureEnabled('ADMIN_EMAIL_INBOX') ? [{
    title: 'Email',
    items: [
      {
        label: 'Email Manager',
        href: '/admin/email/inbox',
        icon: Mail,
        description: 'Inbox met AI features',
      },
    ],
  }] : []),
  
  // ======================================
  // SECTIE 7: INSTELLINGEN (1 item)
  // ======================================
  {
    title: 'Instellingen',
    items: [
      {
        label: 'Instellingen',
        href: '/admin/instellingen',
        icon: Settings,
        description: 'Systeem configuratie',
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
  
  // For /admin/dashboard, also match /admin and /admin/
  if (href === '/admin/dashboard' && (pathname === '/admin' || pathname === '/admin/')) {
    return true;
  }
  
  // For other paths, check if pathname starts with href
  if (href !== '/admin/dashboard' && pathname.startsWith(href)) {
    return true;
  }
  
  return false;
}
