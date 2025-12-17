
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft,
  Crown,
  Mail,
  Phone,
  Building2,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  Save,
  AlertCircle
} from 'lucide-react';

interface SubscriptionPackage {
  id: string;
  tier: string;
  displayName: string;
  monthlyPrice: number;
  serviceType: string;
  description: string;
}

interface ClientSubscription {
  id: string;
  status: string;
  startDate: string;
  nextBillingDate: string | null;
  articlesUsed: number;
  reelsUsed: number;
  Package: SubscriptionPackage;
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  companyName: string | null;
  bufferEmail: string | null;
  bufferConnected: boolean;
  onboardingCompleted: boolean;
  createdAt: string;
  ClientSubscription: ClientSubscription[];
}

export default function ClientDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [client, setClient] = useState<Client | null>(null);
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user?.role !== 'admin') {
      router.push('/client-portal');
    } else {
      fetchClientData();
      fetchPackages();
    }
  }, [status, session, router, params.id]);

  const fetchClientData = async () => {
    try {
      const response = await fetch(`/api/admin/clients/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setClient(data);
        
        // Set current package if exists
        const activeSubscription = data.ClientSubscription.find((sub: ClientSubscription) => sub.status === 'ACTIVE');
        if (activeSubscription) {
          setSelectedPackageId(activeSubscription.Package.id);
        }
      }
    } catch (error) {
      console.error('Error fetching client:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/packages');
      if (response.ok) {
        const data = await response.json();
        setPackages(data);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  const handleAssignPackage = async () => {
    if (!selectedPackageId) {
      toast({
        title: 'Fout',
        description: 'Selecteer eerst een pakket',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/clients/${params.id}/subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: selectedPackageId }),
      });

      if (response.ok) {
        toast({
          title: 'Abonnement toegewezen',
          description: 'Het abonnement is succesvol toegewezen aan de klant.',
        });
        fetchClientData();
      } else {
        throw new Error('Failed to assign package');
      }
    } catch (error) {
      toast({
        title: 'Fout',
        description: 'Er is een fout opgetreden bij het toewijzen van het abonnement.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm('Weet je zeker dat je dit abonnement wilt annuleren?')) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/clients/${params.id}/subscription`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId }),
      });

      if (response.ok) {
        toast({
          title: 'Abonnement geannuleerd',
          description: 'Het abonnement is succesvol geannuleerd.',
        });
        fetchClientData();
      } else {
        throw new Error('Failed to cancel subscription');
      }
    } catch (error) {
      toast({
        title: 'Fout',
        description: 'Er is een fout opgetreden bij het annuleren van het abonnement.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-[#FF6B35] mx-auto animate-spin" />
          <p className="mt-4 text-gray-600">Laden...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Klant niet gevonden</p>
          <Button onClick={() => router.push('/dashboard/clients')} className="mt-4">
            Terug naar overzicht
          </Button>
        </div>
      </div>
    );
  }

  const activeSubscription = client.ClientSubscription.find(sub => sub.status === 'ACTIVE');

  return (
    <div className="min-h-screen bg-slate-800">
      {/* Header */}
      <div className="bg-slate-900 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard/clients')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Terug
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-300">Klantbeheer: {client.name}</h1>
              <p className="text-gray-600">Beheer abonnement en details</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Client Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Klant Informatie</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Naam</div>
                  <div className="font-medium">{client.name}</div>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Mail className="w-4 h-4" />
                  {client.email}
                </div>
                {client.phone && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <Phone className="w-4 h-4" />
                    {client.phone}
                  </div>
                )}
                {client.companyName && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <Building2 className="w-4 h-4" />
                    {client.companyName}
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-300">
                  <Calendar className="w-4 h-4" />
                  Klant sinds {new Date(client.createdAt).toLocaleDateString('nl-NL')}
                </div>
                
                <div className="pt-4 border-t space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Onboarding</span>
                    {client.onboardingCompleted ? (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Voltooid
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-orange-600 border-orange-600">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Incompleet
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Buffer</span>
                    {client.bufferConnected ? (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verbonden
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-600 border-gray-600">
                        <XCircle className="w-3 h-3 mr-1" />
                        Niet verbonden
                      </Badge>
                    )}
                  </div>
                  {client.bufferEmail && (
                    <div className="text-xs text-gray-500 mt-1">
                      Buffer: {client.bufferEmail}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Subscription Management */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Subscription */}
            {activeSubscription ? (
              <Card className="border-[#FF6B35]">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Crown className="w-5 h-5 text-[#FF6B35]" />
                        Actief Abonnement
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Huidig abonnement van de klant
                      </CardDescription>
                    </div>
                    <Badge className="bg-green-500">ACTIEF</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gradient-to-br from-orange-50 to-white border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-bold text-xl text-slate-300">{activeSubscription.Package.tier}</div>
                        <div className="text-sm text-gray-600">{activeSubscription.Package.displayName}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-[#FF6B35]">€{activeSubscription.Package.monthlyPrice}</div>
                        <div className="text-xs text-gray-600">per maand</div>
                      </div>
                    </div>
                    <div className="text-sm text-slate-300 mb-3">{activeSubscription.Package.description}</div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-slate-900 rounded p-2 border">
                        <div className="text-gray-600">Artikelen gebruikt</div>
                        <div className="font-semibold">{activeSubscription.articlesUsed}</div>
                      </div>
                      <div className="bg-slate-900 rounded p-2 border">
                        <div className="text-gray-600">Reels gebruikt</div>
                        <div className="font-semibold">{activeSubscription.reelsUsed}</div>
                      </div>
                    </div>
                    {activeSubscription.nextBillingDate && (
                      <div className="mt-3 text-xs text-gray-600">
                        Volgende betaling: {new Date(activeSubscription.nextBillingDate).toLocaleDateString('nl-NL')}
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => handleCancelSubscription(activeSubscription.id)}
                    disabled={saving}
                    variant="destructive"
                    className="w-full"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Annuleren...
                      </>
                    ) : (
                      'Abonnement Annuleren'
                    )}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-slate-600">
                <CardContent className="py-8 text-center">
                  <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">Geen actief abonnement</p>
                  <p className="text-sm text-gray-500">Wijs hieronder een pakket toe</p>
                </CardContent>
              </Card>
            )}

            {/* Assign/Change Package */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {activeSubscription ? 'Abonnement Wijzigen' : 'Abonnement Toewijzen'}
                </CardTitle>
                <CardDescription>
                  {activeSubscription 
                    ? 'Wijzig het abonnement van deze klant (het huidige abonnement wordt vervangen)'
                    : 'Wijs een abonnement toe aan deze klant'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="package">Selecteer Pakket</Label>
                  <Select value={selectedPackageId} onValueChange={setSelectedPackageId}>
                    <SelectTrigger id="package">
                      <SelectValue placeholder="Kies een pakket..." />
                    </SelectTrigger>
                    <SelectContent>
                      {packages.map((pkg) => (
                        <SelectItem key={pkg.id} value={pkg.id}>
                          {pkg.tier} - {pkg.displayName} (€{pkg.monthlyPrice}/maand)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedPackageId && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    {(() => {
                      const selectedPkg = packages.find(p => p.id === selectedPackageId);
                      return selectedPkg ? (
                        <>
                          <div className="font-semibold text-slate-300 mb-1">{selectedPkg.displayName}</div>
                          <div className="text-sm text-gray-600 mb-2">{selectedPkg.description}</div>
                          <div className="text-lg font-bold text-[#FF6B35]">€{selectedPkg.monthlyPrice}/maand</div>
                        </>
                      ) : null;
                    })()}
                  </div>
                )}

                <Button
                  onClick={handleAssignPackage}
                  disabled={saving || !selectedPackageId}
                  className="w-full bg-[#FF6B35] hover:bg-[#FF6B35]/90"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Bezig...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {activeSubscription ? 'Abonnement Wijzigen' : 'Abonnement Toewijzen'}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Subscription History */}
            {client.ClientSubscription.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Abonnement Geschiedenis</CardTitle>
                  <CardDescription>Alle abonnementen van deze klant</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {client.ClientSubscription.map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                        <div>
                          <div className="font-medium">{sub.Package.tier}</div>
                          <div className="text-sm text-gray-600">
                            Start: {new Date(sub.startDate).toLocaleDateString('nl-NL')}
                          </div>
                        </div>
                        <Badge variant={sub.status === 'ACTIVE' ? 'default' : 'secondary'}>
                          {sub.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
