
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Users,
  DollarSign,
  TrendingUp,
  Copy,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Gift,
  Sparkles,
  AlertCircle,
  ExternalLink,
  Calendar,
  Euro,
  CreditCard,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function AffiliatePage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  
  // Payout dialog state
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('bank_transfer');
  const [payoutDetails, setPayoutDetails] = useState('');
  const [requestingPayout, setRequestingPayout] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/client-login');
      return;
    }

    if (status === 'authenticated') {
      loadAffiliateData();
    }
  }, [status, router]);

  const loadAffiliateData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/client/affiliate/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      } else {
        toast.error(data.error || 'Kon affiliate data niet laden');
      }
    } catch (error) {
      console.error('Error loading affiliate data:', error);
      toast.error('Er ging iets mis bij het laden van de gegevens');
    } finally {
      setLoading(false);
    }
  };

  const generateAffiliateCode = async () => {
    setGeneratingCode(true);
    try {
      const response = await fetch('/api/client/affiliate/generate-code', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        await loadAffiliateData(); // Reload to get new code
      } else {
        toast.error(data.error || 'Kon affiliate code niet genereren');
      }
    } catch (error) {
      console.error('Error generating code:', error);
      toast.error('Er ging iets mis');
    } finally {
      setGeneratingCode(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`${label} gekopieerd!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRequestPayout = async () => {
    const amount = parseFloat(payoutAmount);
    
    if (!amount || amount <= 0) {
      toast.error('Voer een geldig bedrag in');
      return;
    }

    if (amount > stats?.earnings?.available) {
      toast.error('Onvoldoende saldo');
      return;
    }

    if (amount < 50) {
      toast.error('Minimum uitbetaling is €50');
      return;
    }

    setRequestingPayout(true);
    try {
      const response = await fetch('/api/client/affiliate/request-payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          paymentMethod: payoutMethod,
          paymentDetails: payoutDetails ? JSON.parse(payoutDetails) : {},
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        setShowPayoutDialog(false);
        setPayoutAmount('');
        setPayoutDetails('');
        await loadAffiliateData(); // Reload stats
      } else {
        toast.error(data.error || 'Kon uitbetaling niet aanvragen');
      }
    } catch (error) {
      console.error('Error requesting payout:', error);
      toast.error('Er ging iets mis');
    } finally {
      setRequestingPayout(false);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-[#ff6b35]" />
      </div>
    );
  }

  const affiliateUrl = stats?.affiliateCode 
    ? `https://WritgoAI.nl/registreren?ref=${stats.affiliateCode}`
    : '';

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/client-portal">
            <Button variant="ghost" className="mb-4 text-gray-300 hover:text-white hover:bg-zinc-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Terug naar overzicht
            </Button>
          </Link>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-[#ff6b35] to-[#ff8c42] rounded-xl shadow-lg">
              <Gift className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">
                Affiliate Portal
              </h1>
              <p className="text-gray-300 text-lg mt-1">
                Verdien 10% commissie op elke verwijzing
              </p>
            </div>
          </div>
        </div>

        {/* Affiliate Code Section */}
        {!stats?.affiliateCode ? (
          <Card className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border-[#ff6b35]/30 shadow-lg mb-8">
            <CardContent className="p-8 text-center">
              <Sparkles className="w-16 h-16 text-[#ff6b35] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">
                Word WritgoAI Partner!
              </h2>
              <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                Genereer je unieke affiliate code en begin met het verdienen van 10% commissie op alle betalingen van gebruikers die je verwijst. Geen limiet, geen vervaldatum!
              </p>
              <Button
                onClick={generateAffiliateCode}
                disabled={generatingCode}
                className="bg-[#ff6b35] hover:bg-[#ff8c42] text-white text-lg px-8 py-6"
              >
                {generatingCode ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Genereren...
                  </>
                ) : (
                  <>
                    <Gift className="w-5 h-5 mr-2" />
                    Genereer Mijn Affiliate Code
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Affiliate Links */}
            <Card className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border-[#ff6b35]/30 shadow-lg mb-8">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Jouw Affiliate Links</h2>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-300 mb-2 block">Affiliate Code</Label>
                    <div className="flex gap-2">
                      <Input
                        value={stats.affiliateCode}
                        readOnly
                        className="bg-zinc-800 border-zinc-700 text-white font-mono text-lg"
                      />
                      <Button
                        onClick={() => copyToClipboard(stats.affiliateCode, 'Code')}
                        className="bg-zinc-700 hover:bg-zinc-600"
                      >
                        {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-300 mb-2 block">Affiliate URL</Label>
                    <div className="flex gap-2">
                      <Input
                        value={affiliateUrl}
                        readOnly
                        className="bg-zinc-800 border-zinc-700 text-white"
                      />
                      <Button
                        onClick={() => copyToClipboard(affiliateUrl, 'URL')}
                        className="bg-zinc-700 hover:bg-zinc-600"
                      >
                        {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                      <Button
                        onClick={() => window.open(affiliateUrl, '_blank')}
                        className="bg-[#ff6b35] hover:bg-[#ff8c42]"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-200">
                      Deel deze link met anderen en verdien 10% commissie op hun maandelijkse abonnement, voor altijd!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <Card className="bg-zinc-900 border-zinc-800 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Totale Verwijzingen</CardTitle>
                  <Users className="w-4 h-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{stats?.referrals?.total || 0}</div>
                  <p className="text-xs text-gray-400 mt-1">
                    {stats?.referrals?.active || 0} actief
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Totaal Verdiend</CardTitle>
                  <Euro className="w-4 h-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">
                    €{(stats?.earnings?.total || 0).toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {stats?.commissionRate || 10}% commissie
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Beschikbaar Saldo</CardTitle>
                  <DollarSign className="w-4 h-4 text-[#ff6b35]" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">
                    €{(stats?.earnings?.available || 0).toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Klaar voor uitbetaling
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Conversie Rate</CardTitle>
                  <TrendingUp className="w-4 h-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">
                    {stats?.referrals?.conversionRate || 0}%
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {stats?.referrals?.converted || 0} conversies
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Payout Section */}
            <Card className="bg-zinc-900 border-zinc-800 shadow-lg mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Uitbetaling Aanvragen</CardTitle>
                    <CardDescription>
                      Minimaal €50 - Verwerking binnen 5-7 werkdagen
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => setShowPayoutDialog(true)}
                    disabled={(stats?.earnings?.available || 0) < 50}
                    className="bg-[#ff6b35] hover:bg-[#ff8c42] text-white"
                  >
                    <Euro className="w-4 h-4 mr-2" />
                    Uitbetaling Aanvragen
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-zinc-800/50 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">In afwachting</div>
                    <div className="text-2xl font-bold text-yellow-500">
                      €{(stats?.earnings?.pending || 0).toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-zinc-800/50 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Goedgekeurd</div>
                    <div className="text-2xl font-bold text-green-500">
                      €{(stats?.earnings?.approved || 0).toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-zinc-800/50 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Uitbetaald</div>
                    <div className="text-2xl font-bold text-blue-500">
                      €{(stats?.earnings?.withdrawn || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Referrals List */}
            {stats?.referralsList && stats.referralsList.length > 0 && (
              <Card className="bg-zinc-900 border-zinc-800 shadow-lg mb-8">
                <CardHeader>
                  <CardTitle className="text-white">Jouw Verwijzingen</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.referralsList.map((referral: any) => (
                      <div
                        key={referral.id}
                        className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Users className="w-5 h-5 text-gray-400" />
                          <div>
                            <div className="text-white font-medium">
                              Verwijzing #{referral.id.substring(0, 8)}
                            </div>
                            <div className="text-sm text-gray-400">
                              {new Date(referral.createdAt).toLocaleDateString('nl-NL')}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {referral.firstPurchaseAt && (
                            <div className="text-right">
                              <div className="text-sm text-green-500 font-medium">
                                €{(referral.firstPurchaseAmount || 0).toFixed(2)}
                              </div>
                              <div className="text-xs text-gray-400">
                                Eerste aankoop
                              </div>
                            </div>
                          )}
                          <Badge
                            className={
                              referral.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-700'
                            }
                          >
                            {referral.status === 'active' ? 'Actief' : referral.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Payout Dialog */}
        <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
          <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-white">Uitbetaling Aanvragen</DialogTitle>
              <DialogDescription>
                Beschikbaar saldo: €{(stats?.earnings?.available || 0).toFixed(2)}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-gray-300 mb-2 block">Bedrag (€)</Label>
                <Input
                  type="number"
                  min="50"
                  step="0.01"
                  max={stats?.earnings?.available || 0}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="Minimaal €50"
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              <div>
                <Label className="text-gray-300 mb-2 block">Betaalmethode</Label>
                <Select value={payoutMethod} onValueChange={setPayoutMethod}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="bank_transfer">Bankoverschrijving</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="credits">WritgoAI Credits</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {payoutMethod !== 'credits' && (
                <div>
                  <Label className="text-gray-300 mb-2 block">
                    {payoutMethod === 'paypal' ? 'PayPal Email' : 'Bankgegevens (IBAN)'}
                  </Label>
                  <Input
                    value={payoutDetails}
                    onChange={(e) => setPayoutDetails(e.target.value)}
                    placeholder={
                      payoutMethod === 'paypal' 
                        ? 'jouw@email.com' 
                        : 'NL00 BANK 0000 0000 00'
                    }
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
              )}

              <div className="p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                <p className="text-sm text-yellow-200">
                  Let op: Uitbetalingen worden binnen 5-7 werkdagen verwerkt.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowPayoutDialog(false)}
                disabled={requestingPayout}
                className="border-zinc-700 text-white"
              >
                Annuleren
              </Button>
              <Button
                onClick={handleRequestPayout}
                disabled={requestingPayout || !payoutAmount}
                className="bg-[#ff6b35] hover:bg-[#ff8c42] text-white"
              >
                {requestingPayout ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verwerken...
                  </>
                ) : (
                  'Bevestig Uitbetaling'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
