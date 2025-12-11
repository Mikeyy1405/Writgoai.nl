/**
 * ADMIN NAVIGATION FOR WRITGO EIGENAAR
 * 
 * This configuration implements the full admin interface with ALL agency features:
 * - Klanten Management (lijst van alle klanten)
 * - Financieel Dashboard (MRR, kosten, winst, BTW)
 * - Projecten Overzicht (alle projecten van alle klanten)
 * - Content Distributie Center (alle content van alle klanten)
 * - Facturatie en Betalingen
 * - Statistieken en Rapportages
 * - Instellingen en Configuratie
 */

import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  DollarSign,
  Share2,
  Settings,
  BarChart3,
  Calendar,
  FileEdit,
  Link as LinkIcon,
  TrendingUp,
  Package,
  CreditCard,
  UserCheck,
  LucideIcon,
} from 'lucide-react';

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

export const adminNavSections: AdminNavSection[] = [
  {
    title: 'Overzicht',
    items: [
      {
        label: 'Dashboard',
        href: '/admin/dashboard',
        icon: LayoutDashboard,
        description: 'Hoofdoverzicht',
      },
    ],
  },
  {
    title: 'Klanten & Projecten',
    items: [
      {
        label: 'Klanten',
        href: '/admin/klanten',
        icon: Users,
        description: 'Alle klanten beheren',
      },
      {
        label: 'Projecten',
        href: '/admin/projects',
        icon: Briefcase,
        description: 'Alle projecten',
      },
      {
        label: 'Opdrachten',
        href: '/admin/assignments',
        icon: FileEdit,
        description: 'Contentopdrachten',
      },
      {
        label: 'Managed Projects',
        href: '/admin/managed-projects',
        icon: Package,
        description: 'Beheerde projecten',
      },
    ],
  },
  {
    title: 'Content & Distributie',
    items: [
      {
        label: 'Content Center',
        href: '/admin/content',
        icon: FileText,
        description: 'Alle content',
      },
      {
        label: 'Blog Management',
        href: '/admin/blog',
        icon: FileEdit,
        description: 'Blog artikelen',
      },
      {
        label: 'Distributie',
        href: '/admin/distribution',
        icon: Share2,
        description: 'Multi-platform posting',
      },
      {
        label: 'Platforms',
        href: '/admin/platforms',
        icon: Share2,
        description: 'Social media platforms',
      },
      {
        label: 'Linkbuilding',
        href: '/admin/linkbuilding',
        icon: LinkIcon,
        description: 'SEO linkbuilding',
      },
    ],
  },
  {
    title: 'Financieel',
    items: [
      {
        label: 'Financieel Dashboard',
        href: '/admin/financieel',
        icon: DollarSign,
        description: 'MRR, winst, kosten',
      },
      {
        label: 'Facturen',
        href: '/admin/invoices',
        icon: CreditCard,
        description: 'Facturatie',
      },
    ],
  },
  {
    title: 'Analytics & Rapportage',
    items: [
      {
        label: 'Statistieken',
        href: '/admin/statistieken',
        icon: TrendingUp,
        description: 'KPIs en metrics',
      },
      {
        label: 'Analytics',
        href: '/admin/distribution/analytics',
        icon: BarChart3,
        description: 'Content analytics',
      },
      {
        label: 'API Usage',
        href: '/admin/api-usage',
        icon: BarChart3,
        description: 'AI API verbruik',
      },
    ],
  },
  {
    title: 'Instellingen',
    items: [
      {
        label: 'Instellingen',
        href: '/admin/instellingen',
        icon: Settings,
        description: 'Systeem configuratie',
      },
      {
        label: 'Branding',
        href: '/admin/branding',
        icon: Settings,
        description: 'Brand settings',
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
