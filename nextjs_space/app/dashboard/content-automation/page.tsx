
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Calendar,
  Sparkles,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Settings,
  ExternalLink,
  Edit,
} from 'lucide-react';

interface Client {
  id: string;
  name: string;
  email: string;
  companyName: string | null;
}

export default function ContentAutomationPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { toast } = useToast();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [wpDialogOpen, setWpDialogOpen] = useState(false);
  const [contentPlans, setContentPlans] = useState<any[]>([]);

  // WordPress config state
  const [wpSiteUrl, setWpSiteUrl] = useState('');
  const [wpUsername, setWpUsername] = useState('');
  const [wpPassword, setWpPassword] = useState('');
  const [wpConfigClient, setWpConfigClient] = useState('');

  // Edit article state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editKeywords, setEditKeywords] = useState('');

  // Helper function to remove markdown and clean text
  const cleanText = (text: string): string => {
    if (!text) return '';
    return text
      .replace(/\*\*/g, '')  // Verwijder **
      .replace(/\*/g, '')    // Verwijder *
      .replace(/#/g, '')     // Verwijder #
      .trim();
  };

  // Helper function to normalize title case
  const normalizeTitle = (text: string): string => {
    if (!text) return '';
    const cleaned = cleanText(text);
    // Als de titel volledig in Title Case is, converteer naar normale case
    const words = cleaned.split(' ');
    const allCapitalized = words.every(word => 
      word.length === 0 || word[0] === word[0].toUpperCase()
    );
    
    if (allCapitalized && words.length > 3) {
      // Converteer naar normale zin: eerste woord hoofdletter, rest klein
      return words.map((word, idx) => {
        if (idx === 0) return word;
        return word.toLowerCase();
      }).join(' ');
    }
    
    return cleaned;
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user?.role !== 'admin') {
      router.push('/client-portal');
    } else {
      fetchClients();
    }
  }, [status, session, router]);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/admin/clients');
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchContentPlans = async (clientId: string) => {
    try {
      const response = await fetch(`/api/admin/content-plan/${clientId}`);
      if (response.ok) {
        const data = await response.json();
        setContentPlans(data);
      }
    } catch (error) {
      console.error('Error fetching content plans:', error);
    }
  };

  const handleGeneratePlan = async () => {
    if (!selectedClient) {
      toast({
        title: 'Fout',
        description: 'Selecteer eerst een klant',
        variant: 'destructive',
      });
      return;
    }

    setGeneratingPlan(true);

    try {
      const response = await fetch('/api/admin/content-plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient,
          month: selectedMonth,
          year: selectedYear,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate content plan');
      }

      toast({
        title: 'Content plan gegenereerd!',
        description: data.message,
      });

      fetchContentPlans(selectedClient);
    } catch (error) {
      console.error('Error generating content plan:', error);
      toast({
        title: 'Fout bij genereren',
        description: error instanceof Error ? error.message : 'Probeer het opnieuw',
        variant: 'destructive',
      });
    } finally {
      setGeneratingPlan(false);
    }
  };

  const handleConfigureWordPress = async () => {
    if (!wpConfigClient || !wpSiteUrl || !wpUsername || !wpPassword) {
      toast({
        title: 'Fout',
        description: 'Vul alle velden in',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/wordpress-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: wpConfigClient,
          siteUrl: wpSiteUrl,
          username: wpUsername,
          applicationPassword: wpPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to configure WordPress');
      }

      toast({
        title: 'WordPress geconfigureerd!',
        description: 'Verbinding succesvol getest',
      });

      setWpDialogOpen(false);
      setWpSiteUrl('');
      setWpUsername('');
      setWpPassword('');
    } catch (error) {
      console.error('Error configuring WordPress:', error);
      toast({
        title: 'Configuratie mislukt',
        description: error instanceof Error ? error.message : 'Check je gegevens',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditArticle = (article: any) => {
    setEditingArticle(article);
    setEditTitle(cleanText(article.title));
    setEditTopic(cleanText(article.suggestedTopic));
    setEditDate(new Date(article.scheduledDate).toISOString().split('T')[0]);
    setEditKeywords(article.keywords.join(', '));
    setEditDialogOpen(true);
  };

  const handleSaveArticle = async () => {
    if (!editingArticle) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/admin/articles/${editingArticle.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          suggestedTopic: editTopic,
          scheduledDate: new Date(editDate).toISOString(),
          keywords: editKeywords.split(',').map(k => k.trim()).filter(k => k),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update article');
      }

      toast({
        title: 'Artikel bijgewerkt!',
        description: 'De wijzigingen zijn opgeslagen',
      });

      setEditDialogOpen(false);
      setEditingArticle(null);
      
      // Refresh content plans
      if (selectedClient) {
        fetchContentPlans(selectedClient);
      }
    } catch (error) {
      console.error('Error updating article:', error);
      toast({
        title: 'Fout bij opslaan',
        description: 'Probeer het opnieuw',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClient) {
      fetchContentPlans(selectedClient);
    }
  }, [selectedClient]);

  const monthNames = [
    'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
    'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'
  ];

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; icon: any }> = {
      PLANNED: { color: 'bg-blue-500', icon: Clock },
      GENERATING: { color: 'bg-yellow-500', icon: Loader2 },
      PUBLISHING: { color: 'bg-orange-500', icon: Loader2 },
      PUBLISHED: { color: 'bg-green-500', icon: CheckCircle2 },
      FAILED: { color: 'bg-red-500', icon: AlertCircle },
    };

    const config = statusMap[status] || statusMap.PLANNED;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 text-[#FF6B35] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-800">
      {/* Header */}
      <div className="bg-slate-900 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-300">Content Automatisering</h1>
              <p className="text-gray-600 mt-1">Automatische content planning en publicatie</p>
            </div>
            <Dialog open={wpDialogOpen} onOpenChange={setWpDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Settings className="h-4 w-4" />
                  WordPress Configureren
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>WordPress Configuratie</DialogTitle>
                  <DialogDescription>
                    Configureer WordPress voor automatische publicatie
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Klant</Label>
                    <Select value={wpConfigClient} onValueChange={setWpConfigClient}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer klant" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name} {client.companyName ? `(${client.companyName})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Site URL</Label>
                    <Input
                      placeholder="https://example.com"
                      value={wpSiteUrl}
                      onChange={(e) => setWpSiteUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Username</Label>
                    <Input
                      placeholder="admin"
                      value={wpUsername}
                      onChange={(e) => setWpUsername(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Application Password</Label>
                    <Input
                      type="password"
                      placeholder="xxxx xxxx xxxx xxxx"
                      value={wpPassword}
                      onChange={(e) => setWpPassword(e.target.value)}
                    />
                    <p className="text-xs text-gray-500">
                      Genereer een Application Password in WordPress onder Users → Profile
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setWpDialogOpen(false)}>
                    Annuleren
                  </Button>
                  <Button onClick={handleConfigureWordPress} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Opslaan & Testen
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Content Plan Generator */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#FF6B35]" />
              Genereer Content Plan
            </CardTitle>
            <CardDescription>
              Maak een automatisch 30-dagen content plan voor een klant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Klant</Label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer klant" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Maand</Label>
                <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthNames.map((month, idx) => (
                      <SelectItem key={idx + 1} value={(idx + 1).toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Jaar</Label>
                <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2025, 2026, 2027].map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleGeneratePlan}
                  disabled={generatingPlan || !selectedClient}
                  className="w-full"
                >
                  {generatingPlan ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Genereren...
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4 mr-2" />
                      Genereer Plan
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Plans Overview */}
        {selectedClient && contentPlans.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-300">Content Kalender</h2>
            {contentPlans.map((plan) => {
              // Groepeer artikelen per week
              const articlesByWeek: { [key: number]: any[] } = {};
              plan.PlannedArticles.forEach((article: any) => {
                const date = new Date(article.scheduledDate);
                const weekOfMonth = Math.ceil(date.getDate() / 7);
                if (!articlesByWeek[weekOfMonth]) {
                  articlesByWeek[weekOfMonth] = [];
                }
                articlesByWeek[weekOfMonth].push(article);
              });

              return (
                <Card key={plan.id} className="border-2">
                  <CardHeader className="bg-gradient-to-r from-[#1e3a8a] to-[#FF6B35] text-white">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-2xl">
                        📅 {monthNames[plan.month - 1]} {plan.year}
                      </CardTitle>
                      <Badge className="bg-slate-900 text-[#1e3a8a] text-lg px-4 py-1">
                        {plan.PlannedArticles.length} artikelen
                      </Badge>
                    </div>
                    <CardDescription className="text-white/90 mt-2">
                      Automatisch contentplan gegenereerd op basis van jouw AI profiel
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      {Object.keys(articlesByWeek).sort((a, b) => Number(a) - Number(b)).map((week) => (
                        <div key={week}>
                          <h3 className="text-lg font-semibold text-slate-300 mb-3 flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-[#FF6B35]" />
                            Week {week}
                          </h3>
                          <div className="grid gap-4">
                            {articlesByWeek[Number(week)]
                              .sort((a: any, b: any) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
                              .map((article: any) => {
                                const date = new Date(article.scheduledDate);
                                const dayName = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'][date.getDay()];
                                const dayNum = date.getDate();
                                const monthName = monthNames[date.getMonth()];

                                return (
                                  <div
                                    key={article.id}
                                    className="flex items-start gap-4 p-4 bg-slate-900 border-2 border-slate-700 rounded-lg hover:shadow-md transition-all"
                                  >
                                    {/* Datum Block */}
                                    <div className="flex-shrink-0 text-center bg-gradient-to-br from-[#1e3a8a] to-[#FF6B35] text-white rounded-lg p-3 min-w-[70px]">
                                      <div className="text-xs font-medium opacity-90">{dayName}</div>
                                      <div className="text-2xl font-bold">{dayNum}</div>
                                      <div className="text-xs opacity-90">{monthName}</div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start gap-2 mb-2">
                                        <FileText className="h-5 w-5 text-[#FF6B35] mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                          <h4 className="font-semibold text-slate-300 text-lg leading-tight">
                                            {normalizeTitle(article.title)}
                                          </h4>
                                        </div>
                                      </div>
                                      <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                                        {cleanText(article.suggestedTopic)}
                                      </p>
                                      {article.keywords.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-3">
                                          {article.keywords.map((keyword: string, idx: number) => (
                                            <span
                                              key={idx}
                                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-600"
                                            >
                                              {cleanText(keyword)}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>

                                    {/* Status & Actions */}
                                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                      {getStatusBadge(article.status)}
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-1"
                                        onClick={() => handleEditArticle(article)}
                                      >
                                        <Edit className="h-3 w-3" />
                                        Bewerken
                                      </Button>
                                      {article.PublishedArticle?.wordpressUrl && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="gap-1"
                                          onClick={() => window.open(article.PublishedArticle.wordpressUrl, '_blank')}
                                        >
                                          <ExternalLink className="h-3 w-3" />
                                          Bekijk
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {selectedClient && contentPlans.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-300 mb-2">
                Nog geen content plannen
              </h3>
              <p className="text-gray-600">
                Genereer een content plan om te beginnen met automatische publicatie
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Article Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Artikel Bewerken</DialogTitle>
            <DialogDescription>
              Pas de titel, onderwerp, datum en zoekwoorden aan
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Titel</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Artikel titel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-topic">Onderwerp</Label>
              <Textarea
                id="edit-topic"
                value={editTopic}
                onChange={(e) => setEditTopic(e.target.value)}
                placeholder="Gedetailleerde beschrijving van het artikel"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-date">Publicatiedatum</Label>
              <Input
                id="edit-date"
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-keywords">Zoekwoorden (komma gescheiden)</Label>
              <Input
                id="edit-keywords"
                value={editKeywords}
                onChange={(e) => setEditKeywords(e.target.value)}
                placeholder="zoekwoord1, zoekwoord2, zoekwoord3"
              />
              <p className="text-xs text-gray-500">
                Scheid meerdere zoekwoorden met komma's
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={handleSaveArticle} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
