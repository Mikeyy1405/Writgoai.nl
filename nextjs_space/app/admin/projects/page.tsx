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
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface AdminProject {
  id: string;
  name: string;
  websiteUrl: string | null;
  description: string | null;
  wordpressUrl: string | null;
  language: string;
  niche: string | null;
  isActive: boolean;
  blogPostCount: number;
  createdAt: string;
}

export default function AdminProjectsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/inloggen');
    } else if (status === 'authenticated') {
      // Check if user is admin
      if ((session?.user as any)?.role !== 'admin') {
        toast.error('Alleen admins hebben toegang tot deze pagina');
        router.push('/client-portal');
        return;
      }
      fetchProjects();
    }
  }, [status, session, router]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/projects');
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
      const res = await fetch(`/api/admin/projects/${deleteProjectId}`, {
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
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="mb-4 text-gray-300 hover:text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="text-sm sm:text-base">Terug naar dashboard</span>
            </Button>
          </Link>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Admin Projecten</h1>
              <p className="text-sm sm:text-base text-gray-400 mt-1 sm:mt-2">
                Beheer meerdere websites en WordPress sites
              </p>
            </div>
            <Link href="/admin/projects/new" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white">
                <Plus className="h-4 w-4 mr-2" />
                <span className="text-sm sm:text-base">Nieuw project</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="bg-gray-800/50 border-gray-700">
              <CardHeader className="pb-3 sm:pb-6">
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-white">
                      <Globe className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                      <span className="truncate">{project.name}</span>
                    </CardTitle>
                    {!project.isActive && (
                      <Badge variant="secondary" className="text-xs">Inactief</Badge>
                    )}
                  </div>
                  {project.websiteUrl && (
                    <CardDescription className="text-xs sm:text-sm break-all text-gray-400">
                      {project.websiteUrl}
                    </CardDescription>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {project.description && (
                  <p className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4 line-clamp-2">
                    {project.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                  {project.niche && (
                    <Badge variant="outline" className="text-xs text-gray-300 border-gray-600">
                      {project.niche}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs text-gray-300 border-gray-600">
                    {project.language}
                  </Badge>
                  {project.wordpressUrl && (
                    <Badge variant="outline" className="text-xs text-green-400 border-green-600">
                      WordPress
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                  <FileText className="h-3 w-3" />
                  <span>{project.blogPostCount} blog posts</span>
                </div>

                <div className="space-y-2">
                  <Link href={`/admin/projects/${project.id}`}>
                    <Button variant="default" size="sm" className="w-full text-sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Project bekijken
                    </Button>
                  </Link>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Link href={`/admin/projects/${project.id}`}>
                      <Button variant="outline" size="sm" className="w-full text-sm border-gray-600 text-gray-300 hover:bg-gray-700">
                        <Settings className="h-4 w-4 mr-2" />
                        Instellingen
                      </Button>
                    </Link>
                    
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="w-full text-sm"
                      onClick={() => setDeleteProjectId(project.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Verwijderen
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {projects.length === 0 && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="py-8 sm:py-12 text-center px-4">
              <Globe className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-gray-400 mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base text-gray-400 mb-3 sm:mb-4">Nog geen projecten aangemaakt</p>
              <Link href="/admin/projects/new" className="inline-block w-full sm:w-auto">
                <Button className="w-full sm:w-auto text-sm sm:text-base bg-orange-500 hover:bg-orange-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Nieuw project aanmaken
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteProjectId !== null} onOpenChange={(open) => !open && setDeleteProjectId(null)}>
          <AlertDialogContent className="bg-gray-800 border-gray-700 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Project verwijderen?</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                Weet je zeker dat je dit project wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
                Alle gekoppelde blog posts worden ook verwijderd.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting} className="bg-gray-700 text-white hover:bg-gray-600">
                Annuleren
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteProject}
                disabled={deleting}
                className="bg-red-600 text-white hover:bg-red-700"
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
