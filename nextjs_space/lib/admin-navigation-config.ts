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
  Mail,
  Inbox,
  Sparkles,
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
    title: 'Klanten & Content',
    items: [
      {
        label: 'Klanten',
        href: '/admin/klanten',
        icon: Users,
        description: 'Alle klanten beheren',
      },
      // NOTE: "Projecten" item removed (see INVISIBLE PROJECT LAYER ARCHITECTURE above)
    ],
  },
  {
    title: 'Content & Distributie',
    items: [
      {
        label: 'Content Overzicht',
        href: '/admin/content',
        icon: FileText,
        description: 'Alle content & blogs',
      },
      {
        label: 'Distributie',
        href: '/admin/distribution',
        icon: Share2,
        description: 'Social media distributie',
      },
      {
        label: 'SEO & Linkbuilding',
        href: '/admin/seo',
        icon: LinkIcon,
        description: 'SEO optimalisatie',
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
        label: 'Content Analytics',
        href: '/admin/distribution/analytics',
        icon: BarChart3,
        description: 'Content performance',
      },
    ],
  },
  {
    title: 'Email',
    items: [
      {
        label: 'Inbox',
        href: '/admin/email/inbox',
        icon: Inbox,
        description: 'Email inbox',
      },
      {
        label: 'Concepten',
        href: '/admin/email/drafts',
        icon: FileEdit,
        description: 'Opgeslagen email concepten',
      },
      {
        label: 'Instellingen',
        href: '/admin/email/instellingen',
        icon: Settings,
        description: 'Email configuratie',
      },
    ],
  },
  {
    title: 'Writgo Marketing',
    items: [
      {
        label: 'Marketing Dashboard',
        href: '/admin/writgo-marketing',
        icon: Sparkles,
        description: 'Eigen marketing beheren',
      },
      {
        label: 'Content Plan',
        href: '/admin/writgo-marketing/content-plan',
        icon: Calendar,
        description: 'Content planning genereren',
      },
      {
        label: 'Social Accounts',
        href: '/admin/writgo-marketing/social',
        icon: Share2,
        description: 'Social media koppelen',
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
