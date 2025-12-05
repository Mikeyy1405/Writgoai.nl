'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Globe, 
  Plus, 
  BarChart3, 
  FileText, 
  CheckCircle2, 
  Clock,
  Settings,
  RefreshCw,
  Sparkles,
  Loader2,
  AlertCircle,
  FolderKanban,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import BlogPostsManagement from './components/blog-posts-management';
import BlogArticleGenerator from './components/blog-article-generator';

interface BlogStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  scheduledPosts: number;
  totalViews: number;
  avgWordCount: number;
}

interface AdminProject {
  id: string;
  name: string;
  websiteUrl: string | null;
  wordpressUrl: string | null;
  blogPostCount: number;
}

export default function AgencyContentHubPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<BlogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  useEffect(() => {
    // Check if user is admin - using role-based check only for consistency
    if (status === 'authenticated') {
      const isAdmin = session?.user?.role === 'admin';
      if (!isAdmin) {
        toast.error('Alleen admins hebben toegang tot deze pagina');
        router.push('/dashboard/agency');
        return;
      }
      loadProjects();
      loadStats();
    } else if (status === 'unauthenticated') {
      router.push('/inloggen');
    }
  }, [status, session, router]);

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/admin/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/blog/stats');
      
      if (!response.ok) {
        throw new Error('Failed to load stats');
      }

      const data = await response.json();
      setStats(data.stats);
    } catch (error: any) {
      console.error('Failed to load stats:', error);
      toast.error('Kon statistieken niet laden');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishAll = async () => {
    if (!confirm('Weet je zeker dat je alle concept artikelen wilt publiceren?')) {
      return;
    }

    try {
      setPublishing(true);
      toast.loading('Alle artikelen publiceren...', { id: 'publish-all' });

      const response = await fetch('/api/admin/blog/publish-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Publicatie mislukt');
      }

      const data = await response.json();
      
      toast.success(`${data.published} artikelen gepubliceerd!`, { id: 'publish-all' });
      
      // Reload stats
      await loadStats();
    } catch (error: any) {
      console.error('Failed to publish all:', error);
      toast.error(error.message || 'Kon artikelen niet publiceren', { id: 'publish-all' });
    } finally {
      setPublishing(false);
    }
  };

  const handleGenerateArticle = () => {
    setShowGenerator(true);
  };

  const handleGeneratorClose = () => {
    setShowGenerator(false);
    setSelectedArticle(null);
  };

  const handleGeneratorComplete = () => {
    setShowGenerator(false);
    setSelectedArticle(null);
    loadStats();
  };

  if (loading || status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Content Hub laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-[#FF9933]" />
            Writgo.nl Blog Content Hub
          </h1>
          <p className="text-muted-foreground mt-1">
            Beheer en genereer content voor de Writgo.nl blog
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handlePublishAll} 
            variant="outline"
            disabled={publishing || !stats || stats.draftPosts === 0}
            className="gap-2"
          >
            {publishing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Publiceer Alle Concepten
          </Button>
          <Button onClick={handleGenerateArticle} className="gap-2">
            <Plus className="h-4 w-4" />
            Nieuw Artikel Genereren
          </Button>
        </div>
      </div>

      {/* Project Selector */}
      {projects.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-800">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FolderKanban className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <span>Project selecteren:</span>
              </div>
              <div className="flex-1 max-w-md">
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecteer een project (of gebruik standaard Writgo.nl)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <span>Writgo.nl (standaard)</span>
                      </div>
                    </SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        <div className="flex items-center gap-2">
                          <FolderKanban className="h-4 w-4" />
                          <span>{project.name}</span>
                          {project.wordpressUrl && (
                            <Badge variant="outline" className="ml-2 text-xs">WP</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Link href="/dashboard/agency/projects">
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Beheer Projecten
                </Button>
              </Link>
            </div>
            {selectedProjectId && (
              <p className="text-xs text-muted-foreground mt-2 ml-7">
                💡 Content wordt gegenereerd voor het geselecteerde project en kan automatisch naar WordPress worden gepubliceerd
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      {stats && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="h-6 w-6 text-[#FF9933]" />
                <div>
                  <CardTitle>https://writgo.nl/blog</CardTitle>
                  <CardDescription>
                    Writgo.nl Blog Management
                  </CardDescription>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadStats}
                title="Statistieken verversen"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Total Posts */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Totaal</span>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold">
                  {stats.totalPosts}
                </div>
                <div className="text-sm text-muted-foreground">
                  artikelen
                </div>
              </div>

              {/* Published */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Gepubliceerd</span>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </div>
                <div className="text-2xl font-bold text-green-500">
                  {stats.publishedPosts}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stats.totalPosts > 0 ? Math.round((stats.publishedPosts / stats.totalPosts) * 100) : 0}% van totaal
                </div>
              </div>

              {/* Draft */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Concepten</span>
                  <Clock className="h-4 w-4 text-orange-500" />
                </div>
                <div className="text-2xl font-bold text-orange-500">
                  {stats.draftPosts}
                </div>
                <div className="text-sm text-muted-foreground">
                  te publiceren
                </div>
              </div>

              {/* Views */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Views</span>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold">
                  {stats.totalViews.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  totale weergaven
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Banner */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Content Hub voor Writgo.nl Blog
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Deze Content Hub is specifiek voor het beheren van artikelen op de Writgo.nl blog. 
                Gebruik de AI artikel generator om SEO-geoptimaliseerde content te creëren met SERP analyse, 
                afbeeldingen generatie en automatische SEO optimalisatie.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">
            <FileText className="h-4 w-4 mr-2" />
            Alle Artikelen ({stats?.totalPosts || 0})
          </TabsTrigger>
          <TabsTrigger value="published">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Gepubliceerd ({stats?.publishedPosts || 0})
          </TabsTrigger>
          <TabsTrigger value="draft">
            <Clock className="h-4 w-4 mr-2" />
            Concepten ({stats?.draftPosts || 0})
          </TabsTrigger>
          <TabsTrigger value="scheduled">
            <Clock className="h-4 w-4 mr-2" />
            Gepland ({stats?.scheduledPosts || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <BlogPostsManagement filter="all" onRefresh={loadStats} />
        </TabsContent>

        <TabsContent value="published" className="mt-6">
          <BlogPostsManagement filter="published" onRefresh={loadStats} />
        </TabsContent>

        <TabsContent value="draft" className="mt-6">
          <BlogPostsManagement filter="draft" onRefresh={loadStats} />
        </TabsContent>

        <TabsContent value="scheduled" className="mt-6">
          <BlogPostsManagement filter="scheduled" onRefresh={loadStats} />
        </TabsContent>
      </Tabs>

      {/* Article Generator Modal */}
      {showGenerator && (
        <BlogArticleGenerator
          onClose={handleGeneratorClose}
          onComplete={handleGeneratorComplete}
        />
      )}
    </div>
  );
}
