'use client';

import React, { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import {
  Zap,
  Settings,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

export interface AutopilotConfig {
  enabled: boolean;
  frequency: 'daily' | '3x-week' | 'weekly' | '2x-week';
  time: string; // HH:MM format
  weekdays?: number[]; // 0=Sunday, 1=Monday, etc.
  maxPerDay?: number;
  autoPublish?: boolean;
}

interface AutopilotToggleProps {
  type: 'blog' | 'social';
  planId?: string;
  onConfigChange?: (config: AutopilotConfig) => void;
}

export function AutopilotToggle({
  type,
  planId,
  onConfigChange,
}: AutopilotToggleProps) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState<AutopilotConfig>({
    enabled: false,
    frequency: '3x-week',
    time: '09:00',
    weekdays: [1, 3, 5], // Monday, Wednesday, Friday
    maxPerDay: 1,
    autoPublish: true,
  });

  // Load existing config on mount
  useEffect(() => {
    loadConfig();
  }, [type, planId]);

  const loadConfig = async () => {
    if (!planId) return;

    try {
      const endpoint =
        type === 'blog'
          ? `/api/admin/blog/autopilot/config?planId=${planId}`
          : `/api/admin/social/autopilot/config?planId=${planId}`;

      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setConfig(data.config);
          setEnabled(data.config.enabled);
        }
      }
    } catch (error) {
      console.error('Failed to load autopilot config:', error);
    }
  };

  const handleToggle = async (checked: boolean) => {
    if (!planId) {
      toast.error('Geen plan geselecteerd');
      return;
    }

    setLoading(true);
    try {
      const endpoint =
        type === 'blog'
          ? '/api/admin/blog/autopilot/toggle'
          : '/api/admin/social/autopilot/toggle';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          enabled: checked,
          config: checked ? config : undefined,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to toggle autopilot');
      }

      const data = await res.json();
      setEnabled(checked);
      toast.success(
        checked ? '✅ Autopilot ingeschakeld!' : '⏸️ Autopilot uitgeschakeld'
      );

      if (onConfigChange) {
        onConfigChange({ ...config, enabled: checked });
      }
    } catch (error) {
      console.error('Autopilot toggle error:', error);
      toast.error('Fout bij wijzigen autopilot status');
      setEnabled(!checked); // Revert
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!planId) return;

    setLoading(true);
    try {
      const endpoint =
        type === 'blog'
          ? '/api/admin/blog/autopilot/config'
          : '/api/admin/social/autopilot/config';

      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          config,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save config');
      }

      toast.success('⚙️ Instellingen opgeslagen!');
      setShowSettings(false);

      if (onConfigChange) {
        onConfigChange(config);
      }
    } catch (error) {
      console.error('Save config error:', error);
      toast.error('Fout bij opslaan instellingen');
    } finally {
      setLoading(false);
    }
  };

  const getFrequencyLabel = (freq: string) => {
    const labels: Record<string, string> = {
      daily: 'Dagelijks',
      '3x-week': '3x per week',
      '2x-week': '2x per week',
      weekly: 'Wekelijks',
    };
    return labels[freq] || freq;
  };

  const getWeekdayName = (day: number) => {
    const days = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];
    return days[day];
  };

  return (
    <div className="w-full space-y-4">
      {/* Main Toggle */}
      <div
        className={cn(
          'flex items-center justify-between p-4 rounded-xl border transition-all',
          enabled
            ? 'bg-green-500/10 border-green-500/50'
            : 'bg-zinc-800/50 border-zinc-700'
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'p-2 rounded-lg',
              enabled ? 'bg-green-500/20' : 'bg-zinc-700/50'
            )}
          >
            <Zap
              className={cn(
                'w-5 h-5',
                enabled ? 'text-green-400' : 'text-gray-500'
              )}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">Autopilot</span>
              {enabled && (
                <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
                  Actief
                </span>
              )}
            </div>
            {enabled && config && (
              <p className="text-xs text-gray-400 mt-1">
                {getFrequencyLabel(config.frequency)} om {config.time}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="text-gray-400 hover:text-white"
          >
            <Settings className="w-4 h-4 mr-1" />
            Instellingen
            {showSettings ? (
              <ChevronUp className="w-4 h-4 ml-1" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-1" />
            )}
          </Button>

          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-orange-400" />
          ) : (
            <Switch
              checked={enabled}
              onCheckedChange={handleToggle}
              disabled={!planId}
            />
          )}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card className="bg-zinc-900 border-zinc-700">
          <CardContent className="p-6 space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-orange-400" />
                Autopilot Instellingen
              </h4>
              <p className="text-sm text-gray-400 mb-6">
                Configureer wanneer en hoe vaak {type === 'blog' ? 'artikelen' : 'posts'}{' '}
                automatisch gepubliceerd moeten worden.
              </p>
            </div>

            {/* Frequency */}
            <div className="space-y-2">
              <Label className="text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-400" />
                Frequentie
              </Label>
              <Select
                value={config.frequency}
                onValueChange={(value: any) =>
                  setConfig({
                    ...config,
                    frequency: value,
                    weekdays:
                      value === '3x-week'
                        ? [1, 3, 5]
                        : value === '2x-week'
                        ? [2, 4]
                        : value === 'weekly'
                        ? [1]
                        : undefined,
                  })
                }
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Dagelijks</SelectItem>
                  <SelectItem value="3x-week">3x per week (Ma, Wo, Vr)</SelectItem>
                  <SelectItem value="2x-week">2x per week (Di, Do)</SelectItem>
                  <SelectItem value="weekly">Wekelijks (Ma)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Time */}
            <div className="space-y-2">
              <Label className="text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-400" />
                Publicatietijd
              </Label>
              <Input
                type="time"
                value={config.time}
                onChange={(e) => setConfig({ ...config, time: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
              <p className="text-xs text-gray-500">
                Tijd waarop nieuwe content gepubliceerd moet worden
              </p>
            </div>

            {/* Weekdays (if applicable) */}
            {config.weekdays && (
              <div className="space-y-2">
                <Label className="text-white">Publicatiedagen</Label>
                <div className="flex flex-wrap gap-2">
                  {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                    <button
                      key={day}
                      onClick={() => {
                        const newWeekdays = config.weekdays?.includes(day)
                          ? config.weekdays.filter((d) => d !== day)
                          : [...(config.weekdays || []), day].sort();
                        setConfig({ ...config, weekdays: newWeekdays });
                      }}
                      className={cn(
                        'w-10 h-10 rounded-full font-semibold text-sm transition-all',
                        config.weekdays.includes(day)
                          ? 'bg-orange-500 text-white'
                          : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                      )}
                    >
                      {getWeekdayName(day)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Max per day */}
            <div className="space-y-2">
              <Label className="text-white">Maximum per dag</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={config.maxPerDay}
                onChange={(e) =>
                  setConfig({ ...config, maxPerDay: parseInt(e.target.value) || 1 })
                }
                className="bg-zinc-800 border-zinc-700 text-white"
              />
              <p className="text-xs text-gray-500">
                Hoeveel {type === 'blog' ? 'artikelen' : 'posts'} er maximaal per dag
                gepubliceerd mogen worden
              </p>
            </div>

            {/* Auto-publish */}
            <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl border border-zinc-700">
              <div>
                <Label className="text-white">Automatisch publiceren</Label>
                <p className="text-xs text-gray-500 mt-1">
                  Direct publiceren zonder handmatige review
                </p>
              </div>
              <Switch
                checked={config.autoPublish}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, autoPublish: checked })
                }
              />
            </div>

            {/* Save Button */}
            <div className="flex gap-3 pt-4 border-t border-zinc-700">
              <Button
                onClick={handleSaveConfig}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Opslaan...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Instellingen Opslaan
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowSettings(false)}
                className="border-zinc-700"
              >
                Annuleren
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Indicator */}
      {enabled && !showSettings && (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
          <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
          <p className="text-sm text-green-300">
            Autopilot actief - Volgende publicatie:{' '}
            <span className="font-semibold">
              {config.weekdays && config.weekdays.length > 0
                ? getWeekdayName(config.weekdays[0])
                : 'Vandaag'}{' '}
              om {config.time}
            </span>
          </p>
        </div>
      )}

      {!enabled && !planId && (
        <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
          <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          <p className="text-sm text-yellow-300">
            Start eerst een content strategie om autopilot te gebruiken
          </p>
        </div>
      )}
    </div>
  );
}
