'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { 
  LayoutDashboard, 
  FolderKanban, 
  FileText, 
  Share2,
  Calendar,
  Settings,
  LogOut,
  Sparkles,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NavItem {
  href: string;
  label: string;
  icon: any;
  description?: string;
}

interface ClientMobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ClientMobileNav({ isOpen, onClose }: ClientMobileNavProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { 
      href: '/dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard,
      description: 'Overzicht' 
    },
    { 
      href: '/dashboard/projects', 
      label: 'Mijn Projecten', 
      icon: FolderKanban,
      description: 'Websites beheren' 
    },
    { 
      href: '/dashboard/blogs', 
      label: 'Blog Content', 
      icon: FileText,
      description: 'Blogs & artikelen' 
    },
    { 
      href: '/dashboard/social', 
      label: 'Social Media', 
      icon: Share2,
      description: 'Social posts' 
    },
    { 
      href: '/dashboard/kalender', 
      label: 'Content Kalender', 
      icon: Calendar,
      description: 'Planning overzicht' 
    },
    { 
      href: '/dashboard/instellingen', 
      label: 'Instellingen', 
      icon: Settings,
      description: 'Account & voorkeuren' 
    },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/dashboard/';
    }
    return pathname.startsWith(href);
  };

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
              <Link href="/dashboard" onClick={onClose} className="flex items-center gap-2">
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
              <ul className="space-y-1">
                {navItems.map((item, index) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  
                  return (
                    <motion.li
                      key={item.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                    >
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={`
                          flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                          ${active 
                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/50' 
                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                          }
                        `}
                        title={item.description}
                      >
                        <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-400'}`} />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-sm block truncate">{item.label}</span>
                          {item.description && !active && (
                            <span className="text-xs text-gray-500 block truncate">{item.description}</span>
                          )}
                        </div>
                      </Link>
                    </motion.li>
                  );
                })}
              </ul>
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
