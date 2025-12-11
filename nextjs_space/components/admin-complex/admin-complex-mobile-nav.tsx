'use client';

import { X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { adminNavSections, isAdminNavActive } from '@/lib/admin-navigation-config';
import { Logo } from '../dashboard/logo';

interface AdminComplexMobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminComplexMobileNav({ isOpen, onClose }: AdminComplexMobileNavProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed left-0 top-0 bottom-0 w-80 bg-gray-900 z-50 lg:hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <Logo size="md" showText={true} />
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500 text-white uppercase">Admin</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
              {adminNavSections.map((section) => (
                <div key={section.title}>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-4">
                    {section.title}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active = isAdminNavActive(item.href, pathname);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={onClose}
                          className={`
                            flex items-center gap-3 px-4 py-2 rounded-lg
                            transition-all duration-200
                            ${
                              active
                                ? 'bg-gradient-to-r from-red-500/10 to-orange-500/10 text-red-400 font-medium'
                                : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800/50'
                            }
                          `}
                        >
                          <Icon className={`w-5 h-5 ${active ? 'text-red-400' : ''}`} />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{item.label}</div>
                            {item.description && (
                              <div className="text-xs text-gray-500 truncate">{item.description}</div>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-800">
              <div className="p-3 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-medium text-gray-100">Admin Mode</span>
                </div>
                <p className="text-[10px] text-gray-400">
                  Volledige toegang tot alle klanten, projecten en financiële data
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
