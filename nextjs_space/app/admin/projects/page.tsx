'use client';

import React, { useState } from 'react';
import { useProject } from '@/lib/contexts/ProjectContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Globe, 
  Plus, 
  Check, 
  Edit, 
  Trash2, 
  ExternalLink,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { AddProjectDialog } from '@/components/project/AddProjectDialog';

export default function ProjectsManagementPage() {
  const { projects, currentProject, switchProject, updateProject, deleteProject, loading } = useProject();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [deletingProject, setDeletingProject] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    websiteUrl: '',
    description: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleEditClick = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setEditFormData({
        name: project.name,
        websiteUrl: project.websiteUrl,
        description: project.description || '',
      });
      setEditingProject(projectId);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setActionLoading(true);

    try {
      await updateProject(editingProject!, editFormData);
      setEditingProject(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update project');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProject) return;
    
    setError(null);
    setActionLoading(true);

    try {
      await deleteProject(deletingProject);
      setDeletingProject(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete project');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-400">Projecten laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Projecten Beheren</h1>
          <p className="text-gray-400 mt-2">
            Beheer al je websites en projecten op één plek
          </p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nieuw Project
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Card
            key={project.id}
            className={`
              bg-gray-900 border-gray-800 hover:border-gray-700 transition-all
              ${project.id === currentProject?.id ? 'ring-2 ring-orange-500 border-orange-500/50' : ''}
            `}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg text-gray-100 truncate flex items-center gap-2">
                    <Globe className="w-5 h-5 text-orange-400 flex-shrink-0" />
                    {project.name}
                  </CardTitle>
                  <CardDescription className="mt-1 flex items-center gap-2">
                    <a
                      href={project.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-400 hover:text-orange-300 truncate flex items-center gap-1 text-sm"
                    >
                      {project.websiteUrl}
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  </CardDescription>
                </div>
                {project.id === currentProject?.id && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                    <Check className="w-3 h-3 mr-1" />
                    Actief
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {project.description && (
                <p className="text-sm text-gray-400 line-clamp-2">
                  {project.description}
                </p>
              )}

              <div className="flex items-center gap-2">
                {project.id !== currentProject?.id && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => switchProject(project.id)}
                    className="flex-1"
                  >
                    Activeer
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEditClick(project.id)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDeletingProject(project.id)}
                  className="text-red-400 hover:text-red-300"
                  disabled={projects.length === 1}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add New Project Card */}
        <Card
          className="bg-gray-900/50 border-gray-800 border-dashed hover:border-orange-500/50 transition-all cursor-pointer"
          onClick={() => setShowAddDialog(true)}
        >
          <CardContent className="flex flex-col items-center justify-center min-h-[200px] text-center">
            <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center mb-4">
              <Plus className="w-6 h-6 text-orange-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-100 mb-2">
              Nieuw Project
            </h3>
            <p className="text-sm text-gray-400">
              Voeg een nieuwe website toe om te beheren
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add Project Dialog */}
      <AddProjectDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
      />

      {/* Edit Project Dialog */}
      <Dialog open={!!editingProject} onOpenChange={(open) => !open && setEditingProject(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Project Bewerken</DialogTitle>
            <DialogDescription>
              Wijzig de gegevens van je project
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Project Naam</Label>
                <Input
                  id="edit-name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  required
                  disabled={actionLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-url">Website URL</Label>
                <Input
                  id="edit-url"
                  type="url"
                  value={editFormData.websiteUrl}
                  onChange={(e) => setEditFormData({ ...editFormData, websiteUrl: e.target.value })}
                  required
                  disabled={actionLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Beschrijving</Label>
                <Textarea
                  id="edit-description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  rows={3}
                  disabled={actionLoading}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingProject(null)}
                disabled={actionLoading}
              >
                Annuleren
              </Button>
              <Button type="submit" disabled={actionLoading}>
                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Opslaan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingProject} onOpenChange={(open) => !open && setDeletingProject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Project Verwijderen</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je dit project wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
              Alle content en instellingen van dit project worden permanent verwijderd.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={actionLoading}
              className="bg-red-500 hover:bg-red-600"
            >
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
