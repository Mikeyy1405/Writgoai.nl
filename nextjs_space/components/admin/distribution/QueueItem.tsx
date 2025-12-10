'use client';

import { QueueItem as QueueItemType, PLATFORM_CONFIGS } from '@/lib/types/distribution';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getIconComponent } from '@/lib/distribution-utils';
import * as Icons from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Calendar, Edit, Trash2, Send } from 'lucide-react';

interface QueueItemProps {
  item: QueueItemType;
  onEdit?: () => void;
  onReschedule?: () => void;
  onDelete?: () => void;
  onPublishNow?: () => void;
}

export function QueueItem({ item, onEdit, onReschedule, onDelete, onPublishNow }: QueueItemProps) {
  const statusColors = {
    pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    scheduled: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    publishing: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    published: 'bg-green-500/10 text-green-500 border-green-500/20',
    failed: 'bg-red-500/10 text-red-500 border-red-500/20',
    cancelled: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
  };

  const statusLabels = {
    pending: 'In behandeling',
    scheduled: 'Gepland',
    publishing: 'Publiceren',
    published: 'Gepubliceerd',
    failed: 'Mislukt',
    cancelled: 'Geannuleerd',
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Content Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium truncate mb-1">
                  {item.content.title}
                </h3>
                <p className="text-sm text-zinc-400 line-clamp-2">
                  {item.content.preview}
                </p>
              </div>
              <Badge 
                variant="outline" 
                className={statusColors[item.task.status]}
              >
                {statusLabels[item.task.status]}
              </Badge>
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
              <div className="flex items-center gap-1">
                <Icons.User className="w-4 h-4" />
                <span>{item.client.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{format(item.task.scheduled_at, 'dd MMM yyyy HH:mm', { locale: nl })}</span>
              </div>
            </div>

            {/* Platforms */}
            <div className="flex flex-wrap gap-2 mt-3">
              {item.task.platforms.map(platformKey => {
                const platform = PLATFORM_CONFIGS[platformKey];
                if (!platform) return null;

                const IconComponent = getIconComponent(platform.icon);

                return (
                  <div
                    key={platformKey}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 border border-zinc-700"
                    title={platform.display_name}
                  >
                    <IconComponent 
                      className="w-3 h-3" 
                      style={{ color: platform.color }}
                    />
                    <span className="text-xs text-zinc-400">{platform.display_name}</span>
                  </div>
                );
              })}
            </div>

            {/* Error Message */}
            {item.task.error_message && (
              <div className="mt-3 p-2 rounded bg-red-500/10 border border-red-500/20">
                <p className="text-xs text-red-500">{item.task.error_message}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {onEdit && item.task.status !== 'published' && item.task.status !== 'cancelled' && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300"
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
            {onReschedule && item.task.status !== 'published' && item.task.status !== 'cancelled' && (
              <Button
                variant="outline"
                size="sm"
                onClick={onReschedule}
                className="bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300"
              >
                <Calendar className="w-4 h-4" />
              </Button>
            )}
            {onPublishNow && item.task.status === 'pending' && (
              <Button
                variant="outline"
                size="sm"
                onClick={onPublishNow}
                className="bg-[#FF6B35]/10 hover:bg-[#FF6B35]/20 border-[#FF6B35]/20 text-[#FF6B35]"
              >
                <Send className="w-4 h-4" />
              </Button>
            )}
            {onDelete && item.task.status !== 'published' && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDelete}
                className="bg-red-500/10 hover:bg-red-500/20 border-red-500/20 text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
