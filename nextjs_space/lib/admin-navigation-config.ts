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
 * ULTRA-VEREENVOUDIGDE ADMIN NAVIGATIE
 * Focus op multi-project content management voor 200 websites
 */
export const adminNavSections: AdminNavSection[] = [
  // ======================================
  // HOOFDNAVIGATIE (4 items)
  // ======================================
  {
    title: 'Hoofdmenu',
    items: [
      {
        label: 'Dashboard',
        href: '/admin',
        icon: LayoutDashboard,
        description: 'Overzicht',
      },
      {
        label: 'Projecten',
        href: '/admin/projects',
        icon: Globe,
        description: '200 websites beheren',
      },
      {
        label: 'Content',
        href: '/admin/content',
        icon: FileText,
        description: 'Blog & Social posts maken',
      },
      {
        label: 'Gepubliceerd',
        href: '/admin/published',
        icon: Share2,
        description: 'Gepubliceerde content',
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
