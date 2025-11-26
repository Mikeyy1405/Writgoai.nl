
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  FileText, 
  Video, 
  Image as ImageIcon,
  Globe,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Mail,
  Building2,
  ExternalLink,
  Zap
} from 'lucide-react';
import Link from 'next/link';

interface Client {
  id: string;
  name: string;
  email: string;
  companyName?: string;
  website?: string;
  automationActive: boolean;
  automationStartDate?: string;
  targetAudience?: string;
  brandVoice?: string;
  keywords?: string[];
  wordpressUrl?: string;
  wordpressUsername?: string;
  youtubeChannelId?: string;
  tiktokAccessToken?: string;
}

interface ContentPiece {
  id: string;
  theme: string;
  blogTitle?: string;
  blogContent?: string;
  blogPublished: boolean;
  blogUrl?: string;
  socialCaption?: string;
  socialPublished: boolean;
  socialImageUrl?: string;
  tiktokScript?: string;
  tiktokPublished: boolean;
  tiktokUrl?: string;
  youtubeScript?: string;
  youtubeTitle?: string;
  youtubePublished: boolean;
  youtubeUrl?: string;
  status: string;
  scheduledFor: string;
  createdAt: string;
  error?: string;
}

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [contentPieces, setContentPieces] = useState<ContentPiece[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  
  useEffect(() => {
    loadClientData();
  }, [params.id]);
  
  async function loadClientData() {
    try {
      const [clientRes, contentRes] = await Promise.all([
        fetch(`/api/admin/clients/${params.id}`),
        fetch(`/api/admin/clients/${params.id}/content`)
      ]);
      
      if (clientRes.ok) {
        const data = await clientRes.json();
        setClient(data.client || data);
      }
      
      if (contentRes.ok) {
        const data = await contentRes.json();
        setContentPieces(data.contentPieces || []);
      }
    } catch (error) {
      console.error('Failed to load client data:', error);
      toast.error('Fout bij laden van klantgegevens');
    } finally {
      setLoading(false);
    }
  }
  
  async function triggerAutomation() {
    setTriggering(true);
    try {
      const res = await fetch('/api/cron/daily-automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: params.id })
      });
      
      if (res.ok) {
        toast.success('Automation getriggerd voor deze klant!');
        loadClientData();
      } else {
        toast.error('Automation failed');
      }
    } catch (error) {
      toast.error('Error triggering automation');
    } finally {
      setTriggering(false);
    }
  }
  
  if (loading) {
    return <div className="p-8">Laden...</div>;
  }
  
  if (!client) {
    return <div className="p-8">Klant niet gevonden</div>;
  }
  
  const publishedCount = contentPieces.filter(c => 
    c.blogPublished || c.socialPublished || c.tiktokPublished || c.youtubePublished
  ).length;
  
  const pendingCount = contentPieces.filter(c => c.status === 'pending').length;
  const failedCount = contentPieces.filter(c => c.status === 'failed').length;
  
  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/admin')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Terug naar Admin Dashboard
        </Button>
        
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{client.name}</h1>
              <Badge variant={client.automationActive ? "default" : "secondary"}>
                {client.automationActive ? '🟢 Actief' : '⚫ Inactief'}
              </Badge>
            </div>
            <p className="text-gray-300">{client.companyName}</p>
          </div>
          {client.automationActive && (
            <Button 
              onClick={triggerAutomation}
              disabled={triggering}
              className="bg-[#FF6B35] hover:bg-[#FF6B35]/90"
            >
              {triggering ? 'Triggeren...' : <><Zap className="w-4 h-4 mr-2" /> Trigger Content Generatie</>}
            </Button>
          )}
        </div>
      </div>
      
      {/* Client Info Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Klantinformatie
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-500" />
              <span className="text-sm">{client.email}</span>
            </div>
            {client.companyName && (
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gray-500" />
                <span className="text-sm">{client.companyName}</span>
              </div>
            )}
            {client.website && (
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-500" />
                <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                  {client.website}
                </a>
              </div>
            )}
            {client.automationStartDate && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm">
                  Automation gestart: {new Date(client.automationStartDate).toLocaleDateString('nl-NL')}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Content Instellingen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="font-semibold">Doelgroep:</span>{' '}
              {client.targetAudience || 'Niet ingesteld'}
            </div>
            <div>
              <span className="font-semibold">Brand Voice:</span>{' '}
              {client.brandVoice || 'Niet ingesteld'}
            </div>
            <div>
              <span className="font-semibold">Keywords:</span>{' '}
              {client.keywords && client.keywords.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1">
                  {client.keywords.map((keyword, i) => (
                    <Badge key={i} variant="outline">{keyword}</Badge>
                  ))}
                </div>
              ) : (
                'Niet ingesteld'
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Publicatie Platforms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>WordPress</span>
              {client.wordpressUrl ? (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Geconfigureerd
                </Badge>
              ) : (
                <Badge variant="outline" className="text-gray-500 border-zinc-700">
                  <XCircle className="w-3 h-3 mr-1" />
                  Niet ingesteld
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span>YouTube</span>
              {client.youtubeChannelId ? (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Geconfigureerd
                </Badge>
              ) : (
                <Badge variant="outline" className="text-gray-500 border-zinc-700">
                  <XCircle className="w-3 h-3 mr-1" />
                  Niet ingesteld
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span>TikTok</span>
              {client.tiktokAccessToken ? (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Geconfigureerd
                </Badge>
              ) : (
                <Badge variant="outline" className="text-gray-500 border-zinc-700">
                  <XCircle className="w-3 h-3 mr-1" />
                  Niet ingesteld
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Content Statistieken</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Totaal content stuks:</span>
              <Badge variant="outline">{contentPieces.length}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Gepubliceerd:</span>
              <Badge variant="outline" className="text-green-600 border-green-600">{publishedCount}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Wachtend:</span>
              <Badge variant="outline" className="text-orange-600 border-orange-600">{pendingCount}</Badge>
            </div>
            {failedCount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm">Mislukt:</span>
                <Badge variant="outline" className="text-red-600 border-red-600">{failedCount}</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Content Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Gegenereerde Content</CardTitle>
          <CardDescription>
            Alle content die gegenereerd is voor {client.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {contentPieces.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Nog geen content gegenereerd voor deze klant
            </div>
          ) : (
            <div className="space-y-4">
              {contentPieces.map((content) => (
                <Card key={content.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-lg">{content.theme}</CardTitle>
                          <Badge variant={
                            content.status === 'published' ? 'default' :
                            content.status === 'generating' ? 'secondary' :
                            content.status === 'failed' ? 'destructive' :
                            'outline'
                          }>
                            {content.status}
                          </Badge>
                        </div>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Calendar className="w-3 h-3" />
                          Gepland voor: {new Date(content.scheduledFor).toLocaleDateString('nl-NL', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </CardDescription>
                      </div>
                      <Link href={`/admin/content/${content.id}`}>
                        <Button size="sm" variant="outline">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Bekijk Details
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-3">
                      {/* Blog */}
                      <div className="flex items-start gap-3 p-3 bg-zinc-900 rounded-lg">
                        <FileText className="w-5 h-5 text-gray-300 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm">Blog Article</div>
                          <div className="text-xs text-gray-500 truncate">{content.blogTitle || 'Geen titel'}</div>
                          <div className="flex items-center gap-2 mt-1">
                            {content.blogPublished ? (
                              <>
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                {content.blogUrl && (
                                  <a href={content.blogUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                                    Bekijk live
                                  </a>
                                )}
                              </>
                            ) : (
                              <XCircle className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Social */}
                      <div className="flex items-start gap-3 p-3 bg-zinc-900 rounded-lg">
                        <ImageIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-semibold text-sm">Social Media</div>
                          <div className="text-xs text-gray-500">Instagram, Facebook, LinkedIn</div>
                          <div className="flex items-center gap-2 mt-1">
                            {content.socialPublished ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* TikTok */}
                      <div className="flex items-start gap-3 p-3 bg-zinc-900 rounded-lg">
                        <Video className="w-5 h-5 text-pink-600 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-semibold text-sm">TikTok Video</div>
                          <div className="text-xs text-gray-500">Korte video content</div>
                          <div className="flex items-center gap-2 mt-1">
                            {content.tiktokPublished ? (
                              <>
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                {content.tiktokUrl && (
                                  <a href={content.tiktokUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                                    Bekijk live
                                  </a>
                                )}
                              </>
                            ) : (
                              <XCircle className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* YouTube */}
                      <div className="flex items-start gap-3 p-3 bg-zinc-900 rounded-lg">
                        <Video className="w-5 h-5 text-red-600 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm">YouTube Short</div>
                          <div className="text-xs text-gray-500 truncate">{content.youtubeTitle || 'Geen titel'}</div>
                          <div className="flex items-center gap-2 mt-1">
                            {content.youtubePublished ? (
                              <>
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                {content.youtubeUrl && (
                                  <a href={content.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                                    Bekijk live
                                  </a>
                                )}
                              </>
                            ) : (
                              <XCircle className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {content.error && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="text-sm text-red-800 font-semibold">Error:</div>
                        <div className="text-xs text-red-600 mt-1">{content.error}</div>
                      </div>
                    )}
                    
                    <div className="mt-3 text-xs text-gray-500">
                      Aangemaakt: {new Date(content.createdAt).toLocaleDateString('nl-NL', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
