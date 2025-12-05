import {
  LayoutDashboard,
  PenTool,
  Video,
  Share2,
  Image,
  Wand2,
  Search,
  Map,
  Library,
  Plus,
  FolderKanban,
  Receipt,
  Users,
  ClipboardList,
  FileText,
  Bot,
  Settings,
  LucideIcon,
  Globe,
  Mail,
  Zap,
  Key,
  CreditCard,
  User,
  List,
  Send,
  Inbox,
  Mailbox,
  Calendar,
  Link,
  DollarSign,
  Package,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  adminOnly?: boolean;
  items?: NavItem[]; // For suite sub-items
}

export interface SuiteItem {
  isSuite: true;
  label: string;
  icon: LucideIcon;
  items: NavItem[];
  adminOnly?: boolean;
}

export interface DividerItem {
  isDivider: true;
  label: string;
  adminOnly?: boolean;
}

export type NavigationItem = NavItem | SuiteItem | DividerItem;

// Base navigation items (voor IEDEREEN - zowel Client als Admin)
export const baseNavItems: NavigationItem[] = [
  // Dashboard
  { label: 'Dashboard', href: '/client-portal', icon: LayoutDashboard },
  
  // Content Hub - Simplified single entry point
  { label: 'Content Hub', href: '/client-portal/content-hub', icon: Globe },
  
  // Social Media Suite - Single unified page
  { label: 'Social Media Suite', href: '/client-portal/social-media-suite', icon: Share2 },
  
  // SUITE 3: Email Marketing Suite
  {
    isSuite: true,
    label: 'Email Marketing Suite',
    icon: Mail,
    items: [
      { label: 'Suite Overzicht', href: '/client/email', icon: LayoutDashboard },
      { label: 'Campagnes', href: '/client/email?tab=campaigns', icon: Send },
      { label: 'Email Lijsten', href: '/client/email?tab=lists', icon: List },
      { label: 'AI Inbox', href: '/client/email?tab=inbox', icon: Inbox },
      { label: 'Mailbox Koppelingen', href: '/client/email?tab=mailbox', icon: Mailbox },
      { label: 'Automations', href: '/client/email?tab=settings', icon: Zap },
    ],
  },
  
  // SUITE 4: Video & Afbeelding Suite
  {
    isSuite: true,
    label: 'Video & Afbeelding Suite',
    icon: Video,
    items: [
      { label: 'Suite Overzicht', href: '/client/media', icon: LayoutDashboard },
      { label: 'Video Generator', href: '/client-portal/video-generator', icon: Video, badge: 'Pro' },
      { label: 'Afbeelding Generator', href: '/client-portal/image-specialist', icon: Image },
      { label: 'Media Library', href: '/client-portal/content-library?type=media', icon: Library },
      { label: 'Autopilot Mode', href: '/client-portal/video-generator?mode=autopilot', icon: Zap, badge: 'Auto' },
    ],
  },
  
  // SUITE 5: Instellingen
  {
    isSuite: true,
    label: 'Instellingen',
    icon: Settings,
    items: [
      { label: 'Account', href: '/client/settings', icon: User },
      { label: 'API Keys', href: '/client/settings?tab=api', icon: Key },
      { label: 'Billing', href: '/client/settings?tab=billing', icon: CreditCard },
    ],
  },
];

// Extra Admin items (alleen voor ADMIN)
export const adminOnlyItems: NavigationItem[] = [
  // DIVIDER: Admin
  { isDivider: true, label: 'Admin', adminOnly: true },
  
  // 📊 Dashboard
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, adminOnly: true },
  
  // 👥 Klanten
  { label: 'Klanten', href: '/admin/clients', icon: Users, adminOnly: true },
  
  // 📦 Opdrachten
  { label: 'Opdrachten', href: '/admin/assignments', icon: Package, adminOnly: true },
  
  // 💰 Financieel
  {
    isSuite: true,
    label: 'Financieel',
    icon: DollarSign,
    adminOnly: true,
    items: [
      { label: 'Facturen', href: '/admin/invoices', icon: Receipt, adminOnly: true },
      { label: 'Affiliate Payouts', href: '/admin/affiliate-payouts', icon: CreditCard, adminOnly: true },
    ],
  },
  
  // 📝 Content
  {
    isSuite: true,
    label: 'Content',
    icon: FileText,
    adminOnly: true,
    items: [
      { label: 'Blog CMS', href: '/admin/blog', icon: FileText, adminOnly: true },
      { label: 'Content Hub', href: '/dashboard/content-hub', icon: FolderKanban, adminOnly: true },
      { label: 'AI Agent', href: '/dashboard/agent', icon: Bot, adminOnly: true },
    ],
  },
  
  // ⚙️ Instellingen
  { label: 'Instellingen', href: '/admin/settings', icon: Settings, adminOnly: true },
];

// Functie om de juiste navigatie items te krijgen op basis van admin status
export const getNavItems = (isAdmin: boolean): NavigationItem[] => {
  if (isAdmin) {
    return [...baseNavItems, ...adminOnlyItems];
  }
  return baseNavItems;
};

// Admin check helper
export const isUserAdmin = (email?: string | null, role?: string | null): boolean => {
  return email === 'info@writgo.nl' || role === 'admin';
};

// Type guard for NavItem
export const isNavItem = (item: NavigationItem): item is NavItem => {
  return !('isDivider' in item) && !('isSuite' in item);
};

// Type guard for SuiteItem
export const isSuiteItem = (item: NavigationItem): item is SuiteItem => {
  return 'isSuite' in item && item.isSuite === true;
};
