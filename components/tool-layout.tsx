
'use client';

import { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface ToolLayoutProps {
  children: ReactNode;
  title: string;
  description: string;
  icon: ReactNode;
  backLink?: string;
  headerActions?: ReactNode;
}

export function ToolLayout({
  children,
  title,
  description,
  icon,
  backLink = '/client-portal',
  headerActions,
}: ToolLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-800 bg-gray-900/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href={backLink}>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <ArrowLeft size={18} />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                  {icon}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">{title}</h1>
                  <p className="text-sm text-gray-400">{description}</p>
                </div>
              </div>
            </div>
            {headerActions && (
              <div className="hidden md:flex items-center gap-2">
                {headerActions}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
}
