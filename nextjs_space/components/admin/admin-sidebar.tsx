'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminNavItems, isAdminNavGroup, type AdminNavItem } from '@/lib/admin-navigation-config';

export function AdminSidebar() {
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: boolean }>({
    'Financieel': false,
    'Content': false,
  });

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  const isGroupActive = (items: AdminNavItem[]) => {
    return items.some((item) => isActive(item.href));
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-black border-r border-zinc-800 min-h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-zinc-800">
        <h1 className="text-xl font-bold text-white">
          <span className="text-[#FF6B35]">WritGo</span> Admin
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {adminNavItems.map((item, index) => {
          // Check if it's a group
          if (isAdminNavGroup(item)) {
            const Icon = item.icon;
            const isExpanded = expandedGroups[item.label];
            const hasActiveItem = isGroupActive(item.items);

            return (
              <div key={`group-${index}`} className="space-y-1">
                <button
                  onClick={() => toggleGroup(item.label)}
                  className={`
                    w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg
                    transition-colors duration-200
                    ${
                      hasActiveItem
                        ? 'bg-[#FF6B35]/10 text-[#FF6B35] border-l-4 border-[#FF6B35]'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span className="font-medium text-sm">{item.label}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="ml-4 space-y-1 overflow-hidden"
                    >
                      {item.items.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const active = isActive(subItem.href);

                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={`
                              flex items-center gap-3 px-3 py-2 rounded-lg
                              transition-colors duration-200
                              ${
                                active
                                  ? 'bg-[#FF6B35]/10 text-[#FF6B35]'
                                  : 'text-zinc-500 hover:text-white hover:bg-zinc-900'
                              }
                            `}
                          >
                            <SubIcon className="w-4 h-4" />
                            <span className="text-sm">{subItem.label}</span>
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }

          // Regular nav item
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg
                transition-colors duration-200
                ${
                  active
                    ? 'bg-[#FF6B35]/10 text-[#FF6B35] border-l-4 border-[#FF6B35]'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Link to Client Portal */}
      <div className="p-4 border-t border-zinc-800">
        <Link
          href="/client-portal"
          className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
        >
          <span className="text-sm">Naar Client Portal</span>
          <ExternalLink className="w-4 h-4" />
        </Link>
      </div>
    </aside>
  );
}
