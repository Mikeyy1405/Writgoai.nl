
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Coins, Zap, TrendingUp, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface CreditPackage {
  id: string;
  credits: number;
  price: number;
  popular?: boolean;
  bonus?: number;
}

export default function BuyCreditsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [hasSubscription, setHasSubscription] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/client-login');
      return;
    }

    if (status === 'authenticated') {
      checkSubscription();
    }
  }, [status, router]);

  const checkSubscription = async () => {
    try {
      const response = await fetch('/api/client/subscription');
      const data = await response.json();
      setHasSubscription(data.hasActiveSubscription);
      
      if (!data.hasActiveSubscription) {
        toast.error('Je hebt een actief abonnement nodig om extra credits te kopen');
        router.push('/prijzen');
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const creditPackages: CreditPackage[] = [
    {
      id: 'credits_500',
      credits: 500,
      price: 17.00,
    },
    {
      id: 'credits_1000',
      credits: 1000,
      price: 32.00,
      popular: true,
    },
    {
      id: 'credits_2500',
      credits: 2500,
      price: 75.00,
    },
  ];

  const handleBuyCredits = async (packageId: string) => {
    setBuyingId(packageId);
    try {
      const response = await fetch('/api/moneybird/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Er ging iets mis');
      }

      if (data.success) {
        toast.success(data.message || 'Factuur aangemaakt! Check je email voor de betaalinstructies.');
        setTimeout(() => {
          router.push('/client-portal');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Buy credits error:', error);
      toast.error(error.message || 'Er ging iets mis bij het kopen van credits');
    } finally {
      setBuyingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#ff6b35]" />
      </div>
    );
  }

  if (!hasSubscription) {
    return null; // Will redirect to pricing page
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 bg-[#ff6b35]/20 text-orange-400 px-4 py-2 rounded-full font-semibold mb-4 border border-orange-500/30">
          <Coins className="w-4 h-4" />
          Extra Credits
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">Koop Extra Credits</h1>
        <p className="text-gray-400 text-lg">
          Heb je meer credits nodig? Koop eenmalig extra credits bij
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8 max-w-4xl mx-auto">
        {creditPackages.map((pkg) => (
          <Card
            key={pkg.id}
            className={`bg-gray-800/50 border-2 ${
              pkg.popular ? 'border-orange-500 shadow-lg' : 'border-gray-700'
            } hover:border-orange-500/50 transition-all`}
          >
            {pkg.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-[#ff6b35] text-white px-3 py-1">
                  Populair
                </Badge>
              </div>
            )}
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-3">
                <div className={`p-3 rounded-full ${pkg.popular ? 'bg-[#ff6b35]/20' : 'bg-gray-700/50'}`}>
                  {pkg.bonus ? (
                    <Sparkles className={`w-6 h-6 ${pkg.popular ? 'text-orange-400' : 'text-gray-400'}`} />
                  ) : (
                    <Coins className={`w-6 h-6 ${pkg.popular ? 'text-orange-400' : 'text-gray-400'}`} />
                  )}
                </div>
              </div>
              <CardTitle className="text-3xl font-bold text-white mb-2">
                {pkg.credits}
                {pkg.bonus && <span className="text-orange-400"> +{pkg.bonus}</span>}
              </CardTitle>
              <CardDescription>credits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">
                  €{pkg.price.toFixed(2)}
                </div>
                <div className="text-sm text-gray-400">
                  €{(pkg.price / (pkg.credits + (pkg.bonus || 0))).toFixed(2)} per credit
                </div>
              </div>

              {pkg.bonus && (
                <div className="bg-[#ff6b35]/10 border border-orange-500/30 rounded-lg p-2 text-center">
                  <p className="text-orange-400 text-sm font-semibold">
                    🎁 +{pkg.bonus} bonus credits!
                  </p>
                </div>
              )}

              <Button
                onClick={() => handleBuyCredits(pkg.id)}
                disabled={buyingId !== null}
                className={`w-full ${
                  pkg.popular
                    ? 'bg-[#ff6b35] hover:bg-orange-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
              >
                {buyingId === pkg.id ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Laden...
                  </>
                ) : (
                  'Kopen'
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Section */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">💡 Over Extra Credits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-gray-300">
          <p>
            • Extra credits blijven <strong className="text-white">altijd beschikbaar</strong> en verlopen nooit
          </p>
          <p>
            • Je maandelijkse abonnement credits worden eerst gebruikt, daarna je extra credits
          </p>
          <p>
            • Ideaal voor drukke periodes of wanneer je extra content nodig hebt
          </p>
          <p>
            • Credits zijn direct na betaling beschikbaar
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}
