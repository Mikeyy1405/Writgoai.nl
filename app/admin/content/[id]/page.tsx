
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Building2,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

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
  client: {
    id: string;
    name: string;
    email: string;
    companyName?: string;
    website?: string;
  };
}

export default function ContentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [content, setContent] = useState<ContentPiece | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState<string | null>(null);
  
  useEffect(() => {
    loadContent();
  }, [params.id]);
  
  async function loadContent() {
    try {
      const res = await fetch(`/api/admin/content/${params.id}`);
      
      if (res.ok) {
        const data = await res.json();
        setContent(data.contentPiece);
      }
    } catch (error) {
      console.error('Failed to load content:', error);
    } finally {
      setLoading(false);
    }
  }
  
  async function executeContent(contentTypes: string[]) {
    setExecuting(contentTypes.join(','));
    try {
      const res = await fetch(`/api/admin/content/${params.id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentTypes })
      });
      
      if (res.ok) {
        alert('Content generatie gestart! Dit kan enkele minuten duren...');
        // Reload after a delay
        setTimeout(() => loadContent(), 5000);
      } else {
        alert('Fout bij content generatie');
      }
    } catch (error) {
      console.error('Execute error:', error);
      alert('Fout bij content generatie');
    } finally {
      setExecuting(null);
    }
  }
  
  if (loading) {
    return <div className="p-8">Laden...</div>;
  }
  
  if (!content) {
    return <div className="p-8">Content niet gevonden</div>;
  }
  
  return (
    <div className="p-8 max-w-5xl mx-auto">
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
              <h1 className="text-3xl font-bold">{content.theme}</h1>
              <Badge variant={
                content.status === 'published' ? 'default' :
                content.status === 'generating' ? 'secondary' :
                content.status === 'failed' ? 'destructive' :
                'outline'
              }>
                {content.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Calendar className="w-4 h-4" />
              <span>Gepland voor: {new Date(content.scheduledFor).toLocaleDateString('nl-NL', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {(!content.blogContent || !content.socialCaption || !content.tiktokScript || !content.youtubeScript) && (
              <Button 
                onClick={() => executeContent([])}
                disabled={executing !== null}
                className="bg-[#FF6B35] hover:bg-[#FF6B35]/90"
              >
                {executing === '' ? 'Genereren...' : 'Genereer Alle Content'}
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Client Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Klant Informatie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="font-semibold text-lg">{content.client.name}</div>
              {content.client.companyName && (
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Building2 className="w-4 h-4" />
                  {content.client.companyName}
                </div>
              )}
              {content.client.website && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="w-4 h-4 text-gray-300" />
                  <a href={content.client.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {content.client.website}
                  </a>
                </div>
              )}
            </div>
            <Link href={`/admin/clients/${content.client.id}`}>
              <Button variant="outline">
                <ExternalLink className="w-4 h-4 mr-2" />
                Bekijk Klant
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
      
      {/* Blog Content */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Blog Article
              </CardTitle>
              <CardDescription>{content.blogTitle || 'Geen titel'}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {!content.blogContent && (
                <Button 
                  size="sm" 
                  onClick={() => executeContent(['blog'])}
                  disabled={executing !== null}
                  className="bg-[#FF6B35] hover:bg-[#FF6B35]/90"
                >
                  {executing === 'blog' ? 'Genereren...' : 'Genereer Blog'}
                </Button>
              )}
              {content.blogPublished ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  {content.blogUrl && (
                    <a href={content.blogUrl} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline">
                        <Globe className="w-4 h-4 mr-2" />
                        Bekijk Live
                      </Button>
                    </a>
                  )}
                </>
              ) : content.blogContent ? (
                <CheckCircle className="w-5 h-5 text-blue-600" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {content.blogContent ? (
            <div className="prose max-w-none text-sm">
              {content.blogContent}
            </div>
          ) : (
            <div className="text-gray-500 text-sm">Nog geen content gegenereerd</div>
          )}
        </CardContent>
      </Card>
      
      {/* Social Media Post */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-blue-600" />
                Social Media Post
              </CardTitle>
              <CardDescription>Instagram, Facebook, LinkedIn</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {!content.socialCaption && (
                <Button 
                  size="sm" 
                  onClick={() => executeContent(['social'])}
                  disabled={executing !== null}
                  className="bg-[#FF6B35] hover:bg-[#FF6B35]/90"
                >
                  {executing === 'social' ? 'Genereren...' : 'Genereer Social Post'}
                </Button>
              )}
              {content.socialPublished ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : content.socialCaption ? (
                <CheckCircle className="w-5 h-5 text-blue-600" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {content.socialCaption ? (
            <div className="space-y-3">
              <div className="text-sm whitespace-pre-wrap">{content.socialCaption}</div>
              {content.socialImageUrl && (
                <div className="mt-3">
                  <img 
                    src={content.socialImageUrl} 
                    alt="Social media post" 
                    className="rounded-lg max-w-md"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500 text-sm">Nog geen social media post gegenereerd</div>
          )}
        </CardContent>
      </Card>
      
      {/* TikTok Video */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5 text-pink-600" />
                TikTok Video
              </CardTitle>
              <CardDescription>Korte video content</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {!content.tiktokScript && (
                <Button 
                  size="sm" 
                  onClick={() => executeContent(['tiktok'])}
                  disabled={executing !== null}
                  className="bg-[#FF6B35] hover:bg-[#FF6B35]/90"
                >
                  {executing === 'tiktok' ? 'Genereren...' : 'Genereer TikTok'}
                </Button>
              )}
              {content.tiktokPublished ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  {content.tiktokUrl && (
                    <a href={content.tiktokUrl} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline">
                        <Globe className="w-4 h-4 mr-2" />
                        Bekijk Live
                      </Button>
                    </a>
                  )}
                </>
              ) : content.tiktokScript ? (
                <CheckCircle className="w-5 h-5 text-blue-600" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {content.tiktokScript ? (
            <div className="text-sm whitespace-pre-wrap">{content.tiktokScript}</div>
          ) : (
            <div className="text-gray-500 text-sm">Nog geen TikTok script gegenereerd</div>
          )}
        </CardContent>
      </Card>
      
      {/* YouTube Short */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5 text-red-600" />
                YouTube Short
              </CardTitle>
              <CardDescription>{content.youtubeTitle || 'Geen titel'}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {!content.youtubeScript && (
                <Button 
                  size="sm" 
                  onClick={() => executeContent(['youtube'])}
                  disabled={executing !== null}
                  className="bg-[#FF6B35] hover:bg-[#FF6B35]/90"
                >
                  {executing === 'youtube' ? 'Genereren...' : 'Genereer YouTube'}
                </Button>
              )}
              {content.youtubePublished ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  {content.youtubeUrl && (
                    <a href={content.youtubeUrl} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline">
                        <Globe className="w-4 h-4 mr-2" />
                        Bekijk Live
                      </Button>
                    </a>
                  )}
                </>
              ) : content.youtubeScript ? (
                <CheckCircle className="w-5 h-5 text-blue-600" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {content.youtubeScript ? (
            <div className="text-sm whitespace-pre-wrap">{content.youtubeScript}</div>
          ) : (
            <div className="text-gray-500 text-sm">Nog geen YouTube script gegenereerd</div>
          )}
        </CardContent>
      </Card>
      
      {/* Error Display */}
      {content.error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-red-600">{content.error}</div>
          </CardContent>
        </Card>
      )}
      
      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold">Content ID:</span>{' '}
              <span className="font-mono text-xs">{content.id}</span>
            </div>
            <div>
              <span className="font-semibold">Status:</span>{' '}
              <Badge variant="outline">{content.status}</Badge>
            </div>
            <div>
              <span className="font-semibold">Aangemaakt:</span>{' '}
              {new Date(content.createdAt).toLocaleString('nl-NL')}
            </div>
            <div>
              <span className="font-semibold">Gepland voor:</span>{' '}
              {new Date(content.scheduledFor).toLocaleString('nl-NL')}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
