'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Sparkles, 
  X, 
  Eye,
  Send,
  Search,
  BookOpen,
  Maximize2,
  Minimize2,
  Zap,
  Briefcase,
  Smile,
} from 'lucide-react';
import { toast } from 'sonner';

interface WordPressPost {
  id: number;
  title: string;
  content: string;
  wordCount: number;
}

interface AIRewriteModalProps {
  post: WordPressPost;
  siteId: string;
  onClose: () => void;
  onComplete: () => void;
}

interface RewrittenContent {
  title: string;
  content: string;
  metaDescription: string;
  improvements: string;
  wordCount: number;
  originalTitle: string;
  originalContent: string;
  originalWordCount: number;
}

export default function AIRewriteModal({ post, siteId, onClose, onComplete }: AIRewriteModalProps) {
  const [rewriteOption, setRewriteOption] = useState('seo-optimize');
  const [customInstructions, setCustomInstructions] = useState('');
  const [rewriting, setRewriting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [preview, setPreview] = useState<RewrittenContent | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const rewriteOptions = [
    {
      id: 'seo-optimize',
      label: 'SEO Optimaliseren',
      description: 'Verbeter SEO met betere structuur en zoekwoorden',
      icon: Search,
    },
    {
      id: 'readability',
      label: 'Leesbaarheid Verbeteren',
      description: 'Maak de tekst toegankelijker en makkelijker te lezen',
      icon: BookOpen,
    },
    {
      id: 'expand',
      label: 'Uitbreiden',
      description: 'Voeg meer details en diepgang toe (+50-100%)',
      icon: Maximize2,
    },
    {
      id: 'shorten',
      label: 'Inkorten',
      description: 'Compactere versie zonder belangrijke info te verliezen (-30-40%)',
      icon: Minimize2,
    },
    {
      id: 'tone-professional',
      label: 'Professionele Toon',
      description: 'Zakelijke, formele schrijfstijl',
      icon: Briefcase,
    },
    {
      id: 'tone-casual',
      label: 'Casual Toon',
      description: 'Vriendelijke, toegankelijke schrijfstijl',
      icon: Smile,
    },
  ];

  const handlePreview = async () => {
    try {
      setRewriting(true);
      toast.loading('AI herschrijft de post...', { id: 'rewrite' });

      const response = await fetch(`/api/content-hub/wordpress-posts/${post.id}/rewrite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId,
          rewriteOption,
          customInstructions: customInstructions.trim(),
          previewOnly: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Kon post niet herschrijven');
      }

      const data = await response.json();
      setPreview(data.rewrittenPost);
      setShowPreview(true);
      toast.success('Preview gegenereerd!', { id: 'rewrite' });
    } catch (error: any) {
      console.error('Failed to rewrite post:', error);
      toast.error(error.message || 'Kon post niet herschrijven', { id: 'rewrite' });
    } finally {
      setRewriting(false);
    }
  };

  const handlePublish = async () => {
    try {
      setPublishing(true);
      toast.loading('Post publiceren naar WordPress...', { id: 'publish' });

      const response = await fetch(`/api/content-hub/wordpress-posts/${post.id}/rewrite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId,
          rewriteOption,
          customInstructions: customInstructions.trim(),
          previewOnly: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Kon post niet publiceren');
      }

      toast.success('Post succesvol herschreven en gepubliceerd!', { id: 'publish' });
      onComplete();
    } catch (error: any) {
      console.error('Failed to publish rewritten post:', error);
      toast.error(error.message || 'Kon post niet publiceren', { id: 'publish' });
    } finally {
      setPublishing(false);
    }
  };

  const selectedOption = rewriteOptions.find(opt => opt.id === rewriteOption);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#FF9933]" />
            AI Herschrijven met Claude 4.5 Sonnet
          </DialogTitle>
          <DialogDescription>
            {post.title}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="options" value={showPreview ? 'preview' : 'options'} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger 
              value="options" 
              onClick={() => setShowPreview(false)}
              disabled={rewriting || publishing}
            >
              Opties
            </TabsTrigger>
            <TabsTrigger 
              value="preview" 
              disabled={!preview}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="options" className="space-y-4 mt-4">
            {/* Rewrite Options */}
            <div className="space-y-2">
              <Label>Kies een herschrijf optie:</Label>
              <RadioGroup value={rewriteOption} onValueChange={setRewriteOption}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {rewriteOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <Card 
                        key={option.id}
                        className={`cursor-pointer transition-all ${
                          rewriteOption === option.id 
                            ? 'border-primary ring-2 ring-primary/20' 
                            : 'hover:border-primary/50'
                        }`}
                        onClick={() => setRewriteOption(option.id)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start gap-3">
                            <RadioGroupItem value={option.id} id={option.id} />
                            <div className="flex-1">
                              <Label 
                                htmlFor={option.id} 
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <Icon className="h-4 w-4" />
                                {option.label}
                              </Label>
                              <p className="text-xs text-muted-foreground mt-1">
                                {option.description}
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>
              </RadioGroup>
            </div>

            {/* Custom Instructions */}
            <div className="space-y-2">
              <Label htmlFor="customInstructions">
                Extra instructies (optioneel)
              </Label>
              <Textarea
                id="customInstructions"
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="Voeg specifieke instructies toe voor het herschrijven..."
                rows={4}
                disabled={rewriting || publishing}
              />
            </div>

            {/* Info Card */}
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-[#FF9933] mt-0.5" />
                  <div>
                    <p className="text-sm font-medium mb-1">
                      Geselecteerd: {selectedOption?.label}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedOption?.description}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span>Huidige lengte: {post.wordCount} woorden</span>
                      <span>•</span>
                      <span>AI Model: Claude 4.5 Sonnet</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            {preview && (
              <div className="space-y-4">
                {/* Improvements Summary */}
                <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-green-600" />
                      Verbeteringen
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{preview.improvements}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs">
                      <Badge variant="outline">
                        {preview.originalWordCount} → {preview.wordCount} woorden
                      </Badge>
                      <Badge variant="outline">
                        {preview.wordCount > preview.originalWordCount ? '+' : ''}
                        {preview.wordCount - preview.originalWordCount} woorden
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Title Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Originele Titel</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{preview.originalTitle}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-primary">
                    <CardHeader>
                      <CardTitle className="text-sm">Nieuwe Titel</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm font-medium">{preview.title}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Meta Description */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Meta Description (SEO)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{preview.metaDescription}</p>
                  </CardContent>
                </Card>

                {/* Content Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Herschreven Content (Preview)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Safe to render: Content is generated by Claude AI (controlled source) */}
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: preview.content.substring(0, 1500) + '...' }}
                    />
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={rewriting || publishing}
          >
            <X className="h-4 w-4 mr-2" />
            Annuleren
          </Button>
          
          {!showPreview ? (
            <Button
              onClick={handlePreview}
              disabled={rewriting || publishing}
            >
              {rewriting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Herschrijven...
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Genereren
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handlePublish}
              disabled={rewriting || publishing}
            >
              {publishing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publiceren...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Publiceren naar WordPress
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
