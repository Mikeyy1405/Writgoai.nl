'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { BrandLogo } from '@/components/brand/brand-logo';

interface MarketingStatus {
  isSetup: boolean;
  clientId?: string;
  projectId?: string;
  hasAutomation?: boolean;
  connectedPlatforms?: string[];
}

export default function WritgoMarketingSetupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [marketingStatus, setMarketingStatus] = useState<MarketingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupLoading, setSetupLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/client-login');
    } else if (status === 'authenticated') {
      // Check if user is admin
      if (session?.user?.email !== 'info@writgo.nl') {
        router.push('/client-portal');
        return;
      }
      loadMarketingStatus();
    }
  }, [status, session, router]);

  async function loadMarketingStatus() {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/writgo/marketing-status');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load marketing status');
      }
      
      const data = await response.json();
      setMarketingStatus(data);
    } catch (error: any) {
      console.error('Failed to load marketing status:', error);
      setError(error.message || 'Failed to load marketing status');
    } finally {
      setLoading(false);
    }
  }

  async function setupWritgoClient() {
    try {
      setSetupLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/writgo/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to setup Writgo.nl client');
      }
      
      const data = await response.json();
      
      // Reload the marketing status
      await loadMarketingStatus();
      
      // Show success message
      alert('Writgo.nl is succesvol opgezet als interne klant!');
    } catch (error: any) {
      console.error('Failed to setup Writgo.nl:', error);
      setError(error.message || 'Failed to setup Writgo.nl client');
      alert('Fout bij het opzetten van Writgo.nl: ' + error.message);
    } finally {
      setSetupLoading(false);
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-400">Laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <BrandLogo size="lg" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Writgo.nl Marketing Setup</h1>
          <p className="text-gray-400">
            Start met het opzetten van Writgo.nl als interne klant om je eigen marketing te automatiseren
            met dezelfde flow die je aan klanten verkoopt.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-500 font-medium">Error</p>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Marketing Status Card */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-orange-500" />
              Marketing Status
            </CardTitle>
            <CardDescription className="text-gray-400">
              Controleer of Writgo.nl als interne klant is opgezet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {marketingStatus?.isSetup ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                  <div>
                    <p className="text-green-500 font-medium">Writgo.nl is opgezet als interne klant</p>
                    <p className="text-green-400/70 text-sm">Je kunt nu je eigen marketing automatiseren</p>
                  </div>
                </div>

                {/* Status Details */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                    <span className="text-gray-400">Client ID</span>
                    <span className="text-white font-mono text-sm">{marketingStatus.clientId}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                    <span className="text-gray-400">Project ID</span>
                    <span className="text-white font-mono text-sm">{marketingStatus.projectId}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                    <span className="text-gray-400">Automation Active</span>
                    <span className={`font-medium ${
                      marketingStatus.hasAutomation ? 'text-green-500' : 'text-yellow-500'
                    }`}>
                      {marketingStatus.hasAutomation ? 'Actief' : 'Inactief'}
                    </span>
                  </div>
                  {marketingStatus.connectedPlatforms && marketingStatus.connectedPlatforms.length > 0 && (
                    <div className="p-3 bg-gray-800 rounded-lg">
                      <span className="text-gray-400 block mb-2">Verbonden Platforms</span>
                      <div className="flex flex-wrap gap-2">
                        {marketingStatus.connectedPlatforms.map((platform) => (
                          <span key={platform} className="px-3 py-1 bg-orange-500/10 text-orange-500 rounded-full text-sm">
                            {platform}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => router.push('/client-portal')}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    Open Client Portal
                  </Button>
                  <Button
                    onClick={() => router.push('/admin/clients/' + marketingStatus.clientId)}
                    variant="outline"
                    className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    Beheer Client
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-6 bg-gray-800 rounded-lg text-center space-y-4">
                  <Sparkles className="h-12 w-12 text-orange-500 mx-auto" />
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Writgo.nl is nog niet opgezet
                    </h3>
                    <p className="text-gray-400">
                      Klik op de knop hieronder om Writgo.nl als interne klant op te zetten.
                      Dit maakt het mogelijk om je eigen marketing te automatiseren met dezelfde flow
                      die je aan klanten verkoopt.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={setupWritgoClient}
                  disabled={setupLoading}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 text-lg"
                >
                  {setupLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Opzetten...
                    </>
                  ) : (
                    'Setup Writgo.nl Client'
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Wat gebeurt er bij setup?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <span>Writgo.nl wordt geregistreerd als interne klant in het systeem</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <span>Een standaard project wordt aangemaakt voor content management</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <span>Toegang tot blog en social media automation wordt ingeschakeld</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <span>Je kunt dezelfde functionaliteit gebruiken die externe klanten krijgen</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
