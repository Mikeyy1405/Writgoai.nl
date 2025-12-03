'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LucideIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from './logo';
import { isNavItemActive } from '@/lib/navigation-utils';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  adminOnly?: boolean;
}

interface SidebarProps {
  items: NavItem[];
  isAdmin?: boolean;
}

export function Sidebar({ items, isAdmin = false }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const visibleItems = items.filter(item => !item.adminOnly || isAdmin);

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
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = isNavItemActive(item.href, pathname);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                group relative flex items-center gap-3 px-3 py-3 rounded-lg
                transition-all duration-200
                ${
                  active
                    ? 'bg-gradient-to-r from-[#FF9933]/20 to-[#FFAD33]/20 text-[#FF9933] border border-[#FF9933]/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }
              `}
            >
              <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-[#FF9933]' : ''}`} />
              
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
                  className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF9933]/20 text-[#FF9933]"
                >
                  {item.badge}
                </motion.span>
              )}

              {/* Active indicator */}
              {active && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#FF9933] rounded-r-full"
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
