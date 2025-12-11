'use client';

import { X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { dashboardNavItems, isDashboardNavActive } from '@/lib/dashboard-navigation-config';
import { Logo } from '../dashboard/logo';

interface DashboardMobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DashboardMobileNav({ isOpen, onClose }: DashboardMobileNavProps) {
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
            className="fixed left-0 top-0 bottom-0 w-72 bg-white z-50 lg:hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <Logo size="md" showText={true} />
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
              {dashboardNavItems.map((item) => {
                const Icon = item.icon;
                const active = isDashboardNavActive(item.href, pathname);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl
                      transition-all duration-200
                      ${
                        active
                          ? 'bg-gradient-to-r from-[#FF9933]/10 to-[#FFAD33]/10 text-[#FF9933] font-medium'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 ${active ? 'text-[#FF9933]' : ''}`} />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.label}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{item.description}</div>
                    </div>
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200">
              <div className="p-3 bg-gradient-to-br from-[#FF9933]/10 to-[#FFAD33]/10 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-medium text-gray-700">Systeem actief</span>
                </div>
                <p className="text-[10px] text-gray-500">
                  Content wordt automatisch gegenereerd en gepost op al je verbonden platforms
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
