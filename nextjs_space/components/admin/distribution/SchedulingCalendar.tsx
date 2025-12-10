'use client';

import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QueueItem, PLATFORM_CONFIGS } from '@/lib/types/distribution';
import { Badge } from '@/components/ui/badge';
import { format, isSameDay } from 'date-fns';
import { nl } from 'date-fns/locale';
import { getIconComponent } from '@/lib/distribution-utils';

interface SchedulingCalendarProps {
  items: QueueItem[];
  onDateSelect?: (date: Date) => void;
  onItemClick?: (item: QueueItem) => void;
}

export function SchedulingCalendar({ items, onDateSelect, onItemClick }: SchedulingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date && onDateSelect) {
      onDateSelect(date);
    }
  };

  // Get items for selected date
  const selectedDateItems = selectedDate 
    ? items.filter(item => isSameDay(item.task.scheduled_at, selectedDate))
    : [];

  // Get dates with scheduled items
  const datesWithItems = items.reduce((acc, item) => {
    const dateKey = format(item.task.scheduled_at, 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(item);
    return acc;
  }, {} as Record<string, QueueItem[]>);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Calendar */}
      <Card className="bg-zinc-900 border-zinc-800 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-white">Planningskalender</CardTitle>
          <p className="text-sm text-zinc-400">Klik op een datum om de geplande posts te zien</p>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            locale={nl}
            className="rounded-md border border-zinc-800 bg-zinc-950 text-white"
            modifiers={{
              scheduled: Object.keys(datesWithItems).map(dateKey => new Date(dateKey)),
            }}
            modifiersStyles={{
              scheduled: {
                fontWeight: 'bold',
                backgroundColor: 'rgba(255, 107, 53, 0.2)',
                border: '1px solid rgba(255, 107, 53, 0.4)',
              },
            }}
          />
          
          {/* Legend */}
          <div className="mt-4 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[#FF6B35]/20 border border-[#FF6B35]/40"></div>
              <span className="text-zinc-400">Posts gepland</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Items */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">
            {selectedDate ? format(selectedDate, 'dd MMMM yyyy', { locale: nl }) : 'Selecteer een datum'}
          </CardTitle>
          <p className="text-sm text-zinc-400">
            {selectedDateItems.length} post{selectedDateItems.length !== 1 && 's'} gepland
          </p>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
          {selectedDateItems.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              Geen posts gepland voor deze datum
            </div>
          ) : (
            selectedDateItems.map(item => (
              <div
                key={item.id}
                onClick={() => onItemClick && onItemClick(item)}
                className="p-3 rounded-lg bg-zinc-800 border border-zinc-700 hover:border-zinc-600 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-sm font-medium text-white line-clamp-1">
                    {item.content.title}
                  </h4>
                  <Badge 
                    variant="outline" 
                    className={`
                      ${item.task.status === 'pending' && 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}
                      ${item.task.status === 'scheduled' && 'bg-blue-500/10 text-blue-500 border-blue-500/20'}
                      ${item.task.status === 'published' && 'bg-green-500/10 text-green-500 border-green-500/20'}
                      ${item.task.status === 'failed' && 'bg-red-500/10 text-red-500 border-red-500/20'}
                    `}
                  >
                    {format(item.task.scheduled_at, 'HH:mm')}
                  </Badge>
                </div>
                <p className="text-xs text-zinc-400 mb-2 line-clamp-2">
                  {item.client.name}
                </p>
                <div className="flex flex-wrap gap-1">
                  {item.task.platforms.slice(0, 3).map(platformKey => {
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
                  {item.task.platforms.length > 3 && (
                    <div className="w-6 h-6 rounded flex items-center justify-center bg-zinc-700 text-zinc-400 text-xs">
                      +{item.task.platforms.length - 3}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
