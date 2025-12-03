'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CreditCard, Download, TrendingUp, Calendar, AlertCircle, CheckCircle2, Sparkles, Zap, Building2, ArrowUpCircle, ArrowLeft, FolderKanban, Globe, Plus, Link2, Power, PowerOff, Settings, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function AccountPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [projectStats, setProjectStats] = useState({ totalProjects: 0, activeProjects: 0 });
  const [linkbuildingEnabled, setLinkbuildingEnabled] = useState(false);
  const [linkbuildingStats, setLinkbuildingStats] = useState<any>(null);
  const [loadingLinkbuilding, setLoadingLinkbuilding] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/client-login');
      return;
    }

    if (status === 'authenticated') {
      loadAccountData();
    }
  }, [status, router]);

  const loadAccountData = async () => {
    try {
      setLoading(true);
      
      const [subResponse, usageResponse, projectsResponse] = await Promise.all([
        fetch('/api/client/subscription'),
        fetch('/api/client/credits'),
        fetch('/api/client/projects')
      ]);

      const subData = await subResponse.json();
      const usageData = await usageResponse.json();
      const projectsData = await projectsResponse.json();

      setSubscription(subData);
      setUsage(usageData);

      if (projectsData.projects) {
        setProjectStats({
          totalProjects: projectsData.projects.length,
          activeProjects: projectsData.projects.filter((p: any) => p.isActive).length
        });
      }

      await loadLinkbuildingSettings();
    } catch (error) {
      console.error('Error loading account data:', error);
      toast.error('Kon account gegevens niet laden');
    } finally {
      setLoading(false);
    }
  };

  const loadLinkbuildingSettings = async () => {
    try {
      const response = await fetch('/api/client/linkbuilding/settings');
      const data = await response.json();
      if (data.success) {
        setLinkbuildingEnabled(data.enabled);
        setLinkbuildingStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading linkbuilding settings:', error);
    }
  };

  const toggleLinkbuilding = async () => {
    setLoadingLinkbuilding(true);
    try {
      const response = await fetch('/api/client/linkbuilding/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !linkbuildingEnabled }),
      });

      const data = await response.json();
      if (data.success) {
        setLinkbuildingEnabled(data.enabled);
        toast.success(data.message);
        await loadLinkbuildingSettings();
      } else {
        toast.error(data.error || 'Er ging iets mis');
      }
    } catch (error) {
      console.error('Error toggling linkbuilding:', error);
      toast.error('Er ging iets mis bij het opslaan');
    } finally {
      setLoadingLinkbuilding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-[#ff6b35]" />
      </div>
    );
  }

  const totalCredits = (usage?.subscriptionCredits || 0) + (usage?.topUpCredits || 0);

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl">
        {/* Header - Responsive */}
        <div className="mb-4 sm:mb-6">
          <Link href="/client-portal">
            <Button variant="ghost" className="mb-3 text-gray-300 hover:text-white hover:bg-zinc-800 text-sm">
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Terug
            </Button>
          </Link>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-[#ff6b35] to-[#ff8c42] rounded-xl shadow-lg">
              <Settings className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-white">Account Beheer</h1>
              <p className="text-gray-300 text-xs sm:text-sm md:text-base mt-0.5 sm:mt-1">
                Beheer je account instellingen
              </p>
            </div>
          </div>
        </div>

        {/* 2-Column Responsive Grid Layout */}
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
          
          {/* Left Column */}
          <div className="space-y-4 sm:space-y-6">
            {/* Credits Overview */}
            <Card className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border-[#ff6b35]/30 shadow-lg">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg">
                  <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-[#ff6b35]" />
                  Credits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Zap className="w-4 h-4 text-[#ff6b35]" />
                      <span className="text-gray-300 text-xs font-medium">Totaal</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-white">{totalCredits.toLocaleString()}</p>
                  </div>
                  
                  <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <TrendingUp className="w-4 h-4 text-purple-500" />
                      <span className="text-gray-300 text-xs font-medium">Gebruikt</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-white">{usage?.totalCreditsUsed?.toLocaleString() || 0}</p>
                  </div>
                  
                  <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      <span className="text-gray-300 text-xs font-medium">Maandelijks</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-white">{usage?.subscriptionCredits?.toLocaleString() || 0}</p>
                  </div>
                  
                  <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <ArrowUpCircle className="w-4 h-4 text-green-500" />
                      <span className="text-gray-300 text-xs font-medium">Top-up</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-white">{usage?.topUpCredits?.toLocaleString() || 0}</p>
                  </div>
                </div>
                
                <Button
                  onClick={() => router.push('/client-portal/credits')}
                  className="w-full mt-4 bg-[#ff6b35] hover:bg-[#ff8c42] text-white text-sm"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Credits Kopen
                </Button>
              </CardContent>
            </Card>

            {/* Projects */}
            <Card className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border-[#ff6b35]/30 shadow-lg">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg">
                  <FolderKanban className="w-4 h-4 sm:w-5 sm:h-5 text-[#ff6b35]" />
                  Projecten
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Globe className="w-4 h-4 text-[#ff6b35]" />
                      <span className="text-gray-300 text-xs font-medium">Totaal</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-white">{projectStats.totalProjects}</p>
                  </div>
                  
                  <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-gray-300 text-xs font-medium">Actief</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-white">{projectStats.activeProjects}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => router.push('/client-portal/projects')}
                    variant="outline"
                    className="border-zinc-700 text-white hover:bg-zinc-800 text-sm"
                  >
                    <Globe className="w-4 h-4 mr-1" />
                    Bekijk
                  </Button>
                  <Button
                    onClick={() => router.push('/client-portal/projects/new')}
                    className="bg-[#ff6b35] hover:bg-[#ff8c42] text-white text-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Nieuw
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-4 sm:space-y-6">
            {/* Subscription */}
            <Card className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border-[#ff6b35]/30 shadow-lg">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#ff6b35]" />
                  Abonnement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400">Huidig Plan</p>
                        <p className="text-lg font-bold text-white">{subscription?.plan || 'Geen actief abonnement'}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        subscription?.hasActiveSubscription
                          ? 'bg-green-900/30 text-green-400'
                          : 'bg-gray-900/30 text-gray-400'
                      }`}>
                        {subscription?.status || 'Geen'}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => router.push('/client-portal/credits')}
                    variant="outline"
                    className="w-full border-zinc-700 text-white hover:bg-zinc-800 text-sm"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Beheer Abonnement
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Linkbuilding */}
            <Card className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border-[#ff6b35]/30 shadow-lg">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg">
                  <Link2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#ff6b35]" />
                  Linkbuilding
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {linkbuildingStats && (
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-zinc-800/50 rounded-lg p-2 border border-zinc-700">
                        <p className="text-xs text-gray-400">Ontvangen</p>
                        <p className="text-lg font-bold text-white">{linkbuildingStats.linksReceived}</p>
                      </div>
                      <div className="bg-zinc-800/50 rounded-lg p-2 border border-zinc-700">
                        <p className="text-xs text-gray-400">Geplaatst</p>
                        <p className="text-lg font-bold text-white">{linkbuildingStats.linksGiven}</p>
                      </div>
                    </div>
                  )}
                  
                  <Button
                    onClick={toggleLinkbuilding}
                    disabled={loadingLinkbuilding}
                    className={`w-full ${
                      linkbuildingEnabled
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-zinc-700 hover:bg-zinc-600'
                    } text-white text-sm`}
                  >
                    {loadingLinkbuilding ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : linkbuildingEnabled ? (
                      <Power className="w-4 h-4 mr-2" />
                    ) : (
                      <PowerOff className="w-4 h-4 mr-2" />
                    )}
                    {linkbuildingEnabled ? 'Ingeschakeld' : 'Uitgeschakeld'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
