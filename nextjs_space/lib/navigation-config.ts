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
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  adminOnly?: boolean;
}

export interface DividerItem {
  isDivider: true;
  label: string;
  adminOnly?: boolean;
}

export type NavigationItem = NavItem | DividerItem;

// Base navigation items (voor IEDEREEN - zowel Client als Admin)
export const baseNavItems: NavigationItem[] = [
  // Dashboard
  { label: 'Dashboard', href: '/client-portal', icon: LayoutDashboard },
  
  // DIVIDER: Content Maken
  { isDivider: true, label: 'Content Maken' },
  
  // AI Tools - Zelf Doen
  { label: 'Blog Generator', href: '/client-portal/blog-generator', icon: PenTool },
  { label: 'Video Generator', href: '/client-portal/video-generator', icon: Video, badge: 'Pro' },
  { label: 'Social Media', href: '/client-portal/social-media', icon: Share2 },
  { label: 'Afbeelding Generator', href: '/client-portal/image-specialist', icon: Image },
  { label: 'Content Generator', href: '/client-portal/content-generator', icon: Wand2 },
  
  // DIVIDER: Tools
  { isDivider: true, label: 'Tools' },
  
  { label: 'Zoekwoord Onderzoek', href: '/client-portal/zoekwoord-onderzoek', icon: Search, badge: 'Nieuw' },
  { label: 'Site Planner', href: '/client-portal/site-planner', icon: Map },
  { label: 'Content Library', href: '/client-portal/content-library', icon: Library },
  
  // DIVIDER: Opdrachten
  { isDivider: true, label: 'Mijn Opdrachten' },
  
  { label: 'Nieuw Verzoek', href: '/client-portal/nieuw-verzoek', icon: Plus },
  { label: 'Mijn Opdrachten', href: '/client-portal/opdrachten', icon: FolderKanban },
  { label: 'Mijn Facturen', href: '/client-portal/facturen', icon: Receipt },
];

// Extra Admin items (alleen voor ADMIN)
export const adminOnlyItems: NavigationItem[] = [
  // DIVIDER: Admin
  { isDivider: true, label: 'Admin', adminOnly: true },
  
  { label: 'Klanten Beheer', href: '/dashboard/agency/clients', icon: Users, adminOnly: true },
  { label: 'Alle Opdrachten', href: '/dashboard/agency/assignments', icon: ClipboardList, adminOnly: true },
  { label: 'Facturen Beheer', href: '/dashboard/agency/invoices', icon: Receipt, adminOnly: true },
  { label: 'Blog CMS', href: '/dashboard/agency/blog', icon: FileText, adminOnly: true },
  { label: 'Content Hub', href: '/dashboard/content-hub', icon: FolderKanban, adminOnly: true },
  { label: 'AI Agent', href: '/dashboard/agent', icon: Bot, adminOnly: true },
  { label: 'Instellingen', href: '/dashboard/agency/settings', icon: Settings, adminOnly: true },
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
