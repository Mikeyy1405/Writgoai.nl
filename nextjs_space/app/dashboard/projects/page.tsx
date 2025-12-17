'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  FolderKanban, 
  Plus, 
  Search, 
  Globe, 
  FileText, 
  Edit, 
  Trash2,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { useProject } from '@/lib/contexts/ProjectContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ProjectWithStats {
  id: string;
  name: string;
  websiteUrl?: string | null;
  description?: string | null;
  status: string;
  createdAt: string;
  postCount?: number;
}

export default function ProjectsPage() {
  const router = useRouter();
  const { projects, loading, deleteProject } = useProject();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [projectStats, setProjectStats] = useState<Record<string, number>>({});
  const [loadingStats, setLoadingStats] = useState(false);

  // Filter projects based on search
  const filteredProjects = (projects || []).filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.websiteUrl?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Load post counts for each project
  useEffect(() => {
    async function loadStats() {
      setLoadingStats(true);
      const stats: Record<string, number> = {};
      
      for (const project of projects || []) {
        try {
          const response = await fetch(`/api/admin/projects/${project.id}/posts/count`);
          if (response.ok) {
            const data = await response.json();
            stats[project.id] = data.count || 0;
          }
        } catch (error) {
          console.error(`Failed to load stats for project ${project.id}:`, error);
        }
      }
      
      setProjectStats(stats);
      setLoadingStats(false);
    }

    if ((projects || []).length > 0) {
      loadStats();
    }
  }, [projects]);

  const handleDelete = async (projectId: string, projectName: string) => {
    if (!confirm(`Weet je zeker dat je "${projectName}" wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`)) {
      return;
    }

    const success = await deleteProject(projectId);
    
    if (success) {
      toast({
        title: 'Project verwijderd',
        description: `${projectName} is succesvol verwijderd.`,
      });
    } else {
      toast({
        title: 'Fout',
        description: 'Het project kon niet worden verwijderd. Probeer het opnieuw.',
        variant: 'destructive',
      });
    }
  };

  const activeProjects = (projects || []).filter(p => p.status === 'active').length;
  const totalPosts = Object.values(projectStats).reduce((sum, count) => sum + count, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-zinc-800 rounded-lg">
            <FolderKanban className="w-6 h-6 text-[#FF9933]" />
          </div>
          <h1 className="text-3xl font-bold text-white">Mijn Projecten</h1>
        </div>
        <p className="text-gray-400">
          Beheer je websites en hun instellingen
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-[#FF9933]/10">
              <FolderKanban className="w-6 h-6 text-[#FF9933]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{(projects || []).length}</p>
          <p className="text-sm text-gray-400">Totaal Projecten</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-green-500/10">
              <Globe className="w-6 h-6 text-green-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{activeProjects}</p>
          <p className="text-sm text-gray-400">Actieve Projecten</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {loadingStats ? '...' : totalPosts}
          </p>
          <p className="text-sm text-gray-400">Totaal Posts</p>
        </div>
      </div>

      {/* Search & Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Zoek projecten..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500"
          />
        </div>

        <Link href="/dashboard/projects/new">
          <Button className="bg-[#FF9933] hover:bg-[#FF9933]/90 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Nieuw Project
          </Button>
        </Link>
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF9933]" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-lg">
          <FolderKanban className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h3 className="text-xl font-semibold text-white mb-2">
            {searchQuery ? 'Geen projecten gevonden' : 'Geen projecten'}
          </h3>
          <p className="text-gray-400 mb-6">
            {searchQuery 
              ? 'Probeer een andere zoekopdracht' 
              : 'Maak je eerste project aan om te beginnen'
            }
          </p>
          {!searchQuery && (
            <Link href="/dashboard/projects/new">
              <Button className="bg-[#FF9933] hover:bg-[#FF9933]/90 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Maak Project
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white mb-1 truncate">
                    {project.name}
                  </h3>
                  {project.websiteUrl && (
                    <a
                      href={project.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#3B82F6] hover:text-[#3B82F6]/80 flex items-center gap-1 truncate"
                    >
                      <Globe className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{project.websiteUrl}</span>
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  )}
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  project.status === 'active' 
                    ? 'bg-green-500/10 text-green-400' 
                    : 'bg-slate-8000/10 text-gray-400'
                }`}>
                  {project.status === 'active' ? 'Actief' : 'Inactief'}
                </div>
              </div>

              {project.description && (
                <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                  {project.description}
                </p>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <FileText className="w-4 h-4" />
                  <span>
                    {loadingStats ? '...' : projectStats[project.id] || 0} posts
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/projects/${project.id}`}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-gray-400 hover:text-white hover:bg-zinc-800"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    onClick={() => handleDelete(project.id, project.name)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
