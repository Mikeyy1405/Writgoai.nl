
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  Loader2,
  Globe,
  Settings,
  Eye,
  Plus,
  ArrowLeft,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Project {
  id: string;
  name: string;
  websiteUrl: string;
  description: string | null;
  isActive: boolean;
  isPrimary: boolean;
  isOwner?: boolean;
  isCollaborator?: boolean;
  collaboratorRole?: string;
}

export default function ProjectsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/client-login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.email) {
      fetchProjects();
    }
  }, [session]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/client/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      toast.error('Kon projecten niet laden');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!deleteProjectId) return;
    
    try {
      setDeleting(true);
      const res = await fetch(`/api/client/projects/${deleteProjectId}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) throw new Error('Failed to delete project');
      
      toast.success('Project verwijderd');
      setDeleteProjectId(null);
      fetchProjects(); // Refresh the list
    } catch (error: any) {
      console.error('Error deleting project:', error);
      toast.error('Kon project niet verwijderen');
    } finally {
      setDeleting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
        <div className="mb-6">
          <Link href="/client-portal">
            <Button variant="ghost" size="sm" className="mb-4 text-gray-300 hover:text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="text-sm sm:text-base">Terug naar dashboard</span>
            </Button>
          </Link>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Mijn Projecten</h1>
              <p className="text-sm sm:text-base text-gray-400 mt-1 sm:mt-2">
                Beheer je websites en deel ze met collaborators
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Link href="/client-portal/content-hub" className="flex-1 sm:flex-initial">
                <Button variant="outline" className="w-full gap-2 text-gray-300 border-gray-600 hover:bg-gray-800">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-sm sm:text-base">Content Hub</span>
                </Button>
              </Link>
              <Link href="/client-portal/projects/new" className="flex-1 sm:flex-initial">
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="text-sm sm:text-base">Nieuw project</span>
                </Button>
              </Link>
            </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        {projects.map((project) => (
          <Card key={project.id}>
            <CardHeader className="pb-3 sm:pb-6">
              <div className="flex flex-col sm:flex-row items-start gap-2 sm:justify-between">
                <div className="flex-1 w-full">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Globe className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span className="truncate">{project.name}</span>
                  </CardTitle>
                  <CardDescription className="mt-1 text-xs sm:text-sm break-all">
                    {project.websiteUrl}
                  </CardDescription>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {project.isPrimary && (
                    <Badge variant="secondary" className="text-xs whitespace-nowrap">Primair</Badge>
                  )}
                  {project.isCollaborator && (
                    <Badge variant="outline" className="text-xs whitespace-nowrap bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300">
                      {project.collaboratorRole === 'client' ? '👤 Gedeeld' : '👔 Medewerker'}
                    </Badge>
                  )}
                  {project.isOwner && !project.isPrimary && (
                    <Badge variant="outline" className="text-xs whitespace-nowrap">Eigenaar</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {project.description && (
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                  {project.description}
                </p>
              )}

              <div className="space-y-2">
                <Link href={`/client-portal/projects/${project.id}`}>
                  <Button variant="default" size="sm" className="w-full text-sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Project bekijken
                  </Button>
                </Link>
                
                <div className="grid grid-cols-2 gap-2">
                  <Link href={`/client-portal/projects/${project.id}`}>
                    <Button variant="outline" size="sm" className="w-full text-sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Instellingen
                    </Button>
                  </Link>
                  
                  {project.isOwner && (
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="w-full text-sm"
                      onClick={() => setDeleteProjectId(project.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Verwijderen
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {projects.length === 0 && (
        <Card>
          <CardContent className="py-8 sm:py-12 text-center px-4">
            <Globe className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">Nog geen projecten</p>
            <Link href="/client-portal/projects/create" className="inline-block w-full sm:w-auto">
              <Button className="w-full sm:w-auto text-sm sm:text-base">
                Nieuw project aanmaken
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteProjectId !== null} onOpenChange={(open) => !open && setDeleteProjectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Project verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je dit project wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
              Alle content, instellingen en knowledge base items worden permanent verwijderd.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verwijderen...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Verwijderen
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      </div>
    </div>
  );
}
