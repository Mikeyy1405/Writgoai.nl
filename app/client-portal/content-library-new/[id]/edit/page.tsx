
'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Save,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import BlogCanvas from '@/components/blog-canvas';

export default function EditContentPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const params = useParams();
  const contentId = params?.id as string;
  
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentText, setContentText] = useState('');
  const [contentHtml, setContentHtml] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/client-login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated' && contentId) {
      fetchContent();
    }
  }, [status, contentId]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/client/content-library/${contentId}`);
      const data = await response.json();
      
      if (response.ok) {
        setContent(data.content);
        setTitle(data.content.title);
        setDescription(data.content.description || '');
        setContentText(data.content.content);
        setContentHtml(data.content.contentHtml || '');
      } else {
        toast.error(data.error || 'Content niet gevonden');
        router.push('/client-portal/content-library-new');
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      toast.error('Er ging iets mis');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data?: {
    content: string;
    seoMetadata?: {
      seoTitle: string;
      metaDescription: string;
      focusKeyword: string;
      extraKeywords: string[];
      lsiKeywords: string[];
    } | null;
    featuredImage?: string;
    socialMediaPost?: {
      text: string;
      imageUrl: string;
      hashtags: string[];
    } | null;
  } | string) => {
    try {
      setSaving(true);
      
      // Handle both old string format and new object format for backwards compatibility
      let updatedContent: string;
      let seoMetadata = null;
      let featuredImage = null;
      
      if (typeof data === 'string') {
        updatedContent = data;
      } else if (data && typeof data === 'object') {
        updatedContent = data.content;
        seoMetadata = data.seoMetadata;
        featuredImage = data.featuredImage;
      } else {
        updatedContent = contentText;
      }

      // Prepare keywords array from SEO metadata
      const keywords = seoMetadata ? [
        seoMetadata.focusKeyword,
        ...(seoMetadata.extraKeywords || []),
        ...(seoMetadata.lsiKeywords || [])
      ].filter(Boolean) : content.keywords || [];
      
      const response = await fetch(`/api/client/content-library/${contentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: seoMetadata?.metaDescription || description,
          content: updatedContent.replace(/<[^>]*>/g, ''),
          contentHtml: updatedContent,
          metaDesc: seoMetadata?.metaDescription || content.metaDesc,
          keywords,
          thumbnailUrl: featuredImage || content.thumbnailUrl,
        }),
      });
      
      if (response.ok) {
        toast.success('Content opgeslagen');
      } else {
        toast.error('Er ging iets mis bij opslaan');
      }
    } catch (error) {
      toast.error('Er ging iets mis');
    } finally {
      setSaving(false);
    }
  };


  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#ff6b35]" />
      </div>
    );
  }

  if (!content) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/client-portal/content-library-new')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Terug naar bibliotheek
            </Button>
          </div>
          
          <Button
            onClick={() => handleSave()}
            disabled={saving}
            className="bg-[#ff6b35] hover:bg-orange-600"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Opslaan...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Opslaan
              </>
            )}
          </Button>
        </div>

        {/* Title & Description */}
        <Card className="mb-6">
          <CardContent className="pt-6 space-y-4">
            <div>
              <Label htmlFor="title">Titel</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titel van je content"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Beschrijving (optioneel)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Korte beschrijving..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Editor */}
        {content.type === 'blog' ? (
          <BlogCanvas
            content={contentHtml}
            isGenerating={false}
            onSave={handleSave}
            topic={title}
            projectId={content.projectId || null}
            seoMetadata={content.keywords ? {
              seoTitle: content.title || '',
              metaDescription: content.metaDesc || content.description || '',
              focusKeyword: content.keywords?.[0] || '',
              extraKeywords: content.keywords?.slice(1) || [],
              lsiKeywords: [],
            } : null}
            featuredImage={content.thumbnailUrl || ''}
          />
        ) : (
          <Card>
            <CardContent className="pt-6">
              <Textarea
                value={contentText}
                onChange={(e) => setContentText(e.target.value)}
                rows={20}
                className="font-mono"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
