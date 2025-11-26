
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, Globe, Brain, Calendar, Rocket } from 'lucide-react';

export default function AIPlanning() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [activeStep, setActiveStep] = useState<'scan' | 'plan' | 'review' | 'activate'>('scan');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [masterPlan, setMasterPlan] = useState<any>(null);

  const [frequency, setFrequency] = useState({
    articles: 2,
    socials: 3,
    tiktoks: 3,
    youtubeShorts: 3,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/client-login');
    }
  }, [status, router]);

  useEffect(() => {
    // Check if scan already completed
    checkExistingData();
  }, []);

  const checkExistingData = async () => {
    try {
      const response = await fetch('/api/ai-planner/generate-master-plan');
      if (response.ok) {
        const data = await response.json();
        if (data.plan && data.plan.status === 'READY') {
          setMasterPlan(data);
          setActiveStep('review');
        }
      }
    } catch (error) {
      console.error('Error checking existing data:', error);
    }
  };

  const handleScanWebsite = async () => {
    if (!websiteUrl.trim()) {
      toast.error('Vul een website URL in');
      return;
    }

    // Add https:// if missing
    let url = websiteUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    setScanning(true);

    try {
      const response = await fetch('/api/ai-planner/scan-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteUrl: url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Scan failed');
      }

      setScanResult(data.scanResult);
      toast.success('Website scan voltooid! 🎉');
      setActiveStep('plan');

    } catch (error) {
      console.error('Scan error:', error);
      toast.error(error instanceof Error ? error.message : 'Er ging iets mis bij het scannen');
    } finally {
      setScanning(false);
    }
  };

  const handleGenerateMasterPlan = async () => {
    setGenerating(true);

    try {
      const response = await fetch('/api/ai-planner/generate-master-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articlesPerWeek: frequency.articles,
          socialsPerWeek: frequency.socials,
          tiktoksPerWeek: frequency.tiktoks,
          youtubeShortsPerWeek: frequency.youtubeShorts,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Plan generation failed');
      }

      setMasterPlan(data);
      toast.success('Content plan gegenereerd! 🚀');
      setActiveStep('review');

    } catch (error) {
      console.error('Plan generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Er ging iets mis bij het genereren');
    } finally {
      setGenerating(false);
    }
  };

  const handleActivateAutomation = async () => {
    try {
      // Enable autopilot in AI profile
      const response = await fetch('/api/client-portal/ai-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          autopilotEnabled: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to activate automation');
      }

      toast.success('Automatisering geactiveerd! Je content wordt nu automatisch gegenereerd en gepubliceerd. 🎉');
      setActiveStep('activate');
      
      // Redirect to dashboard after a moment
      setTimeout(() => {
        router.push('/client-portal');
      }, 2000);

    } catch (error) {
      console.error('Activation error:', error);
      toast.error('Er ging iets mis bij het activeren');
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            AI Content Automation Setup 🚀
          </h1>
          <p className="text-lg text-gray-600">
            Van website scan tot automatische content generatie in 3 stappen
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {[
              { id: 'scan', label: 'Website Scan', icon: Globe },
              { id: 'plan', label: 'Content Plan', icon: Brain },
              { id: 'review', label: 'Review', icon: Calendar },
              { id: 'activate', label: 'Activeren', icon: Rocket },
            ].map((step, index) => {
              const isActive = activeStep === step.id;
              const isPast = ['scan', 'plan', 'review', 'activate'].indexOf(activeStep) > index;
              const StepIcon = step.icon;

              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex flex-col items-center ${index > 0 ? 'ml-4' : ''}`}>
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        isActive || isPast
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isPast ? <CheckCircle2 className="h-6 w-6" /> : <StepIcon className="h-6 w-6" />}
                    </div>
                    <span className="text-xs mt-2 font-medium text-gray-700">{step.label}</span>
                  </div>
                  {index < 3 && (
                    <div className={`h-1 w-16 mx-2 ${isPast ? 'bg-orange-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 1: Website Scan */}
        {activeStep === 'scan' && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-6 w-6 text-orange-500" />
                Stap 1: Website Scannen
              </CardTitle>
              <CardDescription>
                Onze AI analyseert je website om je niche, doelgroep en content strategie te bepalen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="websiteUrl">Je website URL</Label>
                <Input
                  id="websiteUrl"
                  type="url"
                  placeholder="https://jouwwebsite.nl"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  disabled={scanning}
                />
              </div>

              {scanResult && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 text-green-800 font-semibold">
                    <CheckCircle2 className="h-5 w-5" />
                    Scan voltooid!
                  </div>
                  <div className="space-y-2 text-sm">
                    <p><strong>Bedrijf:</strong> {scanResult.websiteAnalysis.name}</p>
                    <p><strong>Niche:</strong> {scanResult.nicheAnalysis.primaryNiche}</p>
                    <p><strong>Doelgroep:</strong> {scanResult.websiteAnalysis.targetAudience}</p>
                  </div>
                </div>
              )}

              <Button
                onClick={handleScanWebsite}
                disabled={scanning || !websiteUrl.trim()}
                className="w-full"
                size="lg"
              >
                {scanning ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Website wordt gescand...
                  </>
                ) : scanResult ? (
                  'Opnieuw scannen'
                ) : (
                  'Start Website Scan'
                )}
              </Button>

              {scanResult && (
                <Button
                  onClick={() => setActiveStep('plan')}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  Volgende: Content Plan Genereren →
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Generate Master Plan */}
        {activeStep === 'plan' && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-6 w-6 text-orange-500" />
                Stap 2: Content Plan Genereren
              </CardTitle>
              <CardDescription>
                Kies hoeveel content je per week wilt publiceren
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="articles">Website Artikelen (per week)</Label>
                  <Input
                    id="articles"
                    type="number"
                    min="1"
                    max="10"
                    value={frequency.articles}
                    onChange={(e) => setFrequency({ ...frequency, articles: parseInt(e.target.value) || 1 })}
                  />
                  <p className="text-xs text-gray-500">SEO blog artikelen (1500-3000 woorden)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="socials">Instagram/Facebook Reels (per week)</Label>
                  <Input
                    id="socials"
                    type="number"
                    min="1"
                    max="20"
                    value={frequency.socials}
                    onChange={(e) => setFrequency({ ...frequency, socials: parseInt(e.target.value) || 1 })}
                  />
                  <p className="text-xs text-gray-500">30-60 sec korte video's</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tiktoks">TikTok Reels (per week)</Label>
                  <Input
                    id="tiktoks"
                    type="number"
                    min="1"
                    max="20"
                    value={frequency.tiktoks}
                    onChange={(e) => setFrequency({ ...frequency, tiktoks: parseInt(e.target.value) || 1 })}
                  />
                  <p className="text-xs text-gray-500">15-60 sec viral content</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="youtubeShorts">YouTube Shorts (per week)</Label>
                  <Input
                    id="youtubeShorts"
                    type="number"
                    min="1"
                    max="20"
                    value={frequency.youtubeShorts}
                    onChange={(e) => setFrequency({ ...frequency, youtubeShorts: parseInt(e.target.value) || 1 })}
                  />
                  <p className="text-xs text-gray-500">60 sec informatieve shorts</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Total per week:</strong> {frequency.articles + frequency.socials + frequency.tiktoks + frequency.youtubeShorts} content items
                </p>
                <p className="text-sm text-blue-900 mt-1">
                  <strong>90-dagen plan:</strong> ~{(frequency.articles + frequency.socials + frequency.tiktoks + frequency.youtubeShorts) * 13} content items
                </p>
              </div>

              <Button
                onClick={handleGenerateMasterPlan}
                disabled={generating}
                className="w-full"
                size="lg"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Plan wordt gegenereerd... (dit kan 30-60 sec duren)
                  </>
                ) : (
                  'Genereer 90-dagen Content Plan'
                )}
              </Button>

              <Button
                onClick={() => setActiveStep('scan')}
                variant="outline"
                className="w-full"
              >
                ← Terug naar Website Scan
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Review Plan */}
        {activeStep === 'review' && masterPlan && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-6 w-6 text-orange-500" />
                Stap 3: Review Content Plan
              </CardTitle>
              <CardDescription>
                Je complete 90-dagen content strategie is klaar!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-900 font-semibold mb-2">
                  ✅ Master plan succesvol gegenereerd!
                </p>
                <p className="text-sm text-green-800">
                  {masterPlan.masterPlan?.totalItems || 0} content items gepland over 90 dagen
                </p>
              </div>

              <Tabs defaultValue="articles" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="articles">
                    Artikelen
                    <Badge className="ml-2">{masterPlan.masterPlan?.articles?.length || 0}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="instagram">
                    Instagram
                    <Badge className="ml-2">{masterPlan.masterPlan?.instagramReels?.length || 0}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="tiktok">
                    TikTok
                    <Badge className="ml-2">{masterPlan.masterPlan?.tiktokReels?.length || 0}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="youtube">
                    YouTube
                    <Badge className="ml-2">{masterPlan.masterPlan?.youtubeShorts?.length || 0}</Badge>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="articles" className="space-y-3 mt-4">
                  {masterPlan.masterPlan?.articles?.slice(0, 5).map((article: any, index: number) => (
                    <div key={index} className="border rounded-lg p-3 bg-white">
                      <h4 className="font-semibold text-gray-900">{article.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{article.topic}</p>
                      <div className="flex gap-2 mt-2">
                        {article.keywords?.slice(0, 3).map((kw: string, i: number) => (
                          <Badge key={i} variant="secondary">{kw}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                  <p className="text-sm text-gray-500 text-center">
                    + {(masterPlan.masterPlan?.articles?.length || 5) - 5} meer artikelen...
                  </p>
                </TabsContent>

                <TabsContent value="instagram" className="space-y-3 mt-4">
                  {masterPlan.masterPlan?.instagramReels?.slice(0, 5).map((reel: any, index: number) => (
                    <div key={index} className="border rounded-lg p-3 bg-white">
                      <h4 className="font-semibold text-gray-900">{reel.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">Hook: {reel.hook}</p>
                      <p className="text-sm text-gray-600 mt-1">{reel.topic}</p>
                    </div>
                  ))}
                  <p className="text-sm text-gray-500 text-center">
                    + {(masterPlan.masterPlan?.instagramReels?.length || 5) - 5} meer reels...
                  </p>
                </TabsContent>

                <TabsContent value="tiktok" className="space-y-3 mt-4">
                  {masterPlan.masterPlan?.tiktokReels?.slice(0, 5).map((reel: any, index: number) => (
                    <div key={index} className="border rounded-lg p-3 bg-white">
                      <h4 className="font-semibold text-gray-900">{reel.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">Hook: {reel.hook}</p>
                      <p className="text-sm text-gray-600 mt-1">{reel.topic}</p>
                    </div>
                  ))}
                  <p className="text-sm text-gray-500 text-center">
                    + {(masterPlan.masterPlan?.tiktokReels?.length || 5) - 5} meer reels...
                  </p>
                </TabsContent>

                <TabsContent value="youtube" className="space-y-3 mt-4">
                  {masterPlan.masterPlan?.youtubeShorts?.slice(0, 5).map((short: any, index: number) => (
                    <div key={index} className="border rounded-lg p-3 bg-white">
                      <h4 className="font-semibold text-gray-900">{short.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">Hook: {short.hook}</p>
                      <p className="text-sm text-gray-600 mt-1">{short.topic}</p>
                    </div>
                  ))}
                  <p className="text-sm text-gray-500 text-center">
                    + {(masterPlan.masterPlan?.youtubeShorts?.length || 5) - 5} meer shorts...
                  </p>
                </TabsContent>
              </Tabs>

              <Button
                onClick={handleActivateAutomation}
                className="w-full"
                size="lg"
              >
                <Rocket className="mr-2 h-5 w-5" />
                Activeer Automatisering →
              </Button>

              <Button
                onClick={() => setActiveStep('plan')}
                variant="outline"
                className="w-full"
              >
                ← Terug naar Frequentie Instellen
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Activated */}
        {activeStep === 'activate' && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
                Automatisering Geactiveerd! 🎉
              </CardTitle>
              <CardDescription>
                Je content wordt nu automatisch gegenereerd en gepubliceerd
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <Rocket className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-green-900 mb-2">
                  Je bent klaar om te gaan!
                </h3>
                <p className="text-green-800">
                  Onze AI start nu met het genereren van je content volgens het plan.
                  Je ontvangt updates in je dashboard.
                </p>
              </div>

              <Button
                onClick={() => router.push('/client-portal')}
                className="w-full"
                size="lg"
              >
                Ga naar Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
