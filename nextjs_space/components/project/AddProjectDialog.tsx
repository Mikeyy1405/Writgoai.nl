'use client';

import React, { useState } from 'react';
import { useProject } from '@/lib/contexts/ProjectContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';

interface AddProjectDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AddProjectDialog({ open, onClose }: AddProjectDialogProps) {
  const { addProject } = useProject();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    websiteUrl: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Basic validation
      if (!formData.name.trim()) {
        setError('Project naam is verplicht');
        setLoading(false);
        return;
      }

      if (!formData.websiteUrl.trim()) {
        setError('Website URL is verplicht');
        setLoading(false);
        return;
      }

      // Validate URL format
      try {
        new URL(formData.websiteUrl);
      } catch {
        setError('Voer een geldige URL in (bijv. https://example.com)');
        setLoading(false);
        return;
      }

      await addProject({
        name: formData.name.trim(),
        websiteUrl: formData.websiteUrl.trim(),
        description: formData.description.trim() || null,
      });

      // Reset form and close
      setFormData({ name: '', websiteUrl: '', description: '' });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Er is iets misgegaan bij het aanmaken van het project');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(null); // Clear error when user starts typing
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nieuw Project Toevoegen</DialogTitle>
          <DialogDescription>
            Voeg een nieuwe website toe om te beheren met Writgo.nl
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">
                Project Naam <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="bijv. WritGo.nl"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Een herkenbare naam voor je website of project
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="websiteUrl">
                Website URL <span className="text-red-500">*</span>
              </Label>
              <Input
                id="websiteUrl"
                name="websiteUrl"
                type="url"
                placeholder="https://writgo.nl"
                value={formData.websiteUrl}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                De volledige URL van je website (inclusief https://)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Beschrijving <span className="text-muted-foreground text-xs">(optioneel)</span>
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Korte beschrijving van het project..."
                value={formData.description}
                onChange={handleChange}
                rows={3}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Een korte beschrijving om het project te herkennen
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Annuleren
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Project Toevoegen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
