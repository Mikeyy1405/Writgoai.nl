'use client';

import { PlatformConfig } from '@/lib/types/distribution';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getIconComponent } from '@/lib/distribution-utils';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface PlatformCardProps {
  platform: PlatformConfig;
  onTest?: () => void;
  onConfigure?: () => void;
  onToggle?: (enabled: boolean) => void;
}

export function PlatformCard({ platform, onTest, onConfigure, onToggle }: PlatformCardProps) {
  // Get the icon component
  const IconComponent = getIconComponent(platform.icon);

  return (
    <Card className={`bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors ${
      !platform.enabled ? 'opacity-50' : ''
    }`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${platform.color}20` }}
            >
              <IconComponent 
                className="w-6 h-6" 
                style={{ color: platform.color }}
              />
            </div>
            <div>
              <h3 className="text-white font-semibold">{platform.display_name}</h3>
              <div className="flex items-center gap-2 mt-1">
                {platform.connected ? (
                  <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                    Verbonden
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-zinc-800 text-zinc-400 border-zinc-700">
                    Niet verbonden
                  </Badge>
                )}
                {!platform.enabled && (
                  <Badge variant="outline" className="bg-zinc-800 text-zinc-400 border-zinc-700">
                    Uitgeschakeld
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Platform Info */}
        <div className="space-y-2 text-sm text-zinc-400 mb-4">
          {platform.last_sync && (
            <div className="flex justify-between">
              <span>Laatste sync:</span>
              <span className="text-zinc-300">
                {format(platform.last_sync, 'dd MMM yyyy HH:mm', { locale: nl })}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Dagelijkse limiet:</span>
            <span className="text-zinc-300">
              {platform.settings.daily_limit || 'Onbeperkt'}
            </span>
          </div>
          {platform.settings.posting_times && platform.settings.posting_times.length > 0 && (
            <div className="flex justify-between">
              <span>Post tijden:</span>
              <span className="text-zinc-300">
                {platform.settings.posting_times.slice(0, 2).join(', ')}
                {platform.settings.posting_times.length > 2 && '...'}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {onTest && (
            <Button
              variant="outline"
              size="sm"
              onClick={onTest}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300"
            >
              Test
            </Button>
          )}
          {onConfigure && (
            <Button
              variant="outline"
              size="sm"
              onClick={onConfigure}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300"
            >
              Configureer
            </Button>
          )}
          {onToggle && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggle(!platform.enabled)}
              className={`flex-1 ${
                platform.enabled 
                  ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300' 
                  : 'bg-[#FF6B35]/10 hover:bg-[#FF6B35]/20 border-[#FF6B35]/20 text-[#FF6B35]'
              }`}
            >
              {platform.enabled ? 'Uitschakelen' : 'Inschakelen'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
