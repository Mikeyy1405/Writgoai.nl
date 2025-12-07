'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Globe, BookOpen, Settings, TrendingUp, 
  Loader2, FileText, Link2, Users, Plug, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import ProjectKnowledgeBase from '@/components/project-knowledge-base';
import ProjectGSCConfig from '@/components/project-gsc-config';
import ProjectGSCDashboard from '@/components/project-gsc-dashboard';
import ProjectSettings from '@/components/project-settings';
import ProjectIntegrations from '@/components/project-integrations';
import ProjectAffiliateLinks from '@/components/project-affiliate-links';
import ProjectContentHub from '@/components/project-content-hub';

interface Project {
  id: string;
  name: string;
  websiteUrl: string;
  description?: string;
  language: string;
  niche?: string;
  keywords: string[];
  _count: {
    savedContent: number;
    knowledgeBase: number;
  };
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchProject();
    
    // Check for tab parameter
    const tab = searchParams?.get('tab');
    if (tab) {
      setActiveTab(tab);
    }

    // Check for GSC OAuth callback
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const gscStatus = params.get('gsc');
      const message = params.get('message');

      if (gscStatus === 'success') {
        toast.success('✅ Google Search Console succesvol gekoppeld!');
        setActiveTab('gsc');
        router.replace(`/client-portal/projects/${projectId}?tab=gsc`, { scroll: false });
      } else if (gscStatus === 'error') {
        toast.error(`❌ Fout bij koppelen: ${message || 'Onbekende fout'}`);
        router.replace(`/client-portal/projects/${projectId}`, { scroll: false });
      }
    }
  }, [projectId, searchParams]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/client/projects/${projectId}`);
      if (!response.ok) throw new Error('Failed to fetch project');
      const data = await response.json();
      setProject(data.project);
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Kon project niet laden');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-[#ff6b35]" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black">
        <p className="text-white mb-4">Project niet gevonden</p>
        <Button onClick={() => router.push('/client-portal/projects')}>
          Terug naar projecten
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/client-portal/projects')}
            className="mb-3 text-gray-300 hover:text-white hover:bg-zinc-800 text-sm"
          >
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            Terug
          </Button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-white flex items-center gap-2 sm:gap-3">
                <Globe className="w-5 h-5 sm:w-8 sm:h-8 text-[#ff6b35]" />
                <span className="break-all">{project.name}</span>
              </h1>
              <a
                href={project.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-xs sm:text-sm mt-1 inline-block break-all"
              >
                {project.websiteUrl}
              </a>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                {project.language === 'NL' ? '🇳🇱 Nederlands' : 
                 project.language === 'EN' ? '🇺🇸 English' :
                 project.language === 'DE' ? '🇩🇪 Deutsch' :
                 project.language === 'ES' ? '🇪🇸 Español' :
                 project.language === 'FR' ? '🇫🇷 Français' :
                 project.language === 'IT' ? '🇮🇹 Italiano' :
                 project.language === 'PT' ? '🇵🇹 Português' : project.language}
              </Badge>
              {project.niche && (
                <Badge className="bg-[#ff6b35]/20 text-[#ff6b35] text-xs">{project.niche}</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 sm:grid-cols-7 gap-1 sm:gap-2 bg-zinc-900 p-1 mb-4 sm:mb-6 h-auto">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-[#ff6b35] data-[state=active]:text-white text-gray-300 hover:text-white text-xs sm:text-sm py-2 sm:py-3"
            >
              <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 hidden sm:inline" />
              <span className="hidden sm:inline">Info</span>
              <span className="sm:hidden">ℹ️</span>
            </TabsTrigger>
            <TabsTrigger 
              value="content-hub"
              className="data-[state=active]:bg-[#ff6b35] data-[state=active]:text-white text-gray-300 hover:text-white text-xs sm:text-sm py-2 sm:py-3"
            >
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 hidden sm:inline" />
              <span className="hidden sm:inline">Content Planning</span>
              <span className="sm:hidden">✨</span>
            </TabsTrigger>
            <TabsTrigger 
              value="knowledge"
              className="data-[state=active]:bg-[#ff6b35] data-[state=active]:text-white text-gray-300 hover:text-white text-xs sm:text-sm py-2 sm:py-3"
            >
              <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 hidden sm:inline" />
              <span className="hidden sm:inline">Knowledge</span>
              <span className="sm:hidden">📚</span>
            </TabsTrigger>
            <TabsTrigger 
              value="gsc"
              className="data-[state=active]:bg-[#ff6b35] data-[state=active]:text-white text-gray-300 hover:text-white text-xs sm:text-sm py-2 sm:py-3"
            >
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 hidden sm:inline" />
              <span className="hidden sm:inline">GSC</span>
              <span className="sm:hidden">📊</span>
            </TabsTrigger>
            <TabsTrigger 
              value="integrations"
              className="data-[state=active]:bg-[#ff6b35] data-[state=active]:text-white text-gray-300 hover:text-white text-xs sm:text-sm py-2 sm:py-3"
            >
              <Plug className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 hidden sm:inline" />
              <span className="hidden sm:inline">Integraties</span>
              <span className="sm:hidden">🔌</span>
            </TabsTrigger>
            <TabsTrigger 
              value="affiliate"
              className="data-[state=active]:bg-[#ff6b35] data-[state=active]:text-white text-gray-300 hover:text-white text-xs sm:text-sm py-2 sm:py-3"
            >
              <Link2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 hidden sm:inline" />
              <span className="hidden sm:inline">Affiliate</span>
              <span className="sm:hidden">🔗</span>
            </TabsTrigger>
            <TabsTrigger 
              value="settings"
              className="data-[state=active]:bg-[#ff6b35] data-[state=active]:text-white text-gray-300 hover:text-white text-xs sm:text-sm py-2 sm:py-3"
            >
              <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 hidden sm:inline" />
              <span className="hidden sm:inline">Instellingen</span>
              <span className="sm:hidden">⚙️</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Stats Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card className="bg-gradient-to-br from-[#ff6b35] to-[#ff8c42] border-0">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-xs sm:text-sm mb-1">Artikelen</p>
                      <p className="text-2xl sm:text-3xl font-bold text-white">{project._count.savedContent}</p>
                    </div>
                    <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-white/40" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-blue-600 to-blue-500 border-0">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-xs sm:text-sm mb-1">Knowledge</p>
                      <p className="text-2xl sm:text-3xl font-bold text-white">{project._count.knowledgeBase}</p>
                    </div>
                    <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-white/40" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-600 to-green-500 border-0">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-xs sm:text-sm mb-1">Taal</p>
                      <p className="text-xl sm:text-2xl font-bold text-white">
                        {project.language === 'NL' ? '🇳🇱 NL' : 
                         project.language === 'EN' ? '🇺🇸 EN' :
                         project.language === 'DE' ? '🇩🇪 DE' :
                         project.language === 'ES' ? '🇪🇸 ES' :
                         project.language === 'FR' ? '🇫🇷 FR' :
                         project.language === 'IT' ? '🇮🇹 IT' :
                         project.language === 'PT' ? '🇵🇹 PT' : project.language}
                      </p>
                    </div>
                    <Globe className="w-8 h-8 sm:w-10 sm:h-10 text-white/40" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-600 to-purple-500 border-0">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-xs sm:text-sm mb-1">Niche</p>
                      <p className="text-base sm:text-lg font-bold text-white truncate">
                        {project.niche || 'Geen niche'}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 text-white/40" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Description Card */}
            {project.description && (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-base sm:text-lg">Beschrijving</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-sm sm:text-base leading-relaxed">{project.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Keywords Card */}
            {project.keywords.length > 0 && (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-base sm:text-lg">Keywords</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {project.keywords.map((kw, i) => (
                      <Badge 
                        key={i} 
                        className="bg-[#ff6b35]/20 text-[#ff6b35] border-[#ff6b35]/30 text-xs sm:text-sm px-3 py-1"
                      >
                        {kw}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Content Planning Tab */}
          <TabsContent value="content-hub">
            <ProjectContentHub projectId={projectId} projectUrl={project.websiteUrl} />
          </TabsContent>

          {/* Knowledge Base Tab */}
          <TabsContent value="knowledge">
            <ProjectKnowledgeBase projectId={projectId} />
          </TabsContent>

          {/* GSC Tab */}
          <TabsContent value="gsc" className="space-y-4">
            <ProjectGSCConfig projectId={projectId} />
            <ProjectGSCDashboard projectId={projectId} />
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations">
            <ProjectIntegrations projectId={projectId} />
          </TabsContent>

          {/* Affiliate Tab */}
          <TabsContent value="affiliate">
            <ProjectAffiliateLinks projectId={projectId} />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <ProjectSettings 
              project={project} 
              onUpdate={(updatedProject) => setProject(updatedProject)} 
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
