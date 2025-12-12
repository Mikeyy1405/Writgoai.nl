/**
 * VEREENVOUDIGDE ADMIN NAVIGATIE
 * 
 * Van 19+ menu items naar 8-10 essentiële items
 * Focus op core business: klanten, content, distributie, financieel
 * 
 * WIJZIGINGEN:
 * ✅ Dashboard - Behouden
 * ✅ Klanten - Behouden
 * ✅ Content - Behouden (blog management)
 * ✅ Distributie - Behouden
 * ✅ Financieel - Behouden (dashboard + facturen samengevoegd)
 * ✅ Analytics - Behouden
 * ⚠️ Email - Optioneel (kan verborgen worden)
 * ❌ Writgo Marketing - Verwijderd (experimenteel)
 * ❌ SEO & Linkbuilding - Verwijderd (te complex)
 * ❌ Content Analytics - Verwijderd (samengevoegd met Analytics)
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
 * VEREENVOUDIGDE NAVIGATIE STRUCTUUR
 * 
 * Slechts 8-10 items voor maximale duidelijkheid
 */
export const simplifiedAdminNavSections: AdminNavSection[] = [
  // ========================================
  // SECTIE 1: OVERZICHT (1 item)
  // ========================================
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
  
  // ========================================
  // SECTIE 2: KLANTEN (1 item)
  // ========================================
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
  
  // ========================================
  // SECTIE 3: CONTENT & DISTRIBUTIE (2 items)
  // ========================================
  {
    title: 'Content & Social Media',
    items: [
      {
        label: 'Blog Management',
        href: '/admin/blog',
        icon: FileText,
        description: 'Blog posts voor klanten en WritGo.nl',
      },
      {
        label: 'Social Media',
        href: '/admin/distribution',
        icon: Share2,
        description: 'Planning en distributie',
      },
    ],
  },
  
  // ========================================
  // SECTIE 4: FINANCIEEL (2 items)
  // ========================================
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
  
  // ========================================
  // SECTIE 5: ANALYTICS (1 item)
  // ========================================
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
  
  // ========================================
  // SECTIE 6: EMAIL (optioneel - 1 item)
  // ========================================
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
  
  // ========================================
  // SECTIE 7: INSTELLINGEN (1 item)
  // ========================================
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
export const allSimplifiedAdminNavItems: AdminNavItem[] = simplifiedAdminNavSections.reduce(
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

/**
 * Count total navigation items
 */
export function getNavigationItemCount(): number {
  return allSimplifiedAdminNavItems.length;
}
