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
  BarChart3,
  Repeat,
  ShoppingCart,
  Landmark,
  Calculator,
  FileBarChart,
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
 */
export const adminNavItems: AdminNavigationItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Klanten', href: '/admin/clients', icon: Users },
  { label: 'Opdrachten', href: '/admin/assignments', icon: Package },
  { label: 'Projecten', href: '/admin/projects', icon: FolderKanban },
  {
    label: 'Financieel',
    icon: DollarSign,
    items: [
      { label: 'Dashboard', href: '/admin/financien', icon: BarChart3 },
      { label: 'Contacten', href: '/admin/financien/contacten', icon: Users },
      { label: 'Facturen', href: '/admin/financien/facturen', icon: Receipt },
      { label: 'Abonnementen', href: '/admin/financien/abonnementen', icon: Repeat },
      { label: 'Uitgaven', href: '/admin/financien/uitgaven', icon: ShoppingCart },
      { label: 'Bank', href: '/admin/financien/bank', icon: Landmark },
      { label: 'BTW', href: '/admin/financien/btw', icon: Calculator },
      { label: 'Rapporten', href: '/admin/financien/rapporten', icon: FileBarChart },
      { label: 'Oude Facturen', href: '/admin/invoices', icon: Receipt },
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
  { label: 'Instellingen', href: '/admin/settings', icon: Settings },
];

/**
 * Type guard to check if an item is a navigation group
 */
export function isAdminNavGroup(item: AdminNavigationItem): item is AdminNavGroup {
  return 'items' in item;
}
