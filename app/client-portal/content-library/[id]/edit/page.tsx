
'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, ArrowLeft, Eye, Trash2, AlertTriangle, Package, MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ProductBoxSelector } from '@/components/product-box-selector';
import { CTABoxSelector } from '@/components/cta-box-selector';
import { OriginalityChecker } from '@/components/originality-checker';

export default function EditArticlePage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const params = useParams();
  const articleId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showProductBoxDialog, setShowProductBoxDialog] = useState(false);
  const [showCTABoxDialog, setShowCTABoxDialog] = useState(false);
  const [article, setArticle] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    metaDesc: '',
    excerpt: '',
    content: '',
    keywords: [] as string[],
  });
  const [keywordInput, setKeywordInput] = useState('');
  const [projectId, setProjectId] = useState<string>('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/client-login');
    } else if (status === 'authenticated' && articleId) {
      loadArticle();
    }
  }, [status, articleId, router]);

  const loadArticle = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/client/content-library/${articleId}`);
      
      if (!response.ok) {
        throw new Error('Article not found');
      }

      const data = await response.json();
      setArticle(data);
      
      // Get projectId from article
      if (data.projectId) {
        setProjectId(data.projectId);
      }
      
      setFormData({
        title: data.title || '',
        metaDesc: data.content?.metaDesc || '',
        excerpt: data.excerpt || '',
        content: data.content || '',
        keywords: data.keywords || [],
      });
    } catch (error) {
      console.error('Error loading article:', error);
      toast.error('Kon artikel niet laden');
      router.push('/client-portal/content-library');
    } finally {
      setLoading(false);
    }
  };

  const handleInsertShortcode = (shortcode: string) => {
    // Insert shortcode at the end of content with proper spacing
    setFormData({
      ...formData,
      content: formData.content + '\n\n' + shortcode + '\n\n',
    });
  };

  const handleSave = async () => {
    if (!formData.title || !formData.content) {
      toast.error('Titel en content zijn verplicht');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/client/content-library/${articleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Artikel opgeslagen!');
        router.push('/client-portal/content-library');
      } else {
        toast.error(data.error || 'Kon artikel niet opslaan');
      }
    } catch (error) {
      console.error('Error saving article:', error);
      toast.error('Er ging iets mis bij het opslaan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/client/content-library/${articleId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Artikel verwijderd');
        router.push('/client-portal/content-library');
      } else {
        toast.error(data.error || 'Kon artikel niet verwijderen');
      }
    } catch (error) {
      console.error('Error deleting article:', error);
      toast.error('Er ging iets mis bij het verwijderen');
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !formData.keywords.includes(keywordInput.trim())) {
      setFormData({
        ...formData,
        keywords: [...formData.keywords, keywordInput.trim()],
      });
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setFormData({
      ...formData,
      keywords: formData.keywords.filter((k) => k !== keyword),
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#ff6b35]" />
          <p className="mt-4 text-gray-300">Artikel laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/client-portal/content-library')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug naar Content Bibliotheek
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Artikel Bewerken
              </h1>
              {article?.MasterArticle && (
                <p className="text-gray-300">
                  #{article.MasterArticle.articleNumber} - {article.MasterArticle.topic}
                </p>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => window.open(`/preview/${articleId}`, '_blank')}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                disabled={deleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Verwijderen
              </Button>
            </div>
          </div>
        </div>

        {/* Warning */}
        {article?.wordpressUrl && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-900">
              Dit artikel is al gepubliceerd op WordPress. Wijzigingen hier worden niet automatisch gesynchroniseerd.
            </AlertDescription>
          </Alert>
        )}

        {/* Edit Form */}
        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basis Informatie</CardTitle>
              <CardDescription>
                Titel en algemene informatie van het artikel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Titel *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Artikel titel"
                />
              </div>

              <div>
                <Label htmlFor="excerpt">Samenvatting</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Korte samenvatting van het artikel"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader>
              <CardTitle>SEO Optimalisatie</CardTitle>
              <CardDescription>
                Verbeter de vindbaarheid van je artikel in zoekmachines
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="metaDesc">Meta Beschrijving (SEO)</Label>
                <Textarea
                  id="metaDesc"
                  value={formData.metaDesc}
                  onChange={(e) => setFormData({ ...formData, metaDesc: e.target.value })}
                  placeholder="Beschrijving die in Google verschijnt (max 160 karakters)"
                  rows={3}
                  maxLength={160}
                />
                <p className="text-xs text-gray-400 mt-1">
                  {formData.metaDesc.length}/160 karakters
                </p>
              </div>

              <div>
                <Label htmlFor="keywords">Keywords</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    id="keywords"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                    placeholder="Voeg keyword toe en druk op Enter"
                  />
                  <Button onClick={handleAddKeyword} variant="outline">
                    Toevoegen
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.keywords.map((keyword, i) => (
                    <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveKeyword(keyword)}>
                      {keyword} ×
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Content</CardTitle>
                  <CardDescription>
                    De volledige tekst van je artikel
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowProductBoxDialog(true)}
                    disabled={!projectId}
                    className="border-orange-600 text-orange-600 hover:bg-orange-50"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Product Box
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCTABoxDialog(true)}
                    className="border-orange-600 text-orange-600 hover:bg-orange-50"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    CTA Box
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Artikel content..."
                rows={20}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-400">
                {formData.content.split(/\s+/).filter(Boolean).length} woorden
              </p>

              {/* Originality.AI Checker */}
              {formData.content && formData.content.length > 100 && (
                <div className="pt-4 border-t border-gray-200">
                  <OriginalityChecker
                    content={formData.content}
                    contentId={articleId}
                    onContentUpdated={(newContent) => {
                      setFormData({ ...formData, content: newContent });
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => router.push('/client-portal/content-library')}
            >
              Annuleren
            </Button>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#ff6b35] hover:bg-orange-600"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Opslaan...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Opslaan
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Product Box Selector */}
      {projectId && (
        <ProductBoxSelector
          open={showProductBoxDialog}
          onClose={() => setShowProductBoxDialog(false)}
          onInsert={handleInsertShortcode}
          projectId={projectId}
        />
      )}

      {/* CTA Box Selector */}
      <CTABoxSelector
        open={showCTABoxDialog}
        onClose={() => setShowCTABoxDialog(false)}
        onInsert={handleInsertShortcode}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Weet je het zeker?</AlertDialogTitle>
            <AlertDialogDescription>
              Deze actie kan niet ongedaan worden gemaakt. Dit artikel wordt permanent verwijderd.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verwijderen...
                </>
              ) : (
                'Verwijderen'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
