/**
 * Settings Suite Overview
 * Main page for Settings
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, User, CreditCard, FolderKanban, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
  websiteUrl: string;
  wordpressUrl?: string | null;
  bolcomEnabled?: boolean;
  tradeTrackerEnabled?: boolean;
}

export default function SettingsSuitePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('account');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/client-login');
      return;
    }

    if (status === 'authenticated') {
      loadProjects();
    }
  }, [status, router]);

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/client/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('Kon projecten niet laden. Probeer de pagina te vernieuwen of neem contact op met support.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-orange-500/20 p-8">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-orange-500/20 border border-orange-500/30">
              <Settings className="w-8 h-8 text-orange-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Instellingen</h1>
              <p className="text-gray-400">Beheer je account en projecten</p>
            </div>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl" />
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-gray-900 border border-gray-800">
          <TabsTrigger value="account" className="flex items-center gap-2 data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-500">
            <User className="h-4 w-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-2 data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-500">
            <FolderKanban className="h-4 w-4" />
            Projecten
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2 data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-500">
            <CreditCard className="h-4 w-4" />
            Billing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Account Informatie</CardTitle>
              <CardDescription>
                Bekijk je persoonlijke informatie
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Naam</label>
                  <div className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                    {session?.user?.name || 'Niet ingesteld'}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Email</label>
                  <div className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                    {session?.user?.email || 'Niet ingesteld'}
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Project Instellingen</CardTitle>
              <CardDescription>
                Beheer integraties zoals WordPress, Bol.com en TradeTracker per project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-gray-400">
                  Projecten laden...
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">Je hebt nog geen projecten</p>
                  <Link href="/client-portal/projects/new">
                    <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                      Maak je eerste project
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.map((project) => (
                    <div 
                      key={project.id}
                      className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-orange-500/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-white font-medium">{project.name}</h3>
                          <p className="text-sm text-gray-400 mt-1">
                            Configureer WordPress, Bol.com en TradeTracker integraties
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            {project.wordpressUrl && (
                              <span className="text-green-500">✓ WordPress</span>
                            )}
                            {project.bolcomEnabled && (
                              <span className="text-green-500">✓ Bol.com</span>
                            )}
                            {project.tradeTrackerEnabled && (
                              <span className="text-green-500">✓ TradeTracker</span>
                            )}
                          </div>
                        </div>
                        <Link href={`/client-portal/projects/${project.id}`}>
                          <Button 
                            variant="outline" 
                            className="border-orange-500/30 text-orange-500 hover:bg-orange-500/10"
                          >
                            Instellingen
                            <ArrowRight className="ml-2 w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="pt-4 border-t border-gray-800">
                <p className="text-sm text-gray-400 mb-3">
                  Tip: Klik op "Instellingen" bij een project en ga naar de "Integraties" tab om je API credentials in te stellen.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Facturatie & Credits</CardTitle>
              <CardDescription>
                Beheer je abonnement en bekijk je verbruik
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Plan */}
              <div className="p-6 bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-lg border border-orange-500/30">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-400">Huidig Plan</p>
                    <h3 className="text-2xl font-bold text-white">Pro Plan</h3>
                  </div>
                  <Button variant="outline" className="border-orange-500/30 text-orange-500 hover:bg-orange-500/10">
                    Upgrade
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Credits Over</p>
                    <p className="text-xl font-bold text-white">1,000</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Vernieuwt op</p>
                    <p className="text-xl font-bold text-white">1 Jan 2025</p>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-white">Betaalmethode</h4>
                <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-orange-500" />
                      <div>
                        <p className="text-sm font-medium text-white">•••• •••• •••• 4242</p>
                        <p className="text-xs text-gray-400">Verloopt 12/2025</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="border-orange-500/30 text-orange-500 hover:bg-orange-500/10">
                      Wijzigen
                    </Button>
                  </div>
                </div>
              </div>

              {/* Invoice History */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-white">Factuur Geschiedenis</h4>
                <div className="p-8 text-center text-gray-400">
                  Geen facturen beschikbaar
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
