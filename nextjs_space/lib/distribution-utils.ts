/**
 * Distribution Center Utility Functions
 */

import * as Icons from 'lucide-react';

/**
 * Get icon component from icon string name
 * Converts kebab-case to PascalCase and returns the corresponding Lucide icon
 * Falls back to Share2 if icon is not found
 */
export function getIconComponent(iconName: string): React.ComponentType<any> {
  const pascalCase = iconName
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  return (Icons as any)[pascalCase] || Icons.Share2;
}
