
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Euro,
  Users,
  TrendingUp,
  Clock,
  Check,
  X,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Mail,
  Calendar,
  CreditCard
} from 'lucide-react';
import { toast } from 'sonner';

interface AffiliateStats {
  clientInfo: {
    id: string;
    email: string;
    name: string;
    createdAt: string;
  };
  totalEarned: number;
  activeReferrals: number;
  totalReferrals: number;
  referrals: Array<{
    id: string;
    referredClient: {
      id: string;
      email: string;
      name: string;
      subscriptionTier: string;
      subscriptionStatus: string;
    };
    signupDate: string;
    status: string;
  }>;
}

interface PayoutRequest {
  id: string;
  affiliateClientId: string;
  client: {
    id: string;
    email: string;
    name: string;
  };
  amount: number;
  status: string;
  paymentMethod?: string;
  paymentDetails?: any;
  requestedAt: string;
  processedAt?: string;
  paidAt?: string;
  notes?: string;
}

interface TotalStats {
  totalAffiliates: number;
  totalReferrals: number;
  activeReferrals: number;
  totalEarnedAllTime: number;
  pendingPayouts: number;
  pendingPayoutAmount: number;
}

export default function AffiliatePayoutsAdmin() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [totalStats, setTotalStats] = useState<TotalStats | null>(null);
  const [affiliates, setAffiliates] = useState<AffiliateStats[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [processingPayoutId, setProcessingPayoutId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      loadData();
    }
  }, [status, router]);

  async function loadData() {
    try {
      const response = await fetch('/api/admin/affiliate-payouts');
      if (response.ok) {
        const data = await response.json();
        setTotalStats(data.stats);
        setAffiliates(data.affiliates);
        setPayouts(data.payouts);
      } else {
        toast.error('Kon data niet laden');
      }
    } catch (error) {
      console.error('Error loading affiliate data:', error);
      toast.error('Er ging iets mis bij het laden');
    } finally {
      setLoading(false);
    }
  }

  async function handlePayoutAction(payoutId: string, action: 'approve' | 'reject' | 'mark_paid', notes?: string) {
    setProcessingPayoutId(payoutId);
    try {
      const response = await fetch(`/api/admin/affiliate-payouts/${payoutId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        loadData(); // Reload data
      } else {
        toast.error('Actie mislukt');
      }
    } catch (error) {
      console.error('Error processing payout:', error);
      toast.error('Er ging iets mis');
    } finally {
      setProcessingPayoutId(null);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  function getStatusBadge(status: string) {
    const statusConfig: Record<string, { label: string; color: string }> = {
      requested: { label: 'Aangevraagd', color: 'bg-yellow-500' },
      processing: { label: 'In behandeling', color: 'bg-blue-500' },
      paid: { label: 'Betaald', color: 'bg-green-500' },
      rejected: { label: 'Afgewezen', color: 'bg-red-500' }
    };

    const config = statusConfig[status] || { label: status, color: 'bg-slate-8000' };
    return (
      <Badge className={`${config.color} text-white`}>
        {config.label}
      </Badge>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-900">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin/dashboard')}
            className="mb-4 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Terug naar Dashboard
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-black to-[#FF6B35] rounded-lg flex items-center justify-center">
              <Euro className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Affiliate Commissie Beheer</h1>
              <p className="text-gray-400">Overzicht van alle affiliates en uitbetalingsverzoeken</p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        {totalStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <Card className="border-l-4 border-l-blue-500 bg-zinc-800/50 border-zinc-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Totaal Affiliates</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{totalStats.totalAffiliates}</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500 bg-zinc-800/50 border-zinc-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Totaal Referrals</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{totalStats.totalReferrals}</div>
                <p className="text-xs text-gray-400 mt-1">
                  {totalStats.activeReferrals} actief
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500 bg-zinc-800/50 border-zinc-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Totaal Verdiend</CardTitle>
                <Euro className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {formatCurrency(totalStats.totalEarnedAllTime)}
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-yellow-500 bg-zinc-800/50 border-zinc-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Openstaande Payouts</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{totalStats.pendingPayouts}</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500 bg-zinc-800/50 border-zinc-700 md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Te Betalen Bedrag</CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-400">
                  {formatCurrency(totalStats.pendingPayoutAmount)}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Dit bedrag moet je uitbetalen aan affiliates
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="payouts" className="space-y-4">
          <TabsList className="bg-zinc-800">
            <TabsTrigger value="payouts">
              Uitbetalingsverzoeken ({payouts.filter(p => p.status === 'requested').length})
            </TabsTrigger>
            <TabsTrigger value="affiliates">
              Alle Affiliates ({affiliates.length})
            </TabsTrigger>
            <TabsTrigger value="history">
              Geschiedenis
            </TabsTrigger>
          </TabsList>

          {/* Payouts Tab */}
          <TabsContent value="payouts" className="space-y-4">
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Openstaande Uitbetalingsverzoeken</CardTitle>
                <CardDescription>
                  Deze payouts wachten op jouw goedkeuring
                </CardDescription>
              </CardHeader>
              <CardContent>
                {payouts.filter(p => p.status === 'requested').length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Check className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>Geen openstaande uitbetalingsverzoeken!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {payouts
                      .filter(p => p.status === 'requested')
                      .map((payout) => (
                        <div
                          key={payout.id}
                          className="border border-zinc-700 rounded-lg p-4 bg-zinc-900/50"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-gradient-to-br from-[#FF6B35] to-orange-600 rounded-full flex items-center justify-center">
                                  <Euro className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-white">{payout.client.name}</h3>
                                  <p className="text-sm text-gray-400">{payout.client.email}</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                  <p className="text-xs text-gray-400 mb-1">Bedrag</p>
                                  <p className="text-lg font-bold text-white">
                                    {formatCurrency(payout.amount)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-400 mb-1">Aangevraagd op</p>
                                  <p className="text-sm text-white flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(payout.requestedAt)}
                                  </p>
                                </div>
                                {payout.paymentMethod && (
                                  <div>
                                    <p className="text-xs text-gray-400 mb-1">Betaalmethode</p>
                                    <p className="text-sm text-white flex items-center gap-1">
                                      <CreditCard className="w-3 h-3" />
                                      {payout.paymentMethod}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 ml-4">
                              <Button
                                size="sm"
                                onClick={() => handlePayoutAction(payout.id, 'approve')}
                                disabled={processingPayoutId === payout.id}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                {processingPayoutId === payout.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <Check className="w-4 h-4 mr-1" />
                                    Goedkeuren
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handlePayoutAction(payout.id, 'reject')}
                                disabled={processingPayoutId === payout.id}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Afwijzen
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* In behandeling */}
            {payouts.filter(p => p.status === 'processing').length > 0 && (
              <Card className="bg-zinc-800/50 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-white">In Behandeling</CardTitle>
                  <CardDescription>
                    Deze payouts zijn goedgekeurd en wachten op betaling
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {payouts
                      .filter(p => p.status === 'processing')
                      .map((payout) => (
                        <div
                          key={payout.id}
                          className="border border-blue-700 rounded-lg p-4 bg-blue-900/10"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-white">{payout.client.name}</h3>
                              <p className="text-sm text-gray-400">{payout.client.email}</p>
                              <p className="text-lg font-bold text-white mt-2">
                                {formatCurrency(payout.amount)}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handlePayoutAction(payout.id, 'mark_paid')}
                              disabled={processingPayoutId === payout.id}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              {processingPayoutId === payout.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Check className="w-4 h-4 mr-1" />
                                  Markeer als Betaald
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Affiliates Tab */}
          <TabsContent value="affiliates" className="space-y-4">
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Alle Affiliates</CardTitle>
                <CardDescription>
                  Overzicht van alle affiliates met hun statistieken
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {affiliates.map((affiliate) => (
                    <div
                      key={affiliate.clientInfo.id}
                      className="border border-zinc-700 rounded-lg p-4 bg-zinc-900/50"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-white text-lg">
                            {affiliate.clientInfo.name}
                          </h3>
                          <p className="text-sm text-gray-400 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {affiliate.clientInfo.email}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Sinds {new Date(affiliate.clientInfo.createdAt).toLocaleDateString('nl-NL')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-white">
                            {formatCurrency(affiliate.totalEarned)}
                          </p>
                          <p className="text-xs text-gray-400">Totaal verdiend</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-700">
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Totaal Referrals</p>
                          <p className="text-lg font-semibold text-white">
                            {affiliate.totalReferrals}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Actieve Referrals</p>
                          <p className="text-lg font-semibold text-green-400">
                            {affiliate.activeReferrals}
                          </p>
                        </div>
                      </div>

                      {/* Referral details */}
                      {affiliate.referrals.length > 0 && (
                        <details className="mt-4">
                          <summary className="cursor-pointer text-sm text-gray-400 hover:text-white">
                            Bekijk referrals ({affiliate.referrals.length})
                          </summary>
                          <div className="mt-2 space-y-2">
                            {affiliate.referrals.map((ref) => (
                              <div
                                key={ref.id}
                                className="text-sm p-2 bg-zinc-800 rounded border border-zinc-700"
                              >
                                <div className="flex justify-between items-center">
                                  <span className="text-white">{ref.referredClient.name}</span>
                                  <Badge
                                    className={
                                      ref.referredClient.subscriptionStatus === 'active'
                                        ? 'bg-green-500'
                                        : 'bg-slate-8000'
                                    }
                                  >
                                    {ref.referredClient.subscriptionStatus}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                  {ref.referredClient.email} • {ref.referredClient.subscriptionTier}
                                </p>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Uitbetalingsgeschiedenis</CardTitle>
                <CardDescription>
                  Alle voltooide en afgewezen uitbetalingen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {payouts
                    .filter(p => p.status === 'paid' || p.status === 'rejected')
                    .map((payout) => (
                      <div
                        key={payout.id}
                        className="border border-zinc-700 rounded-lg p-4 bg-zinc-900/50 flex items-center justify-between"
                      >
                        <div>
                          <h3 className="font-semibold text-white">{payout.client.name}</h3>
                          <p className="text-sm text-gray-400">{payout.client.email}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Aangevraagd: {formatDate(payout.requestedAt)}
                          </p>
                          {payout.paidAt && (
                            <p className="text-xs text-green-400 mt-1">
                              Betaald: {formatDate(payout.paidAt)}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-white mb-2">
                            {formatCurrency(payout.amount)}
                          </p>
                          {getStatusBadge(payout.status)}
                        </div>
                      </div>
                    ))}
                  {payouts.filter(p => p.status === 'paid' || p.status === 'rejected').length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <p>Nog geen voltooide uitbetalingen</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
