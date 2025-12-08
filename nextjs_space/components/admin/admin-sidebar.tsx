'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Package,
  FolderKanban,
  DollarSign,
  Receipt,
  CreditCard,
  FileText,
  Mail,
  Settings,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
}

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

  const navItems: (NavItem | NavGroup)[] = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Klanten', href: '/admin/clients', icon: Users },
    { label: 'Opdrachten', href: '/admin/assignments', icon: Package },
    { label: 'Projecten', href: '/admin/projects', icon: FolderKanban },
    {
      label: 'Financieel',
      icon: DollarSign,
      items: [
        { label: 'Facturen', href: '/admin/invoices', icon: Receipt },
        { label: 'Affiliate Payouts', href: '/admin/affiliate-payouts', icon: CreditCard },
      ],
    },
    {
      label: 'Content',
      icon: FileText,
      items: [
        { label: 'Blog CMS', href: '/admin/blog', icon: FileText },
        { label: 'Email Manager', href: '/admin/emails', icon: Mail },
      ],
    },
    { label: 'Instellingen', href: '/admin/settings', icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  const isGroupActive = (items: NavItem[]) => {
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
        {navItems.map((item, index) => {
          // Check if it's a group
          if ('items' in item) {
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
