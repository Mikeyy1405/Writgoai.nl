
'use client';

import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { 
  Wand2, 
  Map, 
  MessageSquare, 
  FileText, 
  Image as ImageIcon,
  Globe,
  TrendingUp,
  ChevronRight
} from 'lucide-react';

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  gradient: string;
  badge?: string;
  badgeColor?: string;
  usageCount?: number;
}

const ALL_TOOLS: Tool[] = [
  {
    id: 'site-planner',
    name: 'Site Planner',
    description: 'Automatisch volledig contentplan genereren',
    icon: <Map size={24} />,
    href: '/client-portal/site-planner',
    gradient: 'from-green-500 to-emerald-500',
    badge: 'NIEUW',
    badgeColor: 'bg-green-500/20 text-green-400'
  },
  {
    id: 'content-generator',
    name: 'Content Generator',
    description: 'Genereer content met alle opties',
    icon: <Wand2 size={24} />,
    href: '/client-portal/content-generator',
    gradient: 'from-orange-500 to-red-500',
    badge: 'NIEUW',
    badgeColor: 'bg-orange-500/20 text-orange-400'
  },
  {
    id: 'image-specialist',
    name: 'Image Specialist',
    description: 'Genereer unieke AI afbeeldingen',
    icon: <ImageIcon size={24} />,
    href: '/client-portal/image-specialist',
    gradient: 'from-pink-500 to-rose-500',
    badge: '15+ MODELS',
    badgeColor: 'bg-pink-500/20 text-pink-400'
  },
  {
    id: 'wordpress',
    name: 'WordPress',
    description: 'Publiceer direct naar je website',
    icon: <Globe size={24} />,
    href: '/client-portal/wordpress-content',
    gradient: 'from-indigo-500 to-blue-500'
  }
];

interface FavoriteToolsProps {
  recentActivity?: Array<{ tool?: string }>;
}

export function FavoriteTools({ recentActivity = [] }: FavoriteToolsProps) {
  // Bereken meest gebruikte tools
  const toolUsage = recentActivity.reduce((acc: Record<string, number>, activity) => {
    if (activity.tool) {
      acc[activity.tool] = (acc[activity.tool] || 0) + 1;
    }
    return acc;
  }, {});

  // Sorteer tools op gebruik
  const sortedTools = ALL_TOOLS.map(tool => ({
    ...tool,
    usageCount: toolUsage[tool.id] || 0
  })).sort((a, b) => b.usageCount - a.usageCount);

  // Toon top 4 meest gebruikte tools, of eerste 4 als geen gebruik data
  const displayTools = sortedTools.slice(0, 4);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white">✨ Jouw Favoriete Tools</h3>
          <p className="text-sm text-gray-400 mt-1">
            {recentActivity.length > 0 
              ? 'Gebaseerd op je recente gebruik'
              : 'Populaire tools om mee te starten'
            }
          </p>
        </div>
        <Link 
          href="/client-portal"
          className="text-sm text-orange-400 hover:text-purple-300 flex items-center gap-1"
        >
          Alles bekijken
          <ChevronRight size={16} />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayTools.map((tool) => (
          <Link key={tool.id} href={tool.href}>
            <Card className="bg-gray-900 border-gray-800 p-4 hover:border-orange-500/50 transition-all duration-300 hover:scale-105 group cursor-pointer">
              <div className="flex flex-col h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${tool.gradient} text-white shadow-lg`}>
                    {tool.icon}
                  </div>
                  {tool.badge && (
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${tool.badgeColor}`}>
                      {tool.badge}
                    </span>
                  )}
                </div>
                
                <h4 className="text-white font-semibold mb-2 group-hover:text-orange-400 transition-colors">
                  {tool.name}
                </h4>
                <p className="text-sm text-gray-400 mb-3 flex-1">
                  {tool.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {tool.usageCount > 0 && `${tool.usageCount}x gebruikt`}
                  </span>
                  <ChevronRight className="text-gray-600 group-hover:text-orange-400 transition-colors" size={16} />
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
