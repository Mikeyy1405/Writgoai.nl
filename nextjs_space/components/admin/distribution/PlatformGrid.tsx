'use client';

import { useState } from 'react';
import { PlatformConfig } from '@/lib/types/distribution';
import { PlatformCard } from './PlatformCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PlatformGridProps {
  platforms: PlatformConfig[];
  onTest?: (platform: PlatformConfig) => void;
  onConfigure?: (platform: PlatformConfig) => void;
  onToggle?: (platform: PlatformConfig, enabled: boolean) => void;
}

export function PlatformGrid({ platforms, onTest, onConfigure, onToggle }: PlatformGridProps) {
  const [filter, setFilter] = useState<'all' | 'connected' | 'disconnected'>('all');

  const filteredPlatforms = platforms.filter(platform => {
    if (filter === 'connected') return platform.connected;
    if (filter === 'disconnected') return !platform.connected;
    return true;
  });

  const connectedCount = platforms.filter(p => p.connected).length;
  const disconnectedCount = platforms.filter(p => !p.connected).length;

  return (
    <div className="space-y-4">
      <Tabs value={filter} onValueChange={(value) => setFilter(value as any)} className="w-full">
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="all" className="data-[state=active]:bg-zinc-800">
            Alle ({platforms.length})
          </TabsTrigger>
          <TabsTrigger value="connected" className="data-[state=active]:bg-zinc-800">
            Verbonden ({connectedCount})
          </TabsTrigger>
          <TabsTrigger value="disconnected" className="data-[state=active]:bg-zinc-800">
            Niet verbonden ({disconnectedCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredPlatforms.map(platform => (
              <PlatformCard
                key={platform.platform}
                platform={platform}
                onTest={onTest ? () => onTest(platform) : undefined}
                onConfigure={onConfigure ? () => onConfigure(platform) : undefined}
                onToggle={onToggle ? (enabled) => onToggle(platform, enabled) : undefined}
              />
            ))}
          </div>
          {filteredPlatforms.length === 0 && (
            <div className="text-center py-12 text-zinc-500">
              Geen platforms gevonden
            </div>
          )}
        </TabsContent>

        <TabsContent value="connected" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredPlatforms.map(platform => (
              <PlatformCard
                key={platform.platform}
                platform={platform}
                onTest={onTest ? () => onTest(platform) : undefined}
                onConfigure={onConfigure ? () => onConfigure(platform) : undefined}
                onToggle={onToggle ? (enabled) => onToggle(platform, enabled) : undefined}
              />
            ))}
          </div>
          {filteredPlatforms.length === 0 && (
            <div className="text-center py-12 text-zinc-500">
              Geen verbonden platforms
            </div>
          )}
        </TabsContent>

        <TabsContent value="disconnected" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredPlatforms.map(platform => (
              <PlatformCard
                key={platform.platform}
                platform={platform}
                onTest={onTest ? () => onTest(platform) : undefined}
                onConfigure={onConfigure ? () => onConfigure(platform) : undefined}
                onToggle={onToggle ? (enabled) => onToggle(platform, enabled) : undefined}
              />
            ))}
          </div>
          {filteredPlatforms.length === 0 && (
            <div className="text-center py-12 text-zinc-500">
              Alle platforms zijn verbonden
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
