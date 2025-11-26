
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Check, Sparkles, Loader2, ArrowLeft, Crown, TrendingUp } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_live_Sos9BAzmaKJ3ggUXQxOJkMWG');

interface SubscriptionPackage {
  id: string;
  tier: string;
  displayName: string;
  description: string;
  monthlyPrice: number;
  serviceType: string;
  articlesPerMonth: number | null;
  reelsFrequency: string | null;
  features: string[];
  isPopular: boolean;
  order: number;
}

interface CurrentSubscription {
  id: string;
  status: string;
  Package: SubscriptionPackage;
}

export default function UpgradePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/client-login');
    } else if (session?.user?.role !== 'client') {
      router.push('/login');
    } else {
      fetchData();
    }
  }, [status, session, router]);

  const fetchData = async () => {
    try {
      // Fetch current subscription
      const subResponse = await fetch('/api/client/subscriptions');
      if (subResponse.ok) {
        const subs = await subResponse.json();
        const active = subs.find((s: CurrentSubscription) => s.status === 'ACTIVE');
        setCurrentSubscription(active);
      }

      // Fetch available packages
      const pkgResponse = await fetch('/api/packages');
      if (pkgResponse.ok) {
        const data = await pkgResponse.json();
        setPackages(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (packageId: string) => {
    setUpgrading(packageId);
    
    try {
      // Create checkout session for upgrade
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          packageId,
          isUpgrade: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      toast({
        title: 'Fout',
        description: 'Er ging iets mis bij het upgraden. Probeer het opnieuw.',
        variant: 'destructive',
      });
      setUpgrading(null);
    }
  };

  const isCurrentPackage = (packageId: string) => {
    return currentSubscription?.Package.id === packageId;
  };

  const canUpgradeTo = (pkg: SubscriptionPackage) => {
    if (!currentSubscription) return true;
    
    // Check if same service type
    if (pkg.serviceType !== currentSubscription.Package.serviceType) return false;
    
    // Can only upgrade to more expensive packages
    return pkg.monthlyPrice > currentSubscription.Package.monthlyPrice;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Laden...</p>
        </div>
      </div>
    );
  }

  // Group packages by service type
  const serviceType = currentSubscription?.Package.serviceType || 'full';
  const availablePackages = packages
    .filter(pkg => pkg.serviceType === serviceType)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0B3C5D] to-[#1565A6] text-white py-16">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/client-portal/subscription')}
            className="mb-4 text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Terug naar abonnement
          </Button>
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 flex items-center justify-center gap-3">
              <TrendingUp className="w-10 h-10" />
              Upgrade Je Abonnement
            </h1>
            <p className="text-lg text-blue-100">
              Krijg meer content, meer functies en betere resultaten
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Current Package Info */}
        {currentSubscription && (
          <div className="max-w-4xl mx-auto mb-12">
            <Card className="border-[#FF6B35] bg-gradient-to-br from-orange-50 to-white">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-5 h-5 text-[#FF6B35]" />
                  <CardTitle>Je Huidige Pakket</CardTitle>
                </div>
                <CardDescription>
                  Je gebruikt nu: <strong>{currentSubscription.Package.displayName}</strong> voor €{currentSubscription.Package.monthlyPrice}/maand
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Available Packages */}
        <div className="grid gap-8 md:grid-cols-3 max-w-7xl mx-auto">
          {availablePackages.map((pkg) => {
            const isCurrent = isCurrentPackage(pkg.id);
            const canUpgrade = canUpgradeTo(pkg);

            return (
              <Card
                key={pkg.id}
                className={`relative ${
                  isCurrent
                    ? 'border-[#FF6B35] border-2 scale-105'
                    : pkg.isPopular
                    ? 'border-[#FF6B35] shadow-lg shadow-[#FF6B35]/20'
                    : 'border-border'
                }`}
              >
                {isCurrent && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-[#FF6B35]">
                      <Crown className="w-3 h-3 mr-1" />
                      Huidig Pakket
                    </Badge>
                  </div>
                )}

                {!isCurrent && pkg.isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-[#FF6B35] to-[#F7931E] text-white">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Meest Gekozen
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-8 pt-6">
                  <CardTitle className="text-2xl font-bold text-[#0B3C5D]">
                    {pkg.tier}
                  </CardTitle>
                  <CardDescription className="mt-2">{pkg.description}</CardDescription>
                  <div className="mt-4">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-5xl font-bold text-[#FF6B35]">
                        €{pkg.monthlyPrice}
                      </span>
                      <span className="text-muted-foreground">/ maand</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {pkg.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-[#FF6B35] shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => handleUpgrade(pkg.id)}
                    disabled={upgrading === pkg.id || isCurrent || !canUpgrade}
                    className={`w-full ${
                      isCurrent
                        ? 'bg-gray-400 cursor-not-allowed'
                        : canUpgrade
                        ? 'bg-gradient-to-r from-[#FF6B35] to-[#F7931E] hover:opacity-90'
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {upgrading === pkg.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Laden...
                      </>
                    ) : isCurrent ? (
                      'Huidig Pakket'
                    ) : canUpgrade ? (
                      <>
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Upgrade Nu
                      </>
                    ) : (
                      'Niet beschikbaar'
                    )}
                  </Button>

                  {!isCurrent && !canUpgrade && currentSubscription && (
                    <p className="text-xs text-center text-gray-500">
                      Downgraden? Neem contact op met support
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info Box */}
        <div className="max-w-4xl mx-auto mt-12">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <Sparkles className="w-6 h-6 text-blue-600 flex-shrink-0" />
                <div className="space-y-2 text-sm text-gray-700">
                  <p>
                    <strong>Hoe werkt upgraden?</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Je betaalt direct het verschil voor de resterende periode</li>
                    <li>Je nieuwe pakket gaat meteen in</li>
                    <li>Je volgende factuur is voor het nieuwe pakket</li>
                    <li>Je huidige gebruik blijft behouden</li>
                  </ul>
                  <p className="text-xs text-gray-600 mt-3">
                    Vragen over upgraden of downgraden? Neem contact met ons op via support.
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
