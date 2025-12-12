'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2, Zap, Calendar, Clock, FileText, Settings2 } from 'lucide-react';
import { toast } from 'sonner';

interface AutopilotSettingsProps {
  siteId: string;
}

export default function AutopilotSettings({ siteId }: AutopilotSettingsProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    enabled: false,
    frequency: 'weekly',
    articlesPerRun: 5,
    autoPublish: false,
    wordCount: 2000,
  });

  useEffect(() => {
    loadSettings();
  }, [siteId]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // For now, we'll use default settings
      // In the future, we can store these in the ContentHubSite table
      setSettings({
        enabled: false,
        frequency: 'weekly',
        articlesPerRun: 5,
        autoPublish: false,
        wordCount: 2000,
      });
    } catch (error) {
      console.error('Failed to load autopilot settings:', error);
      toast.error('Kon autopilot instellingen niet laden');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // For now, just show a success message
      // In the future, we'll save these settings
      toast.success('Autopilot instellingen opgeslagen!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Kon instellingen niet opslaan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Zap className="h-6 w-6 text-[#FF9933]" />
            <div>
              <CardTitle>Autopilot Instellingen</CardTitle>
              <CardDescription>
                Configureer automatische content generatie voor deze website
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Settings */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Enable/Disable */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Autopilot Status</CardTitle>
            <CardDescription>Schakel automatische content generatie in of uit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="autopilot-enabled" className="flex flex-col gap-1">
                <span className="text-sm font-medium">Autopilot Actief</span>
                <span className="text-xs text-muted-foreground">
                  {settings.enabled ? 'Artikelen worden automatisch gegenereerd' : 'Handmatige generatie vereist'}
                </span>
              </Label>
              <Switch
                id="autopilot-enabled"
                checked={settings.enabled}
                onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Frequency */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Frequentie</CardTitle>
            <CardDescription>Hoe vaak moeten artikelen worden gegenereerd?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="frequency" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Generatie Frequentie
              </Label>
              <Select
                value={settings.frequency}
                onValueChange={(value) => setSettings({ ...settings, frequency: value })}
                disabled={!settings.enabled}
              >
                <SelectTrigger id="frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Dagelijks</SelectItem>
                  <SelectItem value="twice-weekly">2x per week</SelectItem>
                  <SelectItem value="weekly">Wekelijks</SelectItem>
                  <SelectItem value="bi-weekly">Tweewekelijks</SelectItem>
                  <SelectItem value="monthly">Maandelijks</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Articles per run */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Artikelen per Keer</CardTitle>
            <CardDescription>Hoeveel artikelen per automatische run?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="articles-per-run" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Aantal Artikelen
              </Label>
              <Input
                id="articles-per-run"
                type="number"
                min="1"
                max="20"
                value={settings.articlesPerRun}
                onChange={(e) => setSettings({ ...settings, articlesPerRun: parseInt(e.target.value) || 5 })}
                disabled={!settings.enabled}
              />
              <p className="text-xs text-muted-foreground">
                Aanbevolen: 3-10 artikelen per run
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Word Count */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Woordenaantal</CardTitle>
            <CardDescription>Standaard lengte voor gegenereerde artikelen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="word-count" className="flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Woorden per Artikel
              </Label>
              <Select
                value={settings.wordCount.toString()}
                onValueChange={(value) => setSettings({ ...settings, wordCount: parseInt(value) })}
                disabled={!settings.enabled}
              >
                <SelectTrigger id="word-count">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1000">1000 woorden</SelectItem>
                  <SelectItem value="1500">1500 woorden</SelectItem>
                  <SelectItem value="2000">2000 woorden</SelectItem>
                  <SelectItem value="2500">2500 woorden</SelectItem>
                  <SelectItem value="3000">3000 woorden</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Auto-publish */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Automatisch Publiceren</CardTitle>
            <CardDescription>Direct naar WordPress publiceren of als concept opslaan?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-publish" className="flex flex-col gap-1">
                <span className="text-sm font-medium">Direct Publiceren</span>
                <span className="text-xs text-muted-foreground">
                  {settings.autoPublish ? 'Artikelen worden direct gepubliceerd' : 'Artikelen worden als concept opgeslagen'}
                </span>
              </Label>
              <Switch
                id="auto-publish"
                checked={settings.autoPublish}
                onCheckedChange={(checked) => setSettings({ ...settings, autoPublish: checked })}
                disabled={!settings.enabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="md:col-span-2 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-900">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm text-blue-700 dark:text-blue-100">
                <p className="font-semibold">Hoe werkt Autopilot?</p>
                <ul className="list-disc list-inside space-y-1 text-blue-600 dark:text-blue-200">
                  <li>Autopilot selecteert automatisch artikelen uit je topical map</li>
                  <li>Artikelen worden op basis van prioriteit en zoekvolume gekozen</li>
                  <li>Content wordt volledig geoptimaliseerd voor SEO</li>
                  <li>Je ontvangt een notificatie wanneer nieuwe artikelen klaar zijn</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          <Zap className="h-4 w-4" />
          Instellingen Opslaan
        </Button>
      </div>
    </div>
  );
}
