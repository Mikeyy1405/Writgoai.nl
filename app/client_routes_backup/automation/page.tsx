
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, PlayCircle, Sparkles } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AutomationPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [automationStatus, setAutomationStatus] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Settings
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [articlesPerWeek, setArticlesPerWeek] = useState(2);
  const [socialsPerWeek, setSocialsPerWeek] = useState(3);
  const [tiktoksPerWeek, setTiktoksPerWeek] = useState(3);
  const [youtubeShortsPerWeek, setYoutubeShortsPerWeek] = useState(3);

  // Load current status
  useEffect(() => {
    if (status === 'authenticated') {
      loadAutomationStatus();
    }
  }, [status]);

  async function loadAutomationStatus() {
    try {
      setStatusLoading(true);
      const res = await fetch('/api/automation/start');
      if (!res.ok) throw new Error('Failed to load status');
      
      const data = await res.json();
      setAutomationStatus(data);
      
      if (data.websiteUrl) {
        setWebsiteUrl(data.websiteUrl);
      }
    } catch (error) {
      console.error('Error loading status:', error);
    } finally {
      setStatusLoading(false);
    }
  }

  async function startAutomation() {
    if (!websiteUrl.trim()) {
      setError('Vul je website URL in');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // First update website URL in profile
      const profileRes = await fetch('/api/client-portal/ai-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteUrl: websiteUrl.trim(),
        }),
      });

      if (!profileRes.ok) {
        throw new Error('Failed to update website URL');
      }

      // Now start automation
      const automationRes = await fetch('/api/automation/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articlesPerWeek,
          socialsPerWeek,
          tiktoksPerWeek,
          youtubeShortsPerWeek,
        }),
      });

      if (!automationRes.ok) {
        const errorData = await automationRes.json();
        throw new Error(errorData.error || 'Failed to start automation');
      }

      const result = await automationRes.json();
      setSuccess(result.message || 'Automation succesvol gestart!');
      
      // Reload status
      setTimeout(() => {
        loadAutomationStatus();
      }, 1000);

    } catch (error: any) {
      console.error('Error starting automation:', error);
      setError(error.message || 'Er ging iets mis');
    } finally {
      setLoading(false);
    }
  }

  if (status === 'loading' || statusLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/client-login');
    return null;
  }

  const isActive = automationStatus?.active;
  const isConfigured = automationStatus?.configured;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Complete Content Automation</h1>
        <p className="text-muted-foreground mt-2">
          Activeer volledige automatisering voor artikelen, social reels, TikTok en YouTube Shorts
        </p>
      </div>

      {/* Status Overview */}
      {isConfigured && (
        <Card className={isActive ? 'border-green-500 bg-green-50' : 'border-orange-500 bg-orange-50'}>
          <CardHeader>
            <div className="flex items-center gap-3">
              {isActive ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <Sparkles className="h-6 w-6 text-orange-600" />
              )}
              <div>
                <CardTitle>
                  {isActive ? 'Automation Actief 🎉' : 'Automation Geconfigureerd'}
                </CardTitle>
                <CardDescription>
                  {isActive 
                    ? 'Je content wordt automatisch gegenereerd en gepubliceerd'
                    : 'Klaar om te starten met automatische content generatie'
                  }
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border">
                <div className="text-2xl font-bold text-blue-600">
                  {automationStatus.articlesScheduled || 0}
                </div>
                <div className="text-sm text-muted-foreground">Artikelen Ingepland</div>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <div className="text-2xl font-bold text-purple-600">
                  {automationStatus.reelsScheduled || 0}
                </div>
                <div className="text-sm text-muted-foreground">Social Reels Ingepland</div>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <div className="text-2xl font-bold text-pink-600">
                  {automationStatus.youtubeShortsScheduled || 0}
                </div>
                <div className="text-sm text-muted-foreground">YouTube Shorts Ingepland</div>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <div className="text-2xl font-bold text-green-600">
                  {(automationStatus.articlesScheduled || 0) +
                    (automationStatus.reelsScheduled || 0) +
                    (automationStatus.youtubeShortsScheduled || 0)}
                </div>
                <div className="text-sm text-muted-foreground">Totaal Content Items</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Setup Form */}
      <Card>
        <CardHeader>
          <CardTitle>Automation Instellingen</CardTitle>
          <CardDescription>
            Configureer je volledige content automatisering
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Website URL */}
          <div className="space-y-2">
            <Label htmlFor="websiteUrl">Website URL *</Label>
            <Input
              id="websiteUrl"
              type="url"
              placeholder="https://jouwwebsite.nl"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              disabled={isActive}
            />
            <p className="text-sm text-muted-foreground">
              We scannen je website om AI-gedreven content te maken die perfect past bij jouw bedrijf
            </p>
          </div>

          {/* Content Frequency */}
          <div className="space-y-4">
            <h3 className="font-medium">Content Frequentie</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="articles">Website Artikelen per week</Label>
                <Input
                  id="articles"
                  type="number"
                  min="0"
                  max="7"
                  value={articlesPerWeek}
                  onChange={(e) => setArticlesPerWeek(parseInt(e.target.value) || 0)}
                  disabled={isActive}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="socials">Social Reels per week (Instagram/Facebook)</Label>
                <Input
                  id="socials"
                  type="number"
                  min="0"
                  max="14"
                  value={socialsPerWeek}
                  onChange={(e) => setSocialsPerWeek(parseInt(e.target.value) || 0)}
                  disabled={isActive}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tiktoks">TikTok Reels per week</Label>
                <Input
                  id="tiktoks"
                  type="number"
                  min="0"
                  max="14"
                  value={tiktoksPerWeek}
                  onChange={(e) => setTiktoksPerWeek(parseInt(e.target.value) || 0)}
                  disabled={isActive}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="youtube">YouTube Shorts per week</Label>
                <Input
                  id="youtube"
                  type="number"
                  min="0"
                  max="14"
                  value={youtubeShortsPerWeek}
                  onChange={(e) => setYoutubeShortsPerWeek(parseInt(e.target.value) || 0)}
                  disabled={isActive}
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium text-blue-900 mb-1">Wat gebeurt er?</div>
                  <ul className="space-y-1 text-blue-800">
                    <li>✓ We scannen je website met AI</li>
                    <li>✓ Genereren een 90-dagen content plan</li>
                    <li>✓ Schrijven automatisch artikelen + scripts</li>
                    <li>✓ Publiceren direct naar je website en social media</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Action Button */}
          <Button
            size="lg"
            className="w-full"
            onClick={startAutomation}
            disabled={loading || isActive}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Automation wordt opgestart...
              </>
            ) : isActive ? (
              <>
                <CheckCircle className="mr-2 h-5 w-5" />
                Automation Actief
              </>
            ) : (
              <>
                <PlayCircle className="mr-2 h-5 w-5" />
                Start Complete Automation
              </>
            )}
          </Button>

          {!isActive && (
            <p className="text-xs text-center text-muted-foreground">
              Dit proces kan 2-3 minuten duren. We scannen je website en maken een compleet 90-dagen plan.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Hoe werkt het?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <div className="font-medium">Website Scan</div>
                <div className="text-sm text-muted-foreground">
                  AI analyseert je website, niche, doelgroep en concurrenten
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <div className="font-medium">Content Planning</div>
                <div className="text-sm text-muted-foreground">
                  Genereer 90-dagen content plan met artikelen, reels en video's
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <div className="font-medium">Automatische Generatie</div>
                <div className="text-sm text-muted-foreground">
                  Elke dag wordt nieuwe content automatisch gegenereerd
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <div className="font-medium">Automatische Publicatie</div>
                <div className="text-sm text-muted-foreground">
                  Content wordt direct gepubliceerd naar je website en social media
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
