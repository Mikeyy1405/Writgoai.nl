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
  PlaySquare,
  Share2,
  Send,
  Calendar,
  Megaphone,
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
 * Alle financiële data komt uit Moneybird
 */
export const adminNavItems: AdminNavigationItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Klanten', href: '/admin/klanten', icon: Users },
  { label: 'Opdrachten', href: '/admin/orders', icon: Package },
  // NOTE: "Projecten" removed - in Writgo's simplified model, each client has ONE invisible default project
  // The project layer exists in the backend but is hidden from the admin UI
  // All project settings are now managed through the "Klanten" (clients) interface
  {
    label: 'Content',
    icon: FileText,
    items: [
      { label: 'Blog Posts', href: '/admin/blog', icon: FileText },
      { label: '🚀 1-Klik Generator', href: '/admin/blog/auto-generate', icon: Sparkles },
      { label: 'Autopilot', href: '/admin/autopilot-control', icon: PlaySquare },
    ],
  },
  {
    label: 'Distributie',
    icon: Share2,
    items: [
      { label: 'Dashboard', href: '/admin/distribution', icon: LayoutDashboard },
      { label: 'Wachtrij', href: '/admin/distribution/queue', icon: Send },
      { label: 'Kalender', href: '/admin/distribution/calendar', icon: Calendar },
      { label: 'Platforms', href: '/admin/distribution/platforms', icon: Megaphone },
      { label: 'Analytics', href: '/admin/distribution/analytics', icon: FileBarChart },
    ],
  },
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
    ],
  },
  { label: 'Email Inbox', href: '/admin/emails', icon: Mail },
  { label: 'Branding', href: '/admin/branding', icon: Palette },
  { label: 'Instellingen', href: '/admin/instellingen', icon: Settings },
];

/**
 * Type guard to check if an item is a navigation group
 */
export function isAdminNavGroup(item: AdminNavigationItem): item is AdminNavGroup {
  return 'items' in item;
}
