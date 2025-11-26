
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Check, ExternalLink, Loader2, AlertCircle, Crown, ArrowLeft, Share2, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface SubscriptionPackage {
  id: string;
  name: string;
  displayName: string;
  description: string;
  monthlyPrice: number;
  articlesPerMonth: number;
  reelsFrequency: string;
  features: string[];
  isPopular: boolean;
}

interface ClientData {
  id: string;
  name: string;
  email: string;
  bufferEmail: string | null;
  bufferConnected: boolean;
  bufferConnectedAt: string | null;
  ClientSubscription: {
    id: string;
    status: string;
    startDate: string;
    nextBillingDate: string | null;
    articlesUsed: number;
    reelsUsed: number;
    Package: SubscriptionPackage;
  } | null;
}

export default function SubscriptionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [bufferEmail, setBufferEmail] = useState('');
  const [savingBuffer, setSavingBuffer] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/client-login');
    } else if (session?.user?.role !== 'client') {
      router.push('/login');
    } else {
      fetchClientData();
    }
  }, [status, session, router]);

  const fetchClientData = async () => {
    try {
      const res = await fetch('/api/client/profile');
      if (res.ok) {
        const data = await res.json();
        setClientData(data);
        setBufferEmail(data.bufferEmail || '');
      }
    } catch (error) {
      console.error('Error fetching client data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBufferEmail = async () => {
    setSavingBuffer(true);
    try {
      const res = await fetch('/api/client/buffer-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bufferEmail })
      });

      if (res.ok) {
        toast({
          title: 'Buffer-account bijgewerkt',
          description: 'Je Buffer e-mailadres is succesvol opgeslagen.',
        });
        fetchClientData();
      } else {
        throw new Error('Failed to update Buffer email');
      }
    } catch (error) {
      toast({
        title: 'Fout',
        description: 'Er is een fout opgetreden bij het opslaan van je Buffer e-mailadres.',
        variant: 'destructive',
      });
    } finally {
      setSavingBuffer(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        </div>
      </div>
    );
  }

  const subscription = clientData?.ClientSubscription;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/client-portal')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Terug naar dashboard
          </Button>
        </div>
        <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Mijn Abonnement</h1>
          <p className="text-slate-600">Beheer je abonnement en Buffer-integratie</p>
        </div>

        {/* Current Subscription */}
        {subscription ? (
          <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Crown className="w-6 h-6 text-orange-500" />
                    {subscription.Package.name}
                  </CardTitle>
                  <CardDescription className="text-lg mt-1">
                    {subscription.Package.displayName}
                  </CardDescription>
                </div>
                <Badge 
                  variant={subscription.status === 'ACTIVE' ? 'default' : 'secondary'}
                  className={subscription.status === 'ACTIVE' ? 'bg-green-500' : ''}
                >
                  {subscription.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 border border-orange-100">
                  <div className="text-sm text-slate-600 mb-1">Prijs</div>
                  <div className="text-2xl font-bold text-orange-600">
                    €{subscription.Package.monthlyPrice}
                    <span className="text-sm text-slate-600 ml-1">/ maand</span>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-orange-100">
                  <div className="text-sm text-slate-600 mb-1">Artikelen gebruikt</div>
                  <div className="text-2xl font-bold text-slate-900">
                    {subscription.articlesUsed} / {subscription.Package.articlesPerMonth}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-orange-100">
                  <div className="text-sm text-slate-600 mb-1">Reels frequentie</div>
                  <div className="text-lg font-bold text-slate-900">
                    {subscription.Package.reelsFrequency}
                  </div>
                </div>
              </div>

              {subscription.nextBillingDate && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm text-blue-900">
                    Volgende factuurdatum: <strong>{new Date(subscription.nextBillingDate).toLocaleDateString('nl-NL')}</strong>
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold text-slate-900 mb-3">Inbegrepen in je pakket:</h4>
                <div className="grid md:grid-cols-2 gap-2">
                  {subscription.Package.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t">
                <Link href="/client-portal/upgrade">
                  <Button className="w-full bg-gradient-to-r from-[#FF6B35] to-[#F7931E] hover:opacity-90 text-white">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Upgrade Naar Hoger Pakket
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle>Geen actief abonnement</CardTitle>
              <CardDescription>
                Je hebt momenteel geen actief abonnement. Neem contact op met support.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Buffer Setup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-blue-600" />
              Buffer Integratie
            </CardTitle>
            <CardDescription>
              Verbind je Buffer-account voor automatische social media planning
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {clientData?.bufferConnected ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-green-900 mb-1">Buffer verbonden!</div>
                    <div className="text-sm text-green-700 mb-2">
                      Je Buffer-account is succesvol gekoppeld. We kunnen nu automatisch content inplannen op je social media kanalen.
                    </div>
                    <div className="text-xs text-green-600">
                      Buffer e-mail: <strong>{clientData.bufferEmail}</strong>
                    </div>
                    {clientData.bufferConnectedAt && (
                      <div className="text-xs text-green-600">
                        Verbonden op: {new Date(clientData.bufferConnectedAt).toLocaleString('nl-NL')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-orange-900 mb-1">Buffer nog niet verbonden</div>
                    <div className="text-sm text-orange-700">
                      Je Buffer-account is nog niet gekoppeld. Volg de onderstaande stappen om de integratie te voltooien.
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-slate-900 mb-3">Hoe Buffer instellen:</h4>
                <ol className="space-y-3 text-sm text-slate-700">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-semibold">1</span>
                    <span>
                      Ga naar <a href="https://buffer.com" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline inline-flex items-center gap-1">
                        buffer.com <ExternalLink className="w-3 h-3" />
                      </a> en maak een account aan (of log in)
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-semibold">2</span>
                    <span>Koppel je social media kanalen (Instagram, Facebook, LinkedIn, TikTok, etc.)</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-semibold">3</span>
                    <span>Voer hieronder het e-mailadres in dat je bij Buffer gebruikt</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-semibold">4</span>
                    <span>Wij plannen automatisch je content in via Buffer</span>
                  </li>
                </ol>
              </div>

              <div className="pt-4 border-t">
                <Label htmlFor="bufferEmail" className="text-slate-900 mb-2 block">
                  Buffer E-mailadres
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="bufferEmail"
                    type="email"
                    placeholder="jouw@email.com"
                    value={bufferEmail}
                    onChange={(e) => setBufferEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSaveBufferEmail}
                    disabled={savingBuffer || !bufferEmail}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    {savingBuffer ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Opslaan...
                      </>
                    ) : (
                      'Opslaan'
                    )}
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Na het opslaan kunnen wij je content automatisch inplannen via je Buffer-account.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}
