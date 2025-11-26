
'use client';

import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';

interface ModernCardProps {
  children: ReactNode;
  className?: string;
  gradient?: 'orange' | 'purple' | 'blue' | 'green' | 'none';
}

export function ModernCard({ children, className = '', gradient = 'none' }: ModernCardProps) {
  const gradientClasses = {
    orange: 'bg-gradient-to-br from-orange-500/10 via-gray-900 to-gray-900 border-orange-500/20',
    purple: 'bg-gradient-to-br from-purple-500/10 via-gray-900 to-gray-900 border-purple-500/20',
    blue: 'bg-gradient-to-br from-blue-500/10 via-gray-900 to-gray-900 border-blue-500/20',
    green: 'bg-gradient-to-br from-green-500/10 via-gray-900 to-gray-900 border-green-500/20',
    none: 'bg-gray-900 border-gray-800',
  };

  return (
    <Card className={`${gradientClasses[gradient]} ${className}`}>
      {children}
    </Card>
  );
}
