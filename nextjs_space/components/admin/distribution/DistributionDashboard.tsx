'use client';

import { DistributionOverview } from '@/lib/types/distribution';
import { DistributionStats } from './DistributionStats';
import { PlatformCard } from './PlatformCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import * as Icons from 'lucide-react';
import { PLATFORM_CONFIGS } from '@/lib/types/distribution';
import { getIconComponent } from '@/lib/distribution-utils';

interface DistributionDashboardProps {
  overview: DistributionOverview;
  onTestPlatform?: (platform: string) => void;
  onConfigurePlatform?: (platform: string) => void;
}

export function DistributionDashboard({ 
  overview, 
  onTestPlatform, 
  onConfigurePlatform 
}: DistributionDashboardProps) {
  const statusLabels = {
    pending: 'In behandeling',
    scheduled: 'Gepland',
    publishing: 'Publiceren',
    published: 'Gepubliceerd',
    failed: 'Mislukt',
    cancelled: 'Geannuleerd',
  };

  const statusColors = {
    pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    scheduled: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    publishing: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    published: 'bg-green-500/10 text-green-500 border-green-500/20',
    failed: 'bg-red-500/10 text-red-500 border-red-500/20',
    cancelled: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <DistributionStats stats={overview.stats} />

      {/* Platform Status */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Platform Status</h2>
          <Badge variant="outline" className="bg-zinc-800 text-zinc-300 border-zinc-700">
            {overview.platform_status.filter(p => p.connected).length} / {overview.platform_status.length} verbonden
          </Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {overview.platform_status.slice(0, 4).map(platform => (
            <PlatformCard
              key={platform.platform}
              platform={platform}
              onTest={onTestPlatform ? () => onTestPlatform(platform.platform) : undefined}
              onConfigure={onConfigurePlatform ? () => onConfigurePlatform(platform.platform) : undefined}
            />
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Recente Activiteit</CardTitle>
          <p className="text-sm text-zinc-400">Laatste 10 distributie taken</p>
        </CardHeader>
        <CardContent>
          {overview.recent_activity.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              Geen recente activiteit
            </div>
          ) : (
            <div className="space-y-3">
              {overview.recent_activity.map(item => (
                <div
                  key={item.id}
                  className="flex items-start gap-4 p-3 rounded-lg bg-zinc-800 border border-zinc-700 hover:border-zinc-600 transition-colors"
                >
                  {/* Content Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-sm font-medium text-white line-clamp-1">
                        {item.content.title}
                      </h4>
                      <Badge 
                        variant="outline" 
                        className={statusColors[item.task.status]}
                      >
                        {statusLabels[item.task.status]}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-zinc-400 mb-2">
                      <div className="flex items-center gap-1">
                        <Icons.User className="w-3 h-3" />
                        <span>{item.client.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icons.Calendar className="w-3 h-3" />
                        <span>{format(item.task.scheduled_at, 'dd MMM HH:mm', { locale: nl })}</span>
                      </div>
                    </div>

                    {/* Platforms */}
                    <div className="flex flex-wrap gap-1">
                      {item.task.platforms.map(platformKey => {
                        const platform = PLATFORM_CONFIGS[platformKey];
                        if (!platform) return null;

                        const IconComponent = getIconComponent(platform.icon);

                        return (
                          <div
                            key={platformKey}
                            className="w-6 h-6 rounded flex items-center justify-center"
                            style={{ backgroundColor: `${platform.color}20` }}
                            title={platform.display_name}
                          >
                            <IconComponent 
                              className="w-3 h-3" 
                              style={{ color: platform.color }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
