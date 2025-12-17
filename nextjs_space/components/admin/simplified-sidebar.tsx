'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '../dashboard/logo';
import { simplifiedNavItems, isSimplifiedNavActive } from '@/lib/simplified-navigation-config';

export function SimplifiedSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={`
        hidden lg:flex flex-col
        bg-slate-900 border-r border-slate-700
        min-h-screen sticky top-0
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
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
          className="p-2 rounded-lg hover:bg-slate-800/50 text-gray-600 hover:text-slate-300 transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-2">
        {simplifiedNavItems.map((item) => {
          const Icon = item.icon;
          const active = isSimplifiedNavActive(item.href, pathname);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                group relative flex items-center gap-3 px-4 py-3 rounded-xl
                transition-all duration-200
                ${
                  active
                    ? 'bg-gradient-to-r from-[#FF9933]/10 to-[#FFAD33]/10 text-[#FF9933] font-medium shadow-sm'
                    : 'text-gray-600 hover:text-slate-300 hover:bg-slate-800'
                }
              `}
            >
              <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-[#FF9933]' : ''}`} />
              
              <AnimatePresence mode="wait">
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 text-left"
                  >
                    <div className="font-medium text-sm">{item.label}</div>
                    {!active && (
                      <div className="text-xs text-gray-400 mt-0.5">{item.description}</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Active indicator */}
              {active && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-[#FF9933]"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      {!isCollapsed && (
        <div className="p-4 border-t border-slate-700">
          <div className="p-3 bg-gradient-to-br from-[#FF9933]/10 to-[#FFAD33]/10 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-slate-300">Systeem actief</span>
            </div>
            <p className="text-[10px] text-gray-500">
              Content wordt automatisch gegenereerd en gepost op al je verbonden platforms
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
