'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { LogOut, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminNavSections, isAdminNavActive } from '@/lib/admin-navigation-config';

interface AdminMobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminMobileNav({ isOpen, onClose }: AdminMobileNavProps) {
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
            className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-80 bg-gray-900 border-r border-gray-800 overflow-y-auto flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <Link href="/admin/dashboard" onClick={onClose} className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-orange-500" />
                <div>
                  <span className="text-2xl font-bold text-white">WritGo</span>
                  <p className="text-xs text-gray-400 mt-0.5">Content Platform</p>
                </div>
              </Link>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 p-4 overflow-y-auto">
              {adminNavSections.map((section, sectionIndex) => (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: sectionIndex * 0.1 }}
                  className="mb-6"
                >
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
                    {section.title}
                  </h3>
                  <ul className="space-y-1">
                    {section.items.map((item, itemIndex) => {
                      const Icon = item.icon;
                      const isActive = isAdminNavActive(item.href, pathname);
                      
                      return (
                        <motion.li
                          key={item.href}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: (sectionIndex * 0.1) + (itemIndex * 0.05) }}
                        >
                          <Link
                            href={item.href}
                            onClick={onClose}
                            className={`
                              flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                              ${isActive 
                                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/50' 
                                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                              }
                            `}
                            title={item.description}
                          >
                            <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-sm block truncate">{item.label}</span>
                              {item.description && !isActive && (
                                <span className="text-xs text-gray-500 block truncate">{item.description}</span>
                              )}
                            </div>
                            {item.badge && (
                              <span className="px-2 py-0.5 text-xs font-semibold bg-orange-500 text-white rounded-full">
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        </motion.li>
                      );
                    })}
                  </ul>
                </motion.div>
              ))}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-gray-800">
              <button
                onClick={() => {
                  onClose();
                  signOut({ callbackUrl: '/client-login' });
                }}
                className="flex items-center gap-3 px-3 py-2.5 text-red-400 hover:bg-gray-800 hover:text-red-300 rounded-lg transition-all duration-200 w-full"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium text-sm">Uitloggen</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
