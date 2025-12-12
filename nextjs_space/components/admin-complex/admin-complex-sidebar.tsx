'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '../dashboard/logo';
import ProjectSwitcher from '@/components/project/ProjectSwitcher';
import { adminNavSections, isAdminNavActive } from '@/lib/admin-navigation-config';

interface AdminComplexSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function AdminComplexSidebar({ isCollapsed, onToggleCollapse }: AdminComplexSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`
        hidden lg:flex flex-col
        bg-gray-900 border-r border-gray-800
        min-h-screen sticky top-0
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-20' : 'w-72'}
      `}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-800">
        <AnimatePresence mode="wait">
          {!isCollapsed ? (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <Logo size="sm" showText={true} />
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500 text-white uppercase">Admin</span>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <Logo size="sm" showText={false} />
            </motion.div>
          )}
        </AnimatePresence>
        
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-gray-100 transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Project Switcher */}
      {!isCollapsed && (
        <div className="px-4 py-3 border-b border-gray-800">
          <ProjectSwitcher />
        </div>
      )}

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {adminNavSections.map((section) => (
          <div key={section.title}>
            {!isCollapsed && (
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-4">
                {section.title}
              </h3>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isAdminNavActive(item.href, pathname);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      group relative flex items-center gap-3 px-4 py-2 rounded-lg
                      transition-all duration-200
                      ${
                        active
                          ? 'bg-gradient-to-r from-[#FF9933]/20 to-red-500/20 text-[#FF9933] font-medium shadow-sm'
                          : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
                      }
                    `}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-[#FF9933]' : ''}`} />
                    
                    <AnimatePresence mode="wait">
                      {!isCollapsed && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                          className="flex-1 text-left min-w-0"
                        >
                          <div className="font-medium text-sm truncate">{item.label}</div>
                          {item.description && !active && (
                            <div className="text-xs text-gray-500 truncate">{item.description}</div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Active indicator */}
                    {active && (
                      <motion.div
                        layoutId="activeAdminTab"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-[#FF9933]"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Info */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-800">
          <div className="p-3 bg-gradient-to-br from-[#FF9933]/10 to-red-500/10 border border-[#FF9933]/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-[#FF9933] animate-pulse" />
              <span className="text-xs font-medium text-gray-300">Admin Mode</span>
            </div>
            <p className="text-[10px] text-gray-500">
              Volledige toegang tot alle klanten, projecten en financiële data
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
