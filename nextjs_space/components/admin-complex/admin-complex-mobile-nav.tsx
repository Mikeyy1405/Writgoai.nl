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
            className="fixed left-0 top-0 bottom-0 w-80 bg-white z-50 lg:hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Logo size="md" showText={true} />
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500 text-white uppercase">Admin</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
              {adminNavSections.map((section) => (
                <div key={section.title}>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-4">
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
                                ? 'bg-gradient-to-r from-red-50 to-orange-50 text-red-600 font-medium'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }
                          `}
                        >
                          <Icon className={`w-5 h-5 ${active ? 'text-red-600' : ''}`} />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{item.label}</div>
                            {item.description && (
                              <div className="text-xs text-gray-400 truncate">{item.description}</div>
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
            <div className="p-4 border-t border-gray-200">
              <div className="p-3 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-medium text-gray-700">Admin Mode</span>
                </div>
                <p className="text-[10px] text-gray-500">
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
