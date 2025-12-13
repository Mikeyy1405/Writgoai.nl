'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { LogOut, Sparkles } from 'lucide-react';
import { adminNavSections, isAdminNavActive } from '@/lib/admin-navigation-config';

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden lg:flex w-64 bg-gray-900 text-white min-h-screen flex-col border-r border-gray-800">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-orange-500" />
          <div>
            <span className="text-2xl font-bold text-white">WritGo</span>
            <p className="text-xs text-gray-400 mt-0.5">Admin Panel</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        {adminNavSections.map((section) => (
          <div key={section.title} className="mb-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
              {section.title}
            </h3>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = isAdminNavActive(item.href, pathname);
                
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
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
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={() => signOut({ callbackUrl: '/client-login' })}
          className="flex items-center gap-3 px-3 py-2.5 text-red-400 hover:bg-gray-800 hover:text-red-300 rounded-lg transition-all duration-200 w-full"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">Uitloggen</span>
        </button>
      </div>
    </div>
  );
}
