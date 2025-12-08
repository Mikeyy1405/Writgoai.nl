'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LucideIcon, CheckCircle, AlertCircle, Construction } from 'lucide-react';
import Link from 'next/link';

export type FeatureStatus = 'working' | 'partial' | 'development';

interface FeatureStatusCardProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  status: FeatureStatus;
  href: string;
}

const statusConfig = {
  working: {
    label: '✅ Volledig Werkend',
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
    badgeColor: 'bg-green-600 hover:bg-green-700',
    icon: CheckCircle,
  },
  partial: {
    label: '🔧 Gedeeltelijk Werkend',
    color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    badgeColor: 'bg-orange-600 hover:bg-orange-700',
    icon: AlertCircle,
  },
  development: {
    label: '🚧 In Ontwikkeling',
    color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    badgeColor: 'bg-gray-600 hover:bg-gray-700',
    icon: Construction,
  },
};

export function FeatureStatusCard({
  title,
  description,
  icon: Icon,
  status,
  href,
}: FeatureStatusCardProps) {
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <Link href={href}>
      <Card className={`group relative overflow-hidden bg-gray-900 border-gray-800 hover:border-gray-700 transition-all duration-300 hover:scale-105 cursor-pointer h-full`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-xl bg-black/20 inline-flex`}>
              <Icon className={`w-6 h-6 ${config.color.split(' ')[1]}`} />
            </div>
            <StatusIcon className={`w-5 h-5 ${config.color.split(' ')[1]}`} />
          </div>
          
          <h3 className="font-bold text-white mb-2 text-base">
            {title}
          </h3>
          
          {description && (
            <p className="text-xs text-gray-400 mb-4">
              {description}
            </p>
          )}
          
          <Badge className={`${config.badgeColor} text-white text-xs px-3 py-1 mt-2`}>
            {config.label}
          </Badge>
        </CardContent>
      </Card>
    </Link>
  );
}
