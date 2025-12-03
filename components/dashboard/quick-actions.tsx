
'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Wand2, 
  PenTool, 
  Map,
  Library,
  Sparkles,
  ChevronRight,
  Calendar
} from 'lucide-react';

const quickActions = [
  {
    title: 'Site Planner',
    description: 'Genereer volledig contentplan',
    icon: Map,
    href: '/client-portal/site-planner',
    badge: 'NIEUW',
    badgeColor: 'bg-green-500',
    gradient: 'from-green-500/20 to-emerald-500/10',
    iconColor: 'text-green-400',
    iconBg: 'bg-green-500/10'
  },
  {
    title: 'Content Generator',
    description: 'Alle opties in één tool',
    icon: Wand2,
    href: '/client-portal/content-generator',
    badge: 'NIEUW',
    badgeColor: 'bg-orange-500',
    gradient: 'from-orange-500/20 to-orange-500/10',
    iconColor: 'text-orange-400',
    iconBg: 'bg-orange-500/10'
  },
  {
    title: 'Image Specialist',
    description: 'Maak unieke AI afbeeldingen',
    icon: Sparkles,
    href: '/client-portal/image-specialist',
    badge: '15+ MODELS',
    badgeColor: 'bg-pink-500',
    gradient: 'from-pink-500/20 to-rose-500/10',
    iconColor: 'text-pink-400',
    iconBg: 'bg-pink-500/10'
  },
  {
    title: 'Mijn Content',
    description: 'Beheer al je content',
    icon: Library,
    href: '/client-portal/content-library',
    gradient: 'from-blue-500/20 to-cyan-500/10',
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/10'
  }
];

export function QuickActions() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Quick Actions</h2>
          <p className="text-sm text-gray-400">Start direct met content creatie</p>
        </div>
        <Sparkles className="w-5 h-5 text-orange-400" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href} href={action.href}>
              <Card className={`group relative overflow-hidden bg-gradient-to-br ${action.gradient} border-gray-800 hover:border-gray-700 transition-all duration-300 hover:scale-105 cursor-pointer h-full`}>
                <CardContent className="p-6">
                  {action.badge && (
                    <Badge 
                      className={`absolute top-3 right-3 ${action.badgeColor} text-white text-[10px] px-2 py-0.5`}
                    >
                      {action.badge}
                    </Badge>
                  )}
                  
                  <div className={`${action.iconBg} p-3 rounded-xl inline-flex mb-4`}>
                    <Icon className={`w-6 h-6 ${action.iconColor}`} />
                  </div>
                  
                  <h3 className="font-bold text-white mb-2 text-base">
                    {action.title}
                  </h3>
                  <p className="text-xs text-gray-400 mb-4">
                    {action.description}
                  </p>
                  
                  <div className="flex items-center gap-1 text-xs text-gray-400 group-hover:text-orange-400 transition-colors">
                    <span>Start nu</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
