
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Link2,
  Users,
  Search,
  Send,
  Check,
  X,
  Pause,
  Play,
  TrendingUp,
  Mail,
  Globe,
  Calendar,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Partner {
  id: string;
  name: string;
  companyName?: string;
  website?: string;
  relevanceScore?: number;
  matchingTopics?: string[];
  projects: Array<{
    id: string;
    name: string;
    niche?: string;
    websiteUrl?: string;
  }>;
}

interface LinkbuildingRequest {
  id: string;
  fromClientId: string;
  toClientId: string;
  message?: string;
  proposedTopics: string[];
  niche?: string;
  relevanceScore?: number;
  status: string;
  creditsOffered: number;
  linksPerMonth: number;
  createdAt: string;
  fromClient?: {
    id: string;
    name: string;
    companyName?: string;
    website?: string;
  };
  toClient?: {
    id: string;
    name: string;
    companyName?: string;
    website?: string;
  };
}

interface Partnership {
  id: string;
  requestingClientId: string;
  targetClientId: string;
  relevantTopics: string[];
  niche?: string;
  status: string;
  linksGiven: number;
  linksReceived: number;
  creditsEarned: number;
  creditsSpent: number;
  maxLinksPerMonth: number;
  startDate: string;
  lastLinkDate?: string;
  requestingClient: {
    id: string;
    name: string;
    companyName?: string;
    website?: string;
  };
  targetClient: {
    id: string;
    name: string;
    companyName?: string;
    website?: string;
  };
}

