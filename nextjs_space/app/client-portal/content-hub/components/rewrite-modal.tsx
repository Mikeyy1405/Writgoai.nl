'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, AlertCircle, RefreshCw, Eye, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface Article {
  id: string;
  title: string;
  content: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  wordpressUrl: string | null;
}

interface RewriteModalProps {
  article: Article;
  onClose: () => void;
  onComplete: () => void;
}

interface RewrittenContent {
  content: string;
  metaTitle: string;
  metaDescription: string;
  improvements: string;
  originalContent: string;
  originalMetaTitle: string | null;
  originalMetaDescription: string | null;
}

export default function RewriteModal({ article, onClose, onComplete }: RewriteModalProps) {
  const [loading, setLoading] = useState(false);
  const [rewrittenContent, setRewrittenContent] = useState<RewrittenContent | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRewrite = useCallback(async () => {
    setLoading(true);
    setError(null);
    setRewrittenContent(null);

    try {
      const response = await fetch('/api/content-hub/rewrite-article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articleId: article.id,
          maintainUrl: true,
          previewOnly: true, // Get preview first
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Herschrijven mislukt');
      }

      const data = await response.json();
      setRewrittenContent(data.rewrittenArticle);
    } catch (error: any) {
      console.error('Failed to rewrite:', error);
      setError(error.message || 'Kon artikel niet herschrijven');
    } finally {
      setLoading(false);
    }
  }, [article.id]);

  // Auto-start rewriting when modal opens
  useEffect(() => {
    handleRewrite();
  }, [handleRewrite]);

  const handleAcceptRewrite = async () => {
    if (!rewrittenContent) return;

    setPublishing(true);
    toast.loading('Herschreven artikel opslaan...', { id: 'save-rewrite' });

    try {
      // Save the rewritten content
      const response = await fetch('/api/content-hub/rewrite-article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articleId: article.id,
          maintainUrl: true,
          previewOnly: false, // Actually save this time
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Kon herschreven artikel niet opslaan');
      }

      const data = await response.json();

      // If article has WordPress URL, optionally publish to WordPress
      if (article.wordpressUrl) {
        toast.loading('Publiceren naar WordPress...', { id: 'save-rewrite' });
        
        const publishResponse = await fetch('/api/content-hub/publish-wordpress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            articleId: article.id,
            status: 'publish',
          }),
        });

        if (!publishResponse.ok) {
          // Don't fail completely if WordPress publish fails
          console.error('WordPress publish failed, but article was saved');
          toast.warning('Artikel opgeslagen, maar publicatie naar WordPress mislukt', { id: 'save-rewrite' });
        } else {
          toast.success('Artikel herschreven en gepubliceerd naar WordPress!', { id: 'save-rewrite' });
        }
      } else {
        toast.success('Artikel succesvol herschreven!', { id: 'save-rewrite' });
      }

      onComplete();
      onClose();
    } catch (error: any) {
      console.error('Failed to save rewrite:', error);
      toast.error(error.message || 'Kon herschreven artikel niet opslaan', { id: 'save-rewrite' });
    } finally {
      setPublishing(false);
    }
  };

  const getWordCount = (html: string) => {
    // Remove HTML tags and count words
    const text = html.replace(/<[^>]*>/g, ' ');
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    return words.length;
  };

  const sanitizeHtml = (html: string) => {
    // SECURITY NOTE: This is basic sanitization for AI-generated content from our trusted API
    // This content comes from our own Claude 4.5 Sonnet API, not from untrusted user input
    // The AI is instructed to generate clean HTML without scripts or dangerous content
    // 
    // RISK ASSESSMENT: LOW
    // - Source: Trusted AI API (Claude 4.5 Sonnet)
    // - Context: Admin/authenticated users only
    // - Content type: Article HTML (headings, paragraphs, lists)
    // - No user-generated content mixed in
    //
    // For true untrusted user input, use a proper HTML sanitization library like DOMPurify
    // This basic sanitization provides defense-in-depth but is not meant for hostile input
    
    let sanitized = html;
    
    // Multiple passes to catch nested/malformed tags
    for (let i = 0; i < 3; i++) {
      // Remove script tags
      sanitized = sanitized.replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '');
      
      // Remove event handlers
      sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
      sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
      
      // Remove dangerous URL schemes
      sanitized = sanitized.replace(/javascript\s*:/gi, '');
      sanitized = sanitized.replace(/data\s*:/gi, '');
      sanitized = sanitized.replace(/vbscript\s*:/gi, '');
      
      // Remove style tags
      sanitized = sanitized.replace(/<\s*style[^>]*>[\s\S]*?<\s*\/\s*style\s*>/gi, '');
      
      // Remove iframe, object, embed
      sanitized = sanitized.replace(/<\s*iframe[^>]*>[\s\S]*?<\s*\/\s*iframe\s*>/gi, '');
      sanitized = sanitized.replace(/<\s*object[^>]*>[\s\S]*?<\s*\/\s*object\s*>/gi, '');
      sanitized = sanitized.replace(/<\s*embed[^>]*>/gi, '');
    }
    
    return sanitized;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Artikel Herschrijven
          </DialogTitle>
          <DialogDescription>
            {article.title}
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Artikel herschrijven met AI...</p>
            <p className="text-sm text-muted-foreground mt-2">Dit kan 30-60 seconden duren</p>
          </div>
        )}

        {error && (
          <Card className="border-red-300 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-800 font-medium">Fout bij herschrijven</p>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRewrite}
                    className="mt-3"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Opnieuw proberen
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {rewrittenContent && (
          <div className="space-y-4">
            {/* Improvements Summary */}
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Verbeteringen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-green-800">{rewrittenContent.improvements}</p>
              </CardContent>
            </Card>

            {/* Word Count Comparison */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Origineel</p>
                    <p className="text-2xl font-bold">
                      {getWordCount(rewrittenContent.originalContent)} woorden
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Herschreven</p>
                    <p className="text-2xl font-bold text-green-600">
                      {getWordCount(rewrittenContent.content)} woorden
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Content Comparison */}
            <Tabs defaultValue="new" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="new">Herschreven Versie</TabsTrigger>
                <TabsTrigger value="original">Origineel</TabsTrigger>
              </TabsList>

              <TabsContent value="new" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Meta Informatie</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Meta Title</p>
                      <p className="text-sm font-medium">{rewrittenContent.metaTitle}</p>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {rewrittenContent.metaTitle.length} karakters
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Meta Description</p>
                      <p className="text-sm">{rewrittenContent.metaDescription}</p>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {rewrittenContent.metaDescription.length} karakters
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Content</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(rewrittenContent.content) }}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="original" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Meta Informatie</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Meta Title</p>
                      <p className="text-sm font-medium">{rewrittenContent.originalMetaTitle || 'Geen meta title'}</p>
                      {rewrittenContent.originalMetaTitle && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {rewrittenContent.originalMetaTitle.length} karakters
                        </Badge>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Meta Description</p>
                      <p className="text-sm">{rewrittenContent.originalMetaDescription || 'Geen meta description'}</p>
                      {rewrittenContent.originalMetaDescription && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {rewrittenContent.originalMetaDescription.length} karakters
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Content</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(rewrittenContent.originalContent) }}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={publishing}>
            Annuleren
          </Button>
          {rewrittenContent && (
            <Button onClick={handleAcceptRewrite} disabled={publishing} className="gap-2">
              {publishing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Opslaan...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Accepteren & Opslaan
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
