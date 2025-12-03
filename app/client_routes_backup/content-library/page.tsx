
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Book,
  Lock,
  Unlock,
  Sparkles,
  TrendingUp,
  Clock,
  Check,
  Loader2,
  FileText,
  BarChart3,
  Zap,
  Download,
  Upload,
  ExternalLink,
  Eye,
  Edit,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ContentLibraryPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [masterPlan, setMasterPlan] = useState<any>(null);
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [generatingArticle, setGeneratingArticle] = useState<string | null>(null);
  const [publishingToWP, setPublishingToWP] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [showArticleDialog, setShowArticleDialog] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/client-login');
    } else if (status === 'authenticated') {
      loadMasterPlan();
    }
  }, [status, router]);

  const loadMasterPlan = async () => {
    try {
      const response = await fetch('/api/client/generate-master-plan');
      if (response.ok) {
        const data = await response.json();
        setMasterPlan(data.masterPlan);
        if (data.masterPlan) {
          setArticles(data.masterPlan.MasterArticles || []);
        }
      }
    } catch (error) {
      console.error('Error loading master plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMasterPlan = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/client/generate-master-plan', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message || 'Content plan wordt gegenereerd!');
        // Poll for completion
        const interval = setInterval(async () => {
          const statusResponse = await fetch('/api/client/generate-master-plan');
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            if (statusData.masterPlan?.status === 'READY') {
              clearInterval(interval);
              setGenerating(false);
              loadMasterPlan();
            }
          }
        }, 5000);
      } else {
        alert(data.error || 'Er ging iets mis');
        setGenerating(false);
      }
    } catch (error) {
      console.error('Error generating master plan:', error);
      alert('Er ging iets mis bij het genereren');
      setGenerating(false);
    }
  };

  const handleReleaseArticles = async () => {
    setReleasing(true);
    try {
      const response = await fetch('/api/client/release-articles', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message || 'Artikelen vrijgegeven!');
        loadMasterPlan();
      } else {
        alert(data.error || 'Kon artikelen niet vrijgeven');
      }
    } catch (error) {
      console.error('Error releasing articles:', error);
      alert('Er ging iets mis');
    } finally {
      setReleasing(false);
    }
  };

  const handleGenerateArticle = async (articleId: string) => {
    setGeneratingArticle(articleId);
    try {
      const response = await fetch('/api/client/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          masterArticleId: articleId,
          publishMode: 'DRAFT', // Save as draft first
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message || 'Artikel gegenereerd!');
        loadMasterPlan();
      } else {
        alert(data.error || 'Kon artikel niet genereren');
      }
    } catch (error) {
      console.error('Error generating article:', error);
      alert('Er ging iets mis');
    } finally {
      setGeneratingArticle(null);
    }
  };

  const handleDownloadArticle = async (article: any) => {
    if (!article.PublishedArticle?.id) {
      alert('Dit artikel is nog niet gegenereerd');
      return;
    }

    try {
      const response = await fetch(
        `/api/client/download-article?id=${article.PublishedArticle.id}`
      );

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${article.title}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('Kon artikel niet downloaden');
    }
  };

  const handlePublishToWordPress = async (article: any) => {
    if (!article.PublishedArticle?.id) {
      alert('Dit artikel is nog niet gegenereerd');
      return;
    }

    if (!confirm('Weet je zeker dat je dit artikel wilt publiceren op WordPress?')) {
      return;
    }

    setPublishingToWP(article.id);
    try {
      const response = await fetch('/api/client/publish-to-wordpress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: article.PublishedArticle.id,
          generateImages: true,
          categories: [article.category].filter(Boolean),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message || 'Artikel gepubliceerd op WordPress!');
        if (data.wordpressUrl) {
          window.open(data.wordpressUrl, '_blank');
        }
        loadMasterPlan();
      } else {
        alert(data.error || 'Kon artikel niet publiceren');
      }
    } catch (error) {
      console.error('WordPress publish error:', error);
      alert('Er ging iets mis bij het publiceren');
    } finally {
      setPublishingToWP(null);
    }
  };

  const handleViewArticle = (article: any) => {
    if (!article.PublishedArticle) {
      alert('Dit artikel is nog niet gegenereerd');
      return;
    }
    setSelectedArticle(article);
    setShowArticleDialog(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-orange-500" />
          <p className="mt-4 text-gray-600">Laden...</p>
        </div>
      </div>
    );
  }

  const releasedCount = articles.length;
  const totalCount = masterPlan?.totalArticles || 200;
  const progress = (releasedCount / totalCount) * 100;

  const priorityColors = {
    HIGH: 'bg-red-500',
    MEDIUM: 'bg-yellow-500',
    LOW: 'bg-green-500',
  };

  const statusIcons = {
    LOCKED: <Lock className="h-4 w-4" />,
    AVAILABLE: <Unlock className="h-4 w-4" />,
    GENERATING: <Loader2 className="h-4 w-4 animate-spin" />,
    GENERATED: <FileText className="h-4 w-4" />,
    PUBLISHED: <Check className="h-4 w-4" />,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/client-portal')}
            className="mb-4"
          >
            ← Terug naar Dashboard
          </Button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📚 Content Bibliotheek
          </h1>
          <p className="text-gray-600">
            200 AI-gegenereerde artikel ideeën volgens de Writgo methode
          </p>
        </div>

        {/* No Master Plan Yet */}
        {!masterPlan && (
          <Card className="border-2 border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-orange-500" />
                Start je Content Revolutie
              </CardTitle>
              <CardDescription>
                Genereer een compleet contentplan van 200 artikelen, gebaseerd op je website en niche
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="font-semibold text-orange-900 mb-2">Wat krijg je?</h3>
                <ul className="space-y-2 text-sm text-orange-800">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>200 unieke artikel ideeën op basis van je niche</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>SEO-geoptimaliseerde titels en keywords</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Geprioriteerd op commerciële waarde</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Automatisch vrijgegeven op basis van je pakket</span>
                  </li>
                </ul>
              </div>

              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Dit proces duurt ongeveer 2-3 minuten. De AI analyseert je website en genereert een compleet contentplan.
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleGenerateMasterPlan}
                disabled={generating}
                size="lg"
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Genereren... Dit duurt 2-3 minuten
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Genereer Content Plan (200 artikelen)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Master Plan Exists */}
        {masterPlan && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Vrijgegeven
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">
                    {releasedCount}
                  </div>
                  <p className="text-xs text-gray-500">van {totalCount} artikelen</p>
                  <Progress value={progress} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Maandelijks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {masterPlan.monthlyAllowance || 0}
                  </div>
                  <p className="text-xs text-gray-500">nieuwe artikelen/maand</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Gepubliceerd
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {articles.filter((a) => a.status === 'PUBLISHED').length}
                  </div>
                  <p className="text-xs text-gray-500">live artikelen</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge
                    variant={masterPlan.status === 'READY' ? 'default' : 'secondary'}
                    className="text-sm"
                  >
                    {masterPlan.status === 'GENERATING' && '⏳ Genereren...'}
                    {masterPlan.status === 'READY' && '✅ Klaar'}
                    {masterPlan.status === 'ACTIVE' && '🚀 Actief'}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* Release Button */}
            {masterPlan.status === 'READY' && releasedCount === 0 && (
              <Alert className="border-orange-200 bg-orange-50">
                <Zap className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-900">
                  Je contentplan is klaar! Klik hieronder om je eerste artikelen vrij te geven op basis van je pakket.
                </AlertDescription>
                <Button
                  onClick={handleReleaseArticles}
                  disabled={releasing}
                  className="mt-3 bg-orange-500 hover:bg-orange-600"
                >
                  {releasing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Bezig...
                    </>
                  ) : (
                    <>
                      <Unlock className="mr-2 h-4 w-4" />
                      Geef artikelen vrij
                    </>
                  )}
                </Button>
              </Alert>
            )}

            {/* Articles Grid */}
            {releasedCount > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Beschikbare Artikelen ({releasedCount})
                  </h2>
                  {releasedCount < totalCount && (
                    <Button
                      onClick={handleReleaseArticles}
                      disabled={releasing}
                      variant="outline"
                      size="sm"
                    >
                      {releasing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Bezig...
                        </>
                      ) : (
                        <>
                          <Unlock className="mr-2 h-4 w-4" />
                          Geef meer vrij
                        </>
                      )}
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {articles.map((article: any) => (
                    <Card
                      key={article.id}
                      className="hover:shadow-lg transition-shadow"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <Badge variant="secondary" className="text-xs">
                            #{article.articleNumber}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-xs ${priorityColors[article.priority as keyof typeof priorityColors]}/10 border-${priorityColors[article.priority as keyof typeof priorityColors]}`}
                          >
                            {article.priority}
                          </Badge>
                        </div>
                        <CardTitle className="text-base line-clamp-2">
                          {article.title}
                        </CardTitle>
                        <CardDescription className="text-xs line-clamp-2">
                          {article.topic}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex flex-wrap gap-1">
                          {article.lsiKeywords.slice(0, 3).map((kw: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {kw}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {article.targetWordCount}w
                          </span>
                          <span className="flex items-center gap-1">
                            <BarChart3 className="h-3 w-3" />
                            {article.difficulty}
                          </span>
                          <span className="flex items-center gap-1">
                            {statusIcons[article.status as keyof typeof statusIcons]}
                            {article.status}
                          </span>
                        </div>

                        {/* Generate Button */}
                        {article.status === 'AVAILABLE' && (
                          <Button
                            onClick={() => handleGenerateArticle(article.id)}
                            disabled={generatingArticle === article.id}
                            className="w-full"
                            size="sm"
                          >
                            {generatingArticle === article.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Genereren...
                              </>
                            ) : (
                              <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Genereer Artikel
                              </>
                            )}
                          </Button>
                        )}

                        {/* Generated/Published Article Actions */}
                        {(article.status === 'GENERATED' || article.status === 'PUBLISHED') && (
                          <div className="space-y-2">
                            <div className="grid grid-cols-3 gap-2">
                              <Button
                                onClick={() => handleViewArticle(article)}
                                variant="outline"
                                size="sm"
                              >
                                <Eye className="mr-1 h-3 w-3" />
                                Bekijk
                              </Button>
                              <Button
                                onClick={() => router.push(`/client-portal/content-library/${article.PublishedArticle.id}/edit`)}
                                variant="outline"
                                size="sm"
                              >
                                <Edit className="mr-1 h-3 w-3" />
                                Edit
                              </Button>
                              <Button
                                onClick={() => handleDownloadArticle(article)}
                                variant="outline"
                                size="sm"
                              >
                                <Download className="mr-1 h-3 w-3" />
                                Download
                              </Button>
                            </div>

                            {article.status === 'GENERATED' && (
                              <Button
                                onClick={() => handlePublishToWordPress(article)}
                                disabled={publishingToWP === article.id}
                                className="w-full bg-blue-600 hover:bg-blue-700"
                                size="sm"
                              >
                                {publishingToWP === article.id ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Publiceren...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Publiceer op WP
                                  </>
                                )}
                              </Button>
                            )}

                            {article.status === 'PUBLISHED' && article.PublishedArticle?.wordpressUrl && (
                              <Button
                                onClick={() => window.open(article.PublishedArticle.wordpressUrl, '_blank')}
                                className="w-full bg-green-600 hover:bg-green-700"
                                size="sm"
                              >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Bekijk op WordPress
                              </Button>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Article Preview Dialog */}
        <Dialog open={showArticleDialog} onOpenChange={setShowArticleDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {selectedArticle?.title}
              </DialogTitle>
              <DialogDescription className="space-y-2">
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="secondary">
                    #{selectedArticle?.articleNumber}
                  </Badge>
                  <Badge variant="outline">{selectedArticle?.category}</Badge>
                  <Badge variant="outline">{selectedArticle?.status}</Badge>
                </div>
              </DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="h-[60vh] w-full pr-4">
              {selectedArticle?.PublishedArticle && (
                <div className="space-y-4">
                  {/* SEO Info */}
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div>
                      <strong className="text-sm text-gray-600">SEO Titel:</strong>
                      <p className="text-sm">{selectedArticle.PublishedArticle.seoTitle}</p>
                    </div>
                    <div>
                      <strong className="text-sm text-gray-600">Meta Beschrijving:</strong>
                      <p className="text-sm">{selectedArticle.PublishedArticle.metaDescription}</p>
                    </div>
                    <div>
                      <strong className="text-sm text-gray-600">Keywords:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedArticle.PublishedArticle.keywords?.map((kw: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {kw}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Excerpt */}
                  {selectedArticle.PublishedArticle.excerpt && (
                    <div className="bg-orange-50 border-l-4 border-orange-500 p-4">
                      <strong className="text-sm text-orange-900">Samenvatting:</strong>
                      <p className="text-sm text-orange-800 mt-1">
                        {selectedArticle.PublishedArticle.excerpt}
                      </p>
                    </div>
                  )}

                  {/* Content Preview */}
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap">
                      {selectedArticle.PublishedArticle.content?.substring(0, 2000)}
                      {selectedArticle.PublishedArticle.content?.length > 2000 && '...'}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      onClick={() => {
                        setShowArticleDialog(false);
                        router.push(`/client-portal/content-library/${selectedArticle.PublishedArticle.id}/edit`);
                      }}
                      variant="outline"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Bewerken
                    </Button>
                    
                    <Button
                      onClick={() => handleDownloadArticle(selectedArticle)}
                      variant="outline"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    
                    {selectedArticle.status === 'GENERATED' && (
                      <Button
                        onClick={() => {
                          setShowArticleDialog(false);
                          handlePublishToWordPress(selectedArticle);
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Publiceer op WordPress
                      </Button>
                    )}

                    {selectedArticle.PublishedArticle.wordpressUrl && (
                      <Button
                        onClick={() => window.open(selectedArticle.PublishedArticle.wordpressUrl, '_blank')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Bekijk op WordPress
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
