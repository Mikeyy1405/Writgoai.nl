
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Coins, Sparkles, Check, Zap, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

// WritgoAI brand colors
const BRAND_COLORS = {
  navy: '#000814',
  orange: '#FFA500',
};

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  priceEur: number;
  discount: number;
  popular: boolean;
  description: string;
  features: string[];
}

interface CreditPaywallProps {
  isOpen: boolean;
  onClose: () => void;
  requiredCredits?: number;
  currentCredits: number;
  onPurchaseComplete?: () => void;
  hasActiveSubscription?: boolean; // Nieuw: check of er een actief abonnement is
}

export default function CreditPaywall({
  isOpen,
  onClose,
  requiredCredits,
  currentCredits,
  onPurchaseComplete,
  hasActiveSubscription = false
}: CreditPaywallProps) {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // ✅ AANGEPAST: Geen subscription check meer - gebruikers kunnen altijd credits kopen
      // Dit zorgt ervoor dat de SEO writer ook werkt zonder actief abonnement
      loadPackages();
    }
  }, [isOpen, onClose]);

  async function loadPackages() {
    try {
      const res = await fetch('/api/credits/packages');
      if (res.ok) {
        const data = await res.json();
        setPackages(data.packages);
      }
    } catch (error) {
      console.error('Failed to load packages:', error);
      toast.error('Kon pakketten niet laden');
    } finally {
      setLoading(false);
    }
  }

  async function handlePurchase(packageId: string) {
    setPurchasing(packageId);
    
    try {
      const res = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId })
      });

      if (!res.ok) {
        throw new Error('Purchase failed');
      }

      const data = await res.json();
      
      if (data.checkoutUrl) {
        // Redirect naar Stripe checkout
        window.location.href = data.checkoutUrl;
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Kon betaling niet starten');
      setPurchasing(null);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: BRAND_COLORS.orange }}
            >
              <Coins className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl" style={{ color: BRAND_COLORS.navy }}>
                Koop Credits
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                Je hebt momenteel <strong>{currentCredits.toFixed(1)}</strong> credits
                {requiredCredits && ` • ${requiredCredits.toFixed(1)} credits nodig`}
              </p>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4 mt-6">
            {packages.map((pkg) => (
              <Card
                key={pkg.id}
                className={`relative ${
                  pkg.popular 
                    ? 'border-orange-500 border-2 shadow-lg' 
                    : 'border-zinc-800'
                }`}
              >
                {pkg.popular && (
                  <Badge 
                    className="absolute -top-3 left-1/2 -translate-x-1/2 text-white"
                    style={{ backgroundColor: BRAND_COLORS.orange }}
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    Populairste
                  </Badge>
                )}

                <CardHeader>
                  <CardTitle style={{ color: BRAND_COLORS.navy }}>
                    {pkg.name}
                  </CardTitle>
                  <CardDescription>{pkg.description}</CardDescription>
                  
                  <div className="mt-4">
                    <div className="flex items-baseline gap-2">
                      <span 
                        className="text-4xl font-bold"
                        style={{ color: BRAND_COLORS.navy }}
                      >
                        €{pkg.priceEur.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Coins className="w-5 h-5" style={{ color: BRAND_COLORS.orange }} />
                      <span className="text-2xl font-semibold" style={{ color: BRAND_COLORS.orange }}>
                        {pkg.credits}
                      </span>
                      <span className="text-sm text-gray-500">credits</span>
                    </div>
                    {pkg.discount > 0 && (
                      <Badge variant="outline" className="mt-2">
                        {pkg.discount}% korting
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-2">
                    {pkg.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: BRAND_COLORS.orange }} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    disabled={purchasing !== null}
                    onClick={() => handlePurchase(pkg.id)}
                    style={{ 
                      backgroundColor: pkg.popular ? BRAND_COLORS.orange : BRAND_COLORS.navy,
                      color: 'white'
                    }}
                  >
                    {purchasing === pkg.id ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Laden...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Koop Nu
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">
                Hoe werken credits?
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 1 credit ≈ 10 AI chat berichten (basis modellen)</li>
                <li>• Geavanceerde modellen kosten meer credits</li>
                <li>• Credits verlopen nooit</li>
                <li>• Veilige betaling via Stripe</li>
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
