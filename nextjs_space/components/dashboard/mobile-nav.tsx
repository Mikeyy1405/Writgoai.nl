'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LucideIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from './logo';
import { isNavItemActive } from '@/lib/navigation-utils';
import { NavigationItem } from '@/lib/navigation-config';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  items: NavigationItem[];
  isAdmin?: boolean;
}

export function MobileNav({ isOpen, onClose, items, isAdmin = false }: MobileNavProps) {
  const pathname = usePathname();
  const visibleItems = items.filter(item => {
    if ('isDivider' in item && item.isDivider) {
      return !item.adminOnly || isAdmin;
    }
    return !item.adminOnly || isAdmin;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Mobile Menu */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-80 bg-zinc-900/95 backdrop-blur-xl border-r border-zinc-800/50 overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800/50">
              <Logo size="md" showText={true} />
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-zinc-800/50 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Items */}
            <nav className="p-3 space-y-1">
              {visibleItems.map((item, index) => {
                // Handle dividers
                if ('isDivider' in item && item.isDivider) {
                  return (
                    <div key={`divider-${index}`} className="my-4 pt-4">
                      <div className={`px-4 mb-2 ${item.adminOnly ? 'text-blue-400' : 'text-zinc-500'}`}>
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
                      </div>
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
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={`
                        group relative flex items-center gap-3 px-4 py-3 rounded-lg
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
                      <span className="font-medium text-sm">{item.label}</span>
                      
                      {item.badge && (
                        <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isAdminItem 
                            ? 'bg-blue-500/20 text-blue-400' 
                            : 'bg-[#FF9933]/20 text-[#FF9933]'
                        }`}>
                          {item.badge}
                        </span>
                      )}

                      {/* Active indicator */}
                      {active && (
                        <motion.div
                          layoutId="activeMobileTab"
                          className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full ${
                            isAdminItem ? 'bg-blue-400' : 'bg-[#FF9933]'
                          }`}
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
