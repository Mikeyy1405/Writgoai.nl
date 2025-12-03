
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, ExternalLink, Calendar, FileText, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface WordPressPost {
  id: number;
  title: string;
  excerpt: string;
  link: string;
  date: string;
  modified: string;
  status: string;
  featuredImage: string | null;
  wordCount: number;
}

export default function WordPressContentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useLanguage();
  
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [posts, setPosts] = useState<WordPressPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [rewriting, setRewriting] = useState(false);
  const [selectedPost, setSelectedPost] = useState<WordPressPost | null>(null);
  const [improvements, setImprovements] = useState('');
  const [showRewriteDialog, setShowRewriteDialog] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isMounted, setIsMounted] = useState(false);
  const [error, setError] = useState<{ message: string; details?: string } | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [includeFAQ, setIncludeFAQ] = useState(false); // FAQ standaard uit

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/client-login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.email) {
      loadProjects();
    }
  }, [session]);

  useEffect(() => {
    if (selectedProject) {
      loadPosts(page);
    }
  }, [selectedProject, page]);

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/client/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
        
        // Auto-select first project
        if (data.projects?.length > 0 && !selectedProject) {
          setSelectedProject(data.projects[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('Fout bij laden projecten');
    }
  };

  const loadPosts = async (pageNum: number) => {
    if (!selectedProject) return;

    setLoading(true);
    setPosts([]); // Clear posts while loading
    setError(null); // Clear previous errors
    
    try {
      const response = await fetch(
        `/api/client/wordpress/posts?projectId=${selectedProject}&page=${pageNum}&perPage=20`
      );

      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
        setTotalPages(data.pagination.totalPages);
        setPage(data.pagination.page);
        setError(null); // Clear error on success
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Fout bij laden posts';
        const errorDetails = errorData.details;
        
        // Set error state for prominent display
        setError({
          message: errorMessage,
          details: errorDetails
        });
        
        // Also show toast
        if (errorDetails) {
          toast.error(
            <div>
              <div className="font-semibold">{errorMessage}</div>
              <div className="text-sm mt-1 text-gray-600">{errorDetails}</div>
            </div>,
            { duration: 6000 }
          );
        } else {
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      setError({
        message: 'Onverwachte fout bij laden WordPress posts',
        details: 'Controleer je internetverbinding en probeer het opnieuw.'
      });
      toast.error('Onverwachte fout bij laden WordPress posts');
    } finally {
      setLoading(false);
    }
  };

  const handleRewriteClick = (post: WordPressPost) => {
    setSelectedPost(post);
    setImprovements('');
    setIncludeFAQ(true); // Reset naar default
    setShowRewriteDialog(true);
  };

  const handleRewriteSubmit = async () => {
    if (!selectedPost || !selectedProject) return;

    setRewriting(true);
    setProgress(0);
    setCurrentStep('Valideren...');
    setShowRewriteDialog(false);
    setShowProgressDialog(true);

    try {
      const response = await fetch('/api/client/wordpress/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProject,
          postId: selectedPost.id,
          improvements: improvements || undefined,
          includeFAQ: includeFAQ
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start rewrite');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let buffer = '';
      const totalSteps = 10; // Aantal verwachte stappen
      let currentStepCount = 0;
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (!line.trim()) continue;
          
          try {
            const data = JSON.parse(line);
            
            if (data.type === 'progress') {
              currentStepCount++;
              const progressPercentage = Math.min((currentStepCount / totalSteps) * 100, 95);
              setProgress(progressPercentage);
              
              // Extract clean step name from message
              let stepName = data.message;
              if (stepName.includes('✅')) {
                stepName = stepName.replace('✅', '').trim();
              } else if (stepName.includes('🔍') || stepName.includes('🔗') || stepName.includes('📄') || stepName.includes('✨') || stepName.includes('🖼️')) {
                stepName = stepName.replace(/[🔍🔗📄✨🖼️]/g, '').trim();
              }
              setCurrentStep(stepName);
            } else if (data.type === 'error') {
              toast.error(data.error);
              setCurrentStep(`Fout: ${data.error}`);
              setProgress(100);
            } else if (data.type === 'success') {
              setProgress(100);
              setCurrentStep('Voltooid! ✅');
              toast.success(
                `✅ Post succesvol herschreven! ${data.creditsUsed} credits gebruikt.`,
                { duration: 5000 }
              );
              
              // Close progress dialog after short delay
              setTimeout(() => {
                setShowProgressDialog(false);
                setSelectedPost(null);
                setImprovements('');
                loadPosts(page);
              }, 2000);
            }
          } catch (e) {
            console.error('Failed to parse line:', line, e);
          }
        }
      }

    } catch (error) {
      console.error('Error rewriting post:', error);
      toast.error('Onverwachte fout bij herschrijven');
      setCurrentStep('Fout opgetreden');
      setProgress(100);
    } finally {
      setRewriting(false);
    }
  };

  if (status === 'loading' || !isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <RefreshCw className="w-8 h-8 text-orange-500" />
            <h1 className="text-3xl font-bold text-white">WordPress Content Herschrijven</h1>
          </div>
          <p className="text-gray-400">
            Selecteer oude WordPress posts en laat ze volledig herschrijven en optimaliseren door AI
          </p>
        </div>

        {/* Project Selector */}
        <Card className="p-6 mb-6 bg-gray-900 border-gray-800">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium min-w-[100px] text-white">Selecteer Project:</label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-full max-w-md bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Kies een project" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id} className="text-white">
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          {selectedProject && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadPosts(page)}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </Card>

        {/* Error Card */}
        {selectedProject && error && !loading && (
          <Card className="p-6 border-red-900/50 bg-red-950/30 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-300 mb-1">{error.message}</h3>
                {error.details && (
                  <p className="text-sm text-red-400 mt-2">
                    {error.details}
                  </p>
                )}
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadPosts(page)}
                    className="bg-gray-800 hover:bg-gray-700 text-white border-gray-700"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Probeer opnieuw
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/client-portal/instellingen')}
                    className="bg-gray-800 hover:bg-gray-700 text-white border-gray-700"
                  >
                    Instellingen
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Info Card */}
        {selectedProject && posts.length === 0 && !loading && !error && (
          <Card className="p-6 border-blue-900/50 bg-blue-950/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-300 mb-1">Geen posts gevonden</h3>
              <p className="text-sm text-blue-400">
                Controleer of je WordPress credentials correct zijn ingesteld en of er posts beschikbaar zijn.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Posts Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Featured Image */}
                {post.featuredImage && (
                  <div className="relative aspect-video bg-gray-200">
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="p-5">
                  {/* Title */}
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                    {post.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>

                  {/* Meta Info */}
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(post.modified).toLocaleDateString('nl-NL')}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{post.wordCount} woorden</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleRewriteClick(post)}
                      className="flex-1"
                      size="sm"
                    >
                      <Sparkles className="w-4 h-4 mr-1.5" />
                      Herschrijf
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(post.link, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                Vorige
              </Button>
              <div className="flex items-center px-4">
                <span className="text-sm text-gray-600">
                  Pagina {page} van {totalPages}
                </span>
              </div>
              <Button
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Volgende
              </Button>
            </div>
          )}
        </>
      )}

      {/* Rewrite Dialog */}
      <Dialog open={showRewriteDialog} onOpenChange={setShowRewriteDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>WordPress Post Herschrijven</DialogTitle>
            <DialogDescription>
              AI zal deze post volledig herschrijven met verbeterde SEO, structuur en content kwaliteit.
            </DialogDescription>
          </DialogHeader>

          {selectedPost && (
            <div className="space-y-4">
              {/* Post Info */}
              <Card className="p-4 bg-gray-50">
                <h4 className="font-semibold mb-1">{selectedPost.title}</h4>
                <p className="text-sm text-gray-600 mb-2">{selectedPost.excerpt}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{selectedPost.wordCount} woorden</span>
                  <span>Laatst gewijzigd: {new Date(selectedPost.modified).toLocaleDateString('nl-NL')}</span>
                </div>
              </Card>

              {/* Improvements Input */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Specifieke verbeteringen (optioneel)
                </label>
                <Textarea
                  value={improvements}
                  onChange={(e) => setImprovements(e.target.value)}
                  placeholder="Bijvoorbeeld: 'Voeg een sectie toe over nieuwe ontwikkelingen in 2025' of 'Focus meer op praktische tips voor beginners'"
                  rows={4}
                  className="w-full"
                />
              </div>

              {/* FAQ Option */}
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includeFAQ" 
                  checked={includeFAQ}
                  onCheckedChange={(checked) => setIncludeFAQ(checked as boolean)}
                />
                <label
                  htmlFor="includeFAQ"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Veelgestelde vragen (FAQ) sectie toevoegen
                </label>
              </div>

              {/* What will happen */}
              <Card className="p-4 border-blue-200 bg-blue-50">
                <h4 className="font-semibold text-blue-900 mb-2">Wat gebeurt er?</h4>
                <ul className="text-sm text-blue-800 space-y-1.5">
                  <li>✨ Content wordt volledig herschreven en gemoderniseerd</li>
                  <li>📊 SEO metadata wordt geoptimaliseerd</li>
                  <li>🖼️ 2 nieuwe AI-gegenereerde afbeeldingen</li>
                  <li>🔗 Interne links worden toegevoegd</li>
                  <li>🎯 Affiliate producten worden automatisch gelinkt</li>
                  <li>📤 Direct gepubliceerd op dezelfde WordPress URL</li>
                </ul>
              </Card>

              {/* Cost Info */}
              <Card className="p-4 border-amber-200 bg-amber-50">
                <p className="text-sm text-amber-900">
                  <strong>Kosten:</strong> Deze actie kost ongeveer{' '}
                  <strong>{(15 + (2 * 10))} credits</strong> (blog generatie + 2 afbeeldingen)
                </p>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRewriteDialog(false)}
              disabled={rewriting}
            >
              Annuleer
            </Button>
            <Button
              onClick={handleRewriteSubmit}
              disabled={rewriting}
            >
              {rewriting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Herschrijven...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Herschrijf & Publiceer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Progress Dialog - Dark Mode with Progress Bar */}
      <Dialog open={showProgressDialog} onOpenChange={() => {}}>
        <DialogContent className="max-w-xl bg-gray-900 border-gray-800" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-white">WordPress Post Herschrijven</DialogTitle>
            <DialogDescription className="text-gray-400">
              AI is je post aan het herschrijven en optimaliseren...
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Progress Bar */}
            <div className="space-y-3">
              <Progress value={progress} className="h-3" />
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{Math.round(progress)}%</span>
                <span className="text-gray-300">{currentStep}</span>
              </div>
            </div>

            {/* Status indicator */}
            {rewriting && (
              <div className="flex items-center justify-center gap-3 py-4">
                <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                <span className="text-gray-300">Bezig met verwerken...</span>
              </div>
            )}
          </div>

          {!rewriting && (
            <DialogFooter>
              <Button
                onClick={() => {
                  setShowProgressDialog(false);
                  setProgress(0);
                  setCurrentStep('');
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Sluiten
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