export default function LinkbuildingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('discover');
  const [loading, setLoading] = useState(false);

  // Discovery
  const [potentialPartners, setPotentialPartners] = useState<Partner[]>([]);
  const [searchNiche, setSearchNiche] = useState('');

  // Requests
  const [sentRequests, setSentRequests] = useState<LinkbuildingRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<LinkbuildingRequest[]>([]);

  // Partnerships
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);

  // Request dialog
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestTopics, setRequestTopics] = useState('');
  const [requestCredits, setRequestCredits] = useState(50);
  const [requestLinks, setRequestLinks] = useState(2);
  const [showRequestDialog, setShowRequestDialog] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/inloggen');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      loadData();
    }
  }, [status, activeTab]);

  const loadData = async () => {
    if (activeTab === 'discover') {
      await loadPotentialPartners();
    } else if (activeTab === 'requests') {
      await loadRequests();
    } else if (activeTab === 'partnerships') {
      await loadPartnerships();
    }
  };

  const loadPotentialPartners = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchNiche) {
        params.append('niche', searchNiche);
      }

      const res = await fetch(
        `/api/client/linkbuilding/discover?${params.toString()}`
      );
      const data = await res.json();

      if (data.success) {
        setPotentialPartners(data.partners);
      } else {
        toast.error(data.error || 'Kon partners niet laden');
      }
    } catch (error) {
      console.error('Error loading partners:', error);
      toast.error('Fout bij laden van partners');
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/client/linkbuilding/requests');
      const data = await res.json();

      if (data.success) {
        setSentRequests(data.sent);
        setReceivedRequests(data.received);
      } else {
        toast.error(data.error || 'Kon verzoeken niet laden');
      }
    } catch (error) {
      console.error('Error loading requests:', error);
      toast.error('Fout bij laden van verzoeken');
    } finally {
      setLoading(false);
    }
  };

  const loadPartnerships = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/client/linkbuilding/partnerships');
      const data = await res.json();

      if (data.success) {
        setPartnerships(data.partnerships);
      } else {
        toast.error(data.error || 'Kon partnerships niet laden');
      }
    } catch (error) {
      console.error('Error loading partnerships:', error);
      toast.error('Fout bij laden van partnerships');
    } finally {
      setLoading(false);
    }
  };

  const sendRequest = async () => {
    if (!selectedPartner) return;

    const topics = requestTopics.split(',').map((t) => t.trim()).filter((t) => t);

    setLoading(true);
    try {
      const res = await fetch('/api/client/linkbuilding/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toClientId: selectedPartner.id,
          message: requestMessage,
          proposedTopics: topics,
          niche: searchNiche || undefined,
          creditsOffered: requestCredits,
          linksPerMonth: requestLinks,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message);
        setShowRequestDialog(false);
        setRequestMessage('');
        setRequestTopics('');
        setActiveTab('requests');
      } else {
        toast.error(data.error || 'Kon verzoek niet versturen');
      }
    } catch (error) {
      console.error('Error sending request:', error);
      toast.error('Fout bij versturen van verzoek');
    } finally {
      setLoading(false);
    }
  };

  const respondToRequest = async (
    requestId: string,
    action: 'accept' | 'reject',
    responseMessage?: string
  ) => {
    setLoading(true);
    try {
      const res = await fetch('/api/client/linkbuilding/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          action,
          responseMessage,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message);
        await loadRequests();
        if (action === 'accept') {
          setActiveTab('partnerships');
        }
      } else {
        toast.error(data.error || 'Kon verzoek niet verwerken');
      }
    } catch (error) {
      console.error('Error responding to request:', error);
      toast.error('Fout bij verwerken van verzoek');
    } finally {
      setLoading(false);
    }
  };

  const updatePartnership = async (
    partnershipId: string,
    action: 'pause' | 'resume' | 'end'
  ) => {
    setLoading(true);
    try {
      const res = await fetch('/api/client/linkbuilding/partnerships', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnershipId,
          action,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message);
        await loadPartnerships();
      } else {
        toast.error(data.error || 'Kon partnership niet bijwerken');
      }
    } catch (error) {
      console.error('Error updating partnership:', error);
      toast.error('Fout bij bijwerken van partnership');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-700 mb-2 flex items-center gap-2">
          <Link2 className="h-8 w-8 text-orange-500" />
          Linkbuilding Netwerk
        </h1>
        <p className="text-gray-600">
          Werk samen met andere klanten en bouw relevante backlinks op. Verdien extra
          credits door linkbuilding partnerships aan te gaan.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="discover" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Ontdekken
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Verzoeken
            {receivedRequests.filter((r) => r.status === 'pending').length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {receivedRequests.filter((r) => r.status === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="partnerships" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Partnerships
            {partnerships.length > 0 && (
              <Badge variant="default" className="ml-1">
                {partnerships.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Discover Tab */}
        <TabsContent value="discover" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Zoek Linkbuilding Partners</CardTitle>
              <CardDescription>
                Vind relevante partners gebaseerd op jouw niche en onderwerpen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <Input
                  placeholder="Zoek op niche (bijv. 'elektronica', 'reizen')"
                  value={searchNiche}
                  onChange={(e) => setSearchNiche(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') loadPotentialPartners();
                  }}
                />
                <Button onClick={loadPotentialPartners} disabled={loading}>
                  <Search className="h-4 w-4 mr-2" />
                  Zoeken
                </Button>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Partners laden...</p>
                </div>
              ) : potentialPartners.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    Geen partners gevonden. Probeer een andere zoekopdracht.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {potentialPartners.map((partner) => (
                    <Card key={partner.id} className="border-2 hover:border-orange-300 transition">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold">
                                {partner.companyName || partner.name}
                              </h3>
                              {partner.relevanceScore && partner.relevanceScore > 50 && (
                                <Badge
                                  variant="default"
                                  className="bg-gradient-to-r from-orange-500 to-pink-500"
                                >
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  {partner.relevanceScore}% Match
                                </Badge>
                              )}
                            </div>

                            {partner.website && (
                              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                <Globe className="h-4 w-4" />
                                <a
                                  href={partner.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:text-orange-500"
                                >
                                  {partner.website}
                                </a>
                              </div>
                            )}

                            {partner.matchingTopics && partner.matchingTopics.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {partner.matchingTopics.slice(0, 5).map((topic, idx) => (
                                  <Badge key={idx} variant="outline">
                                    {topic}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            {partner.projects.length > 0 && (
                              <div className="mt-3 text-sm text-gray-600">
                                <strong>Projecten:</strong>{' '}
                                {partner.projects.map((p) => p.name).join(', ')}
                              </div>
                            )}
                          </div>

                          <Button
                            onClick={() => {
                              setSelectedPartner(partner);
                              setShowRequestDialog(true);
                            }}
                            className="ml-4"
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Verzoek Sturen
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ontvangen Verzoeken</CardTitle>
              <CardDescription>
                Verzoeken van andere klanten om een linkbuilding partnership
              </CardDescription>
            </CardHeader>
            <CardContent>
              {receivedRequests.filter((r) => r.status === 'pending').length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  Geen nieuwe verzoeken
                </div>
              ) : (
                <div className="space-y-4">
                  {receivedRequests
                    .filter((r) => r.status === 'pending')
                    .map((request) => (
                      <Card key={request.id} className="border-2 border-orange-200">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-2">
                                {request.fromClient?.companyName || request.fromClient?.name}
                              </h3>

                              {request.message && (
                                <p className="text-gray-600 mb-3">{request.message}</p>
                              )}

                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <strong>Links per maand:</strong> {request.linksPerMonth}
                                </div>
                                <div>
                                  <strong>Credits aangeboden:</strong> {request.creditsOffered}
                                </div>
                              </div>

                              {request.proposedTopics.length > 0 && (
                                <div className="mt-3">
                                  <strong className="text-sm">Onderwerpen:</strong>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {request.proposedTopics.map((topic, idx) => (
                                      <Badge key={idx} variant="secondary">
                                        {topic}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2 ml-4">
                              <Button
                                onClick={() => respondToRequest(request.id, 'accept')}
                                variant="default"
                                size="sm"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Accepteren
                              </Button>
                              <Button
                                onClick={() => respondToRequest(request.id, 'reject')}
                                variant="outline"
                                size="sm"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Afwijzen
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Verzonden Verzoeken</CardTitle>
              <CardDescription>Jouw uitgaande linkbuilding verzoeken</CardDescription>
            </CardHeader>
            <CardContent>
              {sentRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  Nog geen verzoeken verzonden
                </div>
              ) : (
                <div className="space-y-4">
                  {sentRequests.map((request) => (
                    <Card key={request.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">
                              {request.toClient?.companyName || request.toClient?.name}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              Verzonden: {new Date(request.createdAt).toLocaleDateString('nl-NL')}
                            </p>
                          </div>
                          <Badge
                            variant={
                              request.status === 'accepted'
                                ? 'default'
                                : request.status === 'rejected'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {request.status === 'pending'
                              ? 'In afwachting'
                              : request.status === 'accepted'
                              ? 'Geaccepteerd'
                              : 'Afgewezen'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Partnerships Tab */}
        <TabsContent value="partnerships" className="space-y-6">
          {partnerships.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nog geen partnerships</h3>
                <p className="text-gray-600 mb-4">
                  Ga naar het 'Ontdekken' tabblad om partners te vinden
                </p>
                <Button onClick={() => setActiveTab('discover')}>
                  <Search className="h-4 w-4 mr-2" />
                  Partners Ontdekken
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {partnerships.map((partnership) => {
                const isRequester = partnership.requestingClientId === session?.user?.email;
                const partner = isRequester
                  ? partnership.targetClient
                  : partnership.requestingClient;

                return (
                  <Card key={partnership.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-semibold flex items-center gap-2">
                            {partner.companyName || partner.name}
                            <Badge
                              variant={
                                partnership.status === 'active'
                                  ? 'default'
                                  : partnership.status === 'paused'
                                  ? 'secondary'
                                  : 'destructive'
                              }
                            >
                              {partnership.status === 'active'
                                ? 'Actief'
                                : partnership.status === 'paused'
                                ? 'Gepauzeerd'
                                : 'Beëindigd'}
                            </Badge>
                          </h3>
                          {partner.website && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                              <Globe className="h-4 w-4" />
                              <a
                                href={partner.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-orange-500"
                              >
                                {partner.website}
                              </a>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          {partnership.status === 'active' && (
                            <>
                              <Button
                                onClick={() => updatePartnership(partnership.id, 'pause')}
                                variant="outline"
                                size="sm"
                              >
                                <Pause className="h-4 w-4 mr-1" />
                                Pauzeren
                              </Button>
                              <Button
                                onClick={() => {
                                  if (confirm('Partnership beëindigen?')) {
                                    updatePartnership(partnership.id, 'end');
                                  }
                                }}
                                variant="destructive"
                                size="sm"
                              >
                                Beëindigen
                              </Button>
                            </>
                          )}
                          {partnership.status === 'paused' && (
                            <Button
                              onClick={() => updatePartnership(partnership.id, 'resume')}
                              variant="default"
                              size="sm"
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Hervatten
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4 mb-4">
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-500">
                            {partnership.linksGiven}
                          </div>
                          <div className="text-sm text-gray-600">Links Gegeven</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-500">
                            {partnership.linksReceived}
                          </div>
                          <div className="text-sm text-gray-600">Links Ontvangen</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-500">
                            {partnership.creditsEarned.toFixed(0)}
                          </div>
                          <div className="text-sm text-gray-600">Credits Verdiend</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-500">
                            {partnership.maxLinksPerMonth}
                          </div>
                          <div className="text-sm text-gray-600">Max per Maand</div>
                        </div>
                      </div>

                      {partnership.relevantTopics.length > 0 && (
                        <div>
                          <strong className="text-sm">Relevante Onderwerpen:</strong>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {partnership.relevantTopics.map((topic, idx) => (
                              <Badge key={idx} variant="outline">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-4 pt-4 border-t text-sm text-gray-600">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Gestart: {new Date(partnership.startDate).toLocaleDateString('nl-NL')}
                          </span>
                          {partnership.lastLinkDate && (
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-4 w-4" />
                              Laatste link:{' '}
                              {new Date(partnership.lastLinkDate).toLocaleDateString('nl-NL')}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Request Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Linkbuilding Verzoek Versturen</DialogTitle>
            <DialogDescription>
              Stuur een verzoek naar {selectedPartner?.companyName || selectedPartner?.name} voor
              een linkbuilding partnership
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="message">Bericht (optioneel)</Label>
              <Textarea
                id="message"
                placeholder="Schrijf een persoonlijk bericht..."
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="topics">Onderwerpen (kommagescheiden)</Label>
              <Input
                id="topics"
                placeholder="elektronica, gadgets, reviews"
                value={requestTopics}
                onChange={(e) => setRequestTopics(e.target.value)}
              />
              <p className="text-sm text-gray-500 mt-1">
                Geef aan over welke onderwerpen je samen wilt werken
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="credits">Credits Aangeboden</Label>
                <Input
                  id="credits"
                  type="number"
                  value={requestCredits}
                  onChange={(e) => setRequestCredits(parseInt(e.target.value) || 0)}
                  min="0"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Credits die je wilt investeren in deze partnership
                </p>
              </div>

              <div>
                <Label htmlFor="links">Links per Maand</Label>
                <Input
                  id="links"
                  type="number"
                  value={requestLinks}
                  onChange={(e) => setRequestLinks(parseInt(e.target.value) || 1)}
                  min="1"
                  max="10"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Aantal backlinks per maand (1-10)
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowRequestDialog(false)}>
              Annuleren
            </Button>
            <Button onClick={sendRequest} disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Versturen...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Verzoek Versturen
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
