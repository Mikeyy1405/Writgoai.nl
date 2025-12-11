import {
  LayoutDashboard,
  Users,
  Package,
  FolderKanban,
  DollarSign,
  Receipt,
  CreditCard,
  FileText,
  Mail,
  Settings,
  Repeat,
  ShoppingCart,
  Landmark,
  Calculator,
  FileBarChart,
  Palette,
  Sparkles,
  Calendar,
  Share2,
} from 'lucide-react';

export interface AdminNavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface AdminNavGroup {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: AdminNavItem[];
}

export type AdminNavigationItem = AdminNavItem | AdminNavGroup;

/**
 * Admin-only navigation items
 * This configuration is used by both desktop and mobile admin navigation
 * Dashboard is now linked to Moneybird financien dashboard
 */
export const adminNavItems: AdminNavigationItem[] = [
  { label: 'Dashboard', href: '/admin/financien', icon: LayoutDashboard },
  { label: 'Klanten', href: '/admin/financien/contacten', icon: Users },
  { label: 'Opdrachten', href: '/admin/assignments', icon: Package },
  { label: 'Projecten', href: '/admin/projects', icon: FolderKanban },
  {
    label: 'Financieel',
    icon: DollarSign,
    items: [
      { label: 'Facturen', href: '/admin/financien/facturen', icon: Receipt },
      { label: 'Abonnementen', href: '/admin/financien/abonnementen', icon: Repeat },
      { label: 'Uitgaven', href: '/admin/financien/uitgaven', icon: ShoppingCart },
      { label: 'Bank', href: '/admin/financien/bank', icon: Landmark },
      { label: 'BTW', href: '/admin/financien/btw', icon: Calculator },
      { label: 'Rapporten', href: '/admin/financien/rapporten', icon: FileBarChart },
      { label: 'Affiliate Payouts', href: '/admin/affiliate-payouts', icon: CreditCard },
    ],
  },
  {
    label: 'Content',
    icon: FileText,
    items: [
      { label: 'Blog CMS', href: '/admin/blog', icon: FileText },
      { label: 'Email Manager', href: '/admin/emails', icon: Mail },
    ],
  },
  {
    label: 'Writgo Marketing',
    icon: Sparkles,
    items: [
      { label: 'Marketing Dashboard', href: '/admin/writgo-marketing', icon: Sparkles },
      { label: 'Content Plan', href: '/admin/writgo-marketing/content-plan', icon: Calendar },
      { label: 'Social Accounts', href: '/admin/writgo-marketing/social', icon: Share2 },
    ],
  },
  { label: 'Branding', href: '/admin/branding', icon: Palette },
  { label: 'Instellingen', href: '/admin/settings', icon: Settings },
];

/**
 * Type guard to check if an item is a navigation group
 */
export function isAdminNavGroup(item: AdminNavigationItem): item is AdminNavGroup {
  return 'items' in item;
}
