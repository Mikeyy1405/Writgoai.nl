
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Mail, Send, Users, Calendar, Gift, Zap } from 'lucide-react';

export function EmailCampaignManager() {
  const [campaignType, setCampaignType] = useState<'onboarding' | 'promotional'>('onboarding');
  const [emailNumber, setEmailNumber] = useState<string>('1');
  const [promoType, setPromoType] = useState<string>('black-friday');
  const [discountCode, setDiscountCode] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('30');
  const [expiryDate, setExpiryDate] = useState('');
  const [targetAudience, setTargetAudience] = useState('all');
  const [sending, setSending] = useState(false);

  const handleSendCampaign = async () => {
    // Validation
    if (campaignType === 'promotional') {
      if (!discountCode || !discountPercentage || !expiryDate) {
        toast.error('Vul alle promotie velden in');
        return;
      }
    }

    setSending(true);

    try {
      const response = await fetch('/api/admin/email-campaigns/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignType,
          emailNumber: campaignType === 'onboarding' ? parseInt(emailNumber) : undefined,
          promoType: campaignType === 'promotional' ? promoType : undefined,
          discountCode: campaignType === 'promotional' ? discountCode : undefined,
          discountPercentage: campaignType === 'promotional' ? parseInt(discountPercentage) : undefined,
          expiryDate: campaignType === 'promotional' ? expiryDate : undefined,
          targetAudience,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Email campagne verzonden! ${data.sent}/${data.total} emails succesvol verstuurd`);
        
        if (data.failed > 0) {
          toast.warning(`${data.failed} emails gefaald. Check de logs voor details.`);
        }

        // Reset form
        setDiscountCode('');
        setExpiryDate('');
      } else {
        toast.error(data.error || 'Fout bij verzenden email campagne');
      }
    } catch (error: any) {
      console.error('Error sending campaign:', error);
      toast.error('Fout bij verzenden email campagne');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Onboarding Emails Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              <CardTitle>Onboarding Email Reeks</CardTitle>
            </div>
            <CardDescription>
              Automatische email serie die nieuwe klanten ontvangen (5 emails)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email in de reeks</Label>
              <Select value={emailNumber} onValueChange={setEmailNumber}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Email 1: Welkom & Eerste Stappen</SelectItem>
                  <SelectItem value="2">Email 2: SEO Tips</SelectItem>
                  <SelectItem value="3">Email 3: Autopilot Uitleg</SelectItem>
                  <SelectItem value="4">Email 4: Affiliate Marketing</SelectItem>
                  <SelectItem value="5">Email 5: Referral Programma</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-2">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                ℹ️ Automatische Verzending
              </h4>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Deze emails worden automatisch verzonden op dag 0, 1, 3, 5 en 7 na aanmelding.
                Je kunt ze ook handmatig versturen naar specifieke groepen.
              </p>
            </div>

            <Button
              onClick={() => {
                setCampaignType('onboarding');
                handleSendCampaign();
              }}
              disabled={sending}
              className="w-full"
            >
              {sending ? (
                <>
                  <Zap className="mr-2 h-4 w-4 animate-spin" />
                  Verzenden...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Verstuur Onboarding Email
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Promotional Emails Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-orange-600" />
              <CardTitle>Promotionele Emails</CardTitle>
            </div>
            <CardDescription>
              Feestdagen en speciale acties (Black Friday, Kerst, Nieuwjaar)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Promotie Type</Label>
              <Select value={promoType} onValueChange={setPromoType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="black-friday">🖤 Black Friday</SelectItem>
                  <SelectItem value="christmas">🎄 Kerst</SelectItem>
                  <SelectItem value="new-year">🎊 Nieuwjaar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Korting Code</Label>
                <Input
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                  placeholder="BLACKFRIDAY30"
                />
              </div>

              <div className="space-y-2">
                <Label>Korting %</Label>
                <Input
                  type="number"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(e.target.value)}
                  placeholder="30"
                  min="5"
                  max="75"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Einddatum</Label>
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>

            <Button
              onClick={() => {
                setCampaignType('promotional');
                handleSendCampaign();
              }}
              disabled={sending || !discountCode || !expiryDate}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {sending ? (
                <>
                  <Zap className="mr-2 h-4 w-4 animate-spin" />
                  Verzenden...
                </>
              ) : (
                <>
                  <Gift className="mr-2 h-4 w-4" />
                  Verstuur Promotie Email
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Target Audience Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            <CardTitle>Doelgroep Selectie</CardTitle>
          </div>
          <CardDescription>
            Kies welke klanten deze email moeten ontvangen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <button
              onClick={() => setTargetAudience('all')}
              className={`p-4 rounded-lg border-2 transition-colors ${
                targetAudience === 'all'
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-950'
                  : 'border-gray-200 dark:border-gray-800 hover:border-purple-300'
              }`}
            >
              <Users className="h-6 w-6 mx-auto mb-2 text-purple-600" />
              <h4 className="font-semibold text-sm">Alle Klanten</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Stuur naar iedereen
              </p>
            </button>

            <button
              onClick={() => setTargetAudience('new')}
              className={`p-4 rounded-lg border-2 transition-colors ${
                targetAudience === 'new'
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950'
                  : 'border-gray-200 dark:border-gray-800 hover:border-blue-300'
              }`}
            >
              <Zap className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <h4 className="font-semibold text-sm">Nieuwe Klanten</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                &lt; 30 dagen geleden
              </p>
            </button>

            <button
              onClick={() => setTargetAudience('active')}
              className={`p-4 rounded-lg border-2 transition-colors ${
                targetAudience === 'active'
                  ? 'border-green-600 bg-green-50 dark:bg-green-950'
                  : 'border-gray-200 dark:border-gray-800 hover:border-green-300'
              }`}
            >
              <Calendar className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <h4 className="font-semibold text-sm">Actieve Klanten</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Met abonnement
              </p>
            </button>

            <button
              onClick={() => setTargetAudience('inactive')}
              className={`p-4 rounded-lg border-2 transition-colors ${
                targetAudience === 'inactive'
                  ? 'border-orange-600 bg-orange-50 dark:bg-orange-950'
                  : 'border-gray-200 dark:border-gray-800 hover:border-orange-300'
              }`}
            >
              <Mail className="h-6 w-6 mx-auto mb-2 text-orange-600" />
              <h4 className="font-semibold text-sm">Inactieve Klanten</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Zonder abonnement
              </p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Email Statistieken</CardTitle>
          <CardDescription>Overzicht van verzonden emails deze maand</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">-</div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Verzonden</div>
            </div>
            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">-</div>
              <div className="text-sm text-green-600 dark:text-green-400">Geopend</div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">-</div>
              <div className="text-sm text-orange-600 dark:text-orange-400">Geklikt</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">-</div>
              <div className="text-sm text-purple-600 dark:text-purple-400">Actieve Campagnes</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
