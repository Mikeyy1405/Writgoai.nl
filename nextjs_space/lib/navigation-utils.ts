/**
 * Check if a navigation item is active based on the current pathname
 */
export function isNavItemActive(href: string, pathname: string | null): boolean {
  if (!pathname) return false;
  
  // For dashboard/portal home routes, exact match only
  if (href === '/client-portal' || href === '/admin') {
    return pathname === href;
  }
  
  // For all other routes, check if pathname starts with href
  return pathname.startsWith(href);
}
