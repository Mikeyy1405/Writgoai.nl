/**
 * WRITGO.NL ROUTING CONFIGURATION
 * 
 * Duidelijke routing structuur voor WritgoAI:
 * 
 * ## ADMIN ROUTES (/admin/*)
 * Voor admin functies: content management, klanten, financiën, statistieken
 * 
 * ## CLIENT ROUTES (/client/*)
 * Voor client portal: overzicht, content, platforms, account
 * 
 * ## ROLE-BASED ACCESS
 * - Admin/Superadmin: Toegang tot /admin/* én /client/*
 * - Client: Alleen toegang tot /client/*
 */

import {
  LayoutDashboard,
  FileText,
  Share2,
  Globe,
  User,
  Users,
  DollarSign,
  BarChart3,
  Settings,
  LucideIcon,
  Mail,
  Package,
  Calendar,
} from 'lucide-react';

export interface RouteItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  adminOnly?: boolean;
}

export interface RouteCategory {
  category: string;
  routes: RouteItem[];
}

// ============================================
// ADMIN ROUTES
// ============================================
export const adminRoutes: RouteCategory[] = [
  {
    category: 'Dashboard',
    routes: [
      {
        label: 'Dashboard',
        href: '/admin/dashboard',
        icon: LayoutDashboard,
        description: 'Overzicht MRR, klanten en statistieken',
      },
    ],
  },
  {
    category: 'Klantbeheer',
    routes: [
      {
        label: 'Klanten',
        href: '/admin/klanten',
        icon: Users,
        description: 'Beheer klanten en hun projecten',
      },
    ],
  },
  {
    category: 'Content',
    routes: [
      {
        label: 'Content Overzicht',
        href: '/admin/content',
        icon: FileText,
        description: 'Alle content van alle klanten',
      },
      {
        label: 'Distributie',
        href: '/admin/distributie',
        icon: Share2,
        description: 'Social media distributie beheer',
      },
      {
        label: 'Blog CMS',
        href: '/admin/blog',
        icon: Globe,
        description: 'WritGo.nl blog management',
      },
    ],
  },
  {
    category: 'Financieel',
    routes: [
      {
        label: 'Financieel Dashboard',
        href: '/admin/financieel',
        icon: DollarSign,
        description: 'MRR, omzet en betalingen',
      },
      {
        label: 'Facturen',
        href: '/admin/facturen',
        icon: Package,
        description: 'Beheer facturen',
      },
    ],
  },
  {
    category: 'Statistieken & Instellingen',
    routes: [
      {
        label: 'Statistieken',
        href: '/admin/statistieken',
        icon: BarChart3,
        description: 'Analytics en rapportages',
      },
      {
        label: 'Email Inbox',
        href: '/admin/email-inbox',
        icon: Mail,
        description: 'AI-powered email inbox',
      },
      {
        label: 'Instellingen',
        href: '/admin/instellingen',
        icon: Settings,
        description: 'Systeem configuratie',
      },
    ],
  },
];

// ============================================
// CLIENT ROUTES
// ============================================
export const clientRoutes: RouteCategory[] = [
  {
    category: 'Dashboard',
    routes: [
      {
        label: 'Overzicht',
        href: '/client/overzicht',
        icon: LayoutDashboard,
        description: 'Je persoonlijke dashboard',
      },
    ],
  },
  {
    category: 'Content',
    routes: [
      {
        label: 'Content Kalender',
        href: '/client/content',
        icon: Calendar,
        description: 'Bekijk en beheer je content',
      },
      {
        label: 'Platforms',
        href: '/client/platforms',
        icon: Share2,
        description: 'Verbonden social media platforms',
      },
    ],
  },
  {
    category: 'Account',
    routes: [
      {
        label: 'Account Instellingen',
        href: '/client/account',
        icon: User,
        description: 'Profiel en voorkeuren',
      },
    ],
  },
];

// ============================================
// LEGACY ROUTE MAPPING
// ============================================
/**
 * Map oude routes naar nieuwe routes
 * Gebruikt in middleware voor redirects
 */
export const legacyRouteMap: Record<string, string> = {
  // Dashboard → Client
  '/dashboard': '/client/overzicht',
  '/dashboard/overzicht': '/client/overzicht',
  '/dashboard/content': '/client/content',
  '/dashboard/platforms': '/client/platforms',
  '/dashboard/account': '/client/account',
  
  // Client Portal → Client
  '/client-portal': '/client/overzicht',
  '/client-portal/dashboard': '/client/overzicht',
  '/client-portal/overzicht': '/client/overzicht',
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get routes for a specific role
 */
export function getRoutesForRole(role: 'admin' | 'superadmin' | 'client'): RouteCategory[] {
  if (role === 'admin' || role === 'superadmin') {
    // Admins hebben toegang tot beide
    return [...adminRoutes, ...clientRoutes];
  }
  
  // Clients hebben alleen toegang tot client routes
  return clientRoutes;
}

/**
 * Check if a path is an admin route
 */
export function isAdminRoute(path: string): boolean {
  return path.startsWith('/admin') || 
         path.startsWith('/superadmin') || 
         path.startsWith('/admin-portal');
}

/**
 * Check if a path is a client route
 */
export function isClientRoute(path: string): boolean {
  return path.startsWith('/client');
}

/**
 * Check if a path is a legacy route that should be redirected
 */
export function isLegacyRoute(path: string): boolean {
  return path.startsWith('/dashboard') || 
         path.startsWith('/client-portal');
}

/**
 * Get new path for legacy route
 */
export function getLegacyRedirect(path: string): string | null {
  // Check exact match first
  if (legacyRouteMap[path]) {
    return legacyRouteMap[path];
  }
  
  // Check prefix matches
  for (const [oldPath, newPath] of Object.entries(legacyRouteMap)) {
    if (path.startsWith(oldPath + '/')) {
      // Replace the old prefix with new one, keeping the rest of the path
      return path.replace(oldPath, newPath);
    }
  }
  
  // Default redirects for unmatched paths
  if (path.startsWith('/dashboard')) {
    return '/client/overzicht';
  }
  if (path.startsWith('/client-portal')) {
    return '/client/overzicht';
  }
  
  return null;
}

/**
 * Get default route for role
 */
export function getDefaultRouteForRole(role: 'admin' | 'superadmin' | 'client'): string {
  if (role === 'admin' || role === 'superadmin') {
    return '/admin/dashboard';
  }
  return '/client/overzicht';
}
