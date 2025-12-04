'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LucideIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from './logo';
import { isNavItemActive } from '@/lib/navigation-utils';
import { NavigationItem } from '@/lib/navigation-config';

interface SidebarProps {
  items: NavigationItem[];
  isAdmin?: boolean;
}

export function Sidebar({ items, isAdmin = false }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const visibleItems = items.filter(item => {
    if ('isDivider' in item && item.isDivider) {
      return !item.adminOnly || isAdmin;
    }
    return !item.adminOnly || isAdmin;
  });

  return (
    <aside
      className={`
        hidden lg:flex flex-col
        bg-zinc-900/50 backdrop-blur-xl border-r border-zinc-800/50
        min-h-screen sticky top-0
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800/50">
        <AnimatePresence mode="wait">
          {!isCollapsed ? (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Logo size="md" showText={true} />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <Logo size="md" showText={false} />
            </motion.div>
          )}
        </AnimatePresence>
        
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-zinc-800/50 text-zinc-400 hover:text-white transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {visibleItems.map((item, index) => {
          // Handle dividers
          if ('isDivider' in item && item.isDivider) {
            return (
              <div key={`divider-${index}`} className="my-4 pt-4">
                <AnimatePresence mode="wait">
                  {!isCollapsed ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`px-3 mb-2 ${item.adminOnly ? 'text-blue-400' : 'text-zinc-500'}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {item.label}
                        </span>
                        {item.adminOnly && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold">
                            Admin
                          </span>
                        )}
                      </div>
                      <div className="mt-2 border-t border-zinc-800" />
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-t border-zinc-800"
                    />
                  )}
                </AnimatePresence>
              </div>
            );
          }

          // After isDivider check, TypeScript knows this is a NavItem
          // But we need to explicitly help TypeScript understand this
          if (!('icon' in item) || !('href' in item)) {
            return null;
          }

          const Icon = item.icon;
          const active = isNavItemActive(item.href, pathname);
          const isAdminItem = item.adminOnly;
          const iconColor = active ? (isAdminItem ? 'text-blue-400' : 'text-[#FF9933]') : '';

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                group relative flex items-center gap-3 px-3 py-3 rounded-lg
                transition-all duration-200
                ${
                  active
                    ? isAdminItem
                      ? 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-gradient-to-r from-[#FF9933]/20 to-[#FFAD33]/20 text-[#FF9933] border border-[#FF9933]/30'
                    : isAdminItem
                    ? 'text-blue-300 hover:text-blue-100 hover:bg-blue-900/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }
              `}
            >
              {Icon && <Icon className={`w-5 h-5 shrink-0 ${iconColor}`} />}
              
              <AnimatePresence mode="wait">
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="font-medium text-sm truncate"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {!isCollapsed && item.badge && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isAdminItem 
                      ? 'bg-blue-500/20 text-blue-400' 
                      : 'bg-[#FF9933]/20 text-[#FF9933]'
                  }`}
                >
                  {item.badge}
                </motion.span>
              )}

              {/* Active indicator */}
              {active && (
                <motion.div
                  layoutId="activeTab"
                  className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full ${
                    isAdminItem ? 'bg-blue-400' : 'bg-[#FF9933]'
                  }`}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
