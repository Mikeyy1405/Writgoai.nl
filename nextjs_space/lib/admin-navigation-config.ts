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
      { label: 'Facturen', href: '/admin/invoices', icon: Receipt },
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
