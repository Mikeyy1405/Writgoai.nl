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
  
  // SUITE 1: Website Content Suite
  {
    isSuite: true,
    label: 'Website Content Suite',
    icon: Globe,
    items: [
      { label: 'Suite Overzicht', href: '/client/website', icon: LayoutDashboard },
      { label: 'Blog Generator', href: '/client-portal/blog-generator', icon: PenTool },
      { label: 'SEO & Zoekwoorden', href: '/client-portal/zoekwoord-onderzoek', icon: Search },
      { label: 'Topical Mapping', href: '/client-portal/site-planner', icon: Map },
      { label: 'WordPress Sites', href: '/dashboard/content-hub', icon: Globe },
      { label: 'Autopilot Mode', href: '/client-portal/blog-generator?mode=autopilot', icon: Zap, badge: 'Auto' },
    ],
  },
  
  // SUITE 2: Social Media Suite
  {
    isSuite: true,
    label: 'Social Media Suite',
    icon: Share2,
    items: [
      { label: 'Suite Overzicht', href: '/client/social', icon: LayoutDashboard },
      { label: 'Post Generator', href: '/client-portal/social-media', icon: Share2 },
      { label: 'Content Planner', href: '/client-portal/content-library', icon: Calendar },
      { label: 'Platform Koppelingen', href: '/client-portal/social-media?tab=connections', icon: Link },
      { label: 'Autopilot Mode', href: '/client-portal/social-media?mode=autopilot', icon: Zap, badge: 'Auto' },
    ],
  },
  
  // SUITE 3: Email Marketing Suite
  {
    isSuite: true,
    label: 'Email Marketing Suite',
    icon: Mail,
    items: [
      { label: 'Suite Overzicht', href: '/client/email', icon: LayoutDashboard },
      { label: 'Email Generator', href: '/client/email?tab=campaigns', icon: Send },
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
  
  { label: 'Klanten Beheer', href: '/admin/clients', icon: Users, adminOnly: true },
  { label: 'Alle Opdrachten', href: '/admin/assignments', icon: ClipboardList, adminOnly: true },
  { label: 'Facturen Beheer', href: '/admin/invoices', icon: Receipt, adminOnly: true },
  { label: 'Blog CMS', href: '/admin/blog', icon: FileText, adminOnly: true },
  { label: 'Content Hub', href: '/dashboard/content-hub', icon: FolderKanban, adminOnly: true },
  { label: 'AI Agent', href: '/dashboard/agent', icon: Bot, adminOnly: true },
  { label: 'Admin Instellingen', href: '/admin/settings', icon: Settings, adminOnly: true },
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
