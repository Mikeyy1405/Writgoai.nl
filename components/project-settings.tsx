'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ProjectSettingsProps {
  project: any;
  onUpdate: (project: any) => void;
}

export default function ProjectSettings({ project, onUpdate }: ProjectSettingsProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: project.name || '',
    websiteUrl: project.websiteUrl || '',
    description: project.description || '',
    language: project.language || 'NL',
    niche: project.niche || '',
    keywords: project.keywords?.join(', ') || '',
    targetAudience: project.targetAudience || '',
    brandVoice: project.brandVoice || '',
    writingStyle: project.writingStyle || ''
  });

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.websiteUrl.trim()) {
      toast.error('Naam en website URL zijn verplicht');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/client/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean)
        })
      });

      if (!response.ok) throw new Error('Failed to update project');
      
      const data = await response.json();
      onUpdate(data.project);
      setEditing(false);
      toast.success('Project bijgewerkt');
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Fout bij bijwerken project');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Weet je zeker dat je dit project wilt verwijderen?')) return;

    try {
      const response = await fetch(`/api/client/projects/${project.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete project');
      
      toast.success('Project verwijderd');
      window.location.href = '/client-portal/projects';
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Fout bij verwijderen project');
    }
  };

  return (
    <Card className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border-[#ff6b35]/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-base sm:text-lg">Project Instellingen</CardTitle>
          {!editing && (
            <Button
              onClick={() => setEditing(true)}
              size="sm"
              className="bg-[#ff6b35] hover:bg-[#ff8c42] text-white text-xs"
            >
              Bewerken
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div>
            <Label className="text-gray-300 text-sm">Projectnaam *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={!editing}
              className="bg-zinc-800 border-zinc-700 text-white text-sm mt-1"
            />
          </div>

          <div>
            <Label className="text-gray-300 text-sm">Website URL *</Label>
            <Input
              value={formData.websiteUrl}
              onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
              disabled={!editing}
              placeholder="https://example.com"
              className="bg-zinc-800 border-zinc-700 text-white text-sm mt-1"
            />
          </div>

          <div>
            <Label className="text-gray-300 text-sm">Taal</Label>
            <Select
              value={formData.language}
              onValueChange={(value) => setFormData({ ...formData, language: value })}
              disabled={!editing}
            >
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white text-sm mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NL">🇳🇱 Nederlands</SelectItem>
                <SelectItem value="EN">🇺🇸 English</SelectItem>
                <SelectItem value="DE">🇩🇪 Deutsch</SelectItem>
                <SelectItem value="ES">🇪🇸 Español</SelectItem>
                <SelectItem value="FR">🇫🇷 Français</SelectItem>
                <SelectItem value="IT">🇮🇹 Italiano</SelectItem>
                <SelectItem value="PT">🇵🇹 Português</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-gray-300 text-sm">Niche</Label>
            <Input
              value={formData.niche}
              onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
              disabled={!editing}
              placeholder="Bijvoorbeeld: Lifestyle, Tech, Travel"
              className="bg-zinc-800 border-zinc-700 text-white text-sm mt-1"
            />
          </div>

          <div>
            <Label className="text-gray-300 text-sm">Keywords (comma-separated)</Label>
            <Input
              value={formData.keywords}
              onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
              disabled={!editing}
              placeholder="keyword1, keyword2, keyword3"
              className="bg-zinc-800 border-zinc-700 text-white text-sm mt-1"
            />
          </div>

          <div>
            <Label className="text-gray-300 text-sm">Beschrijving</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={!editing}
              className="bg-zinc-800 border-zinc-700 text-white text-sm mt-1 min-h-[80px]"
              placeholder="Korte beschrijving van dit project..."
            />
          </div>

          <div>
            <Label className="text-gray-300 text-sm">Doelgroep</Label>
            <Input
              value={formData.targetAudience}
              onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
              disabled={!editing}
              placeholder="Bijvoorbeeld: 25-40 jaar, professionals"
              className="bg-zinc-800 border-zinc-700 text-white text-sm mt-1"
            />
          </div>

          <div>
            <Label className="text-gray-300 text-sm">Brand Voice</Label>
            <Input
              value={formData.brandVoice}
              onChange={(e) => setFormData({ ...formData, brandVoice: e.target.value })}
              disabled={!editing}
              placeholder="Bijvoorbeeld: Professioneel en vriendelijk"
              className="bg-zinc-800 border-zinc-700 text-white text-sm mt-1"
            />
          </div>

          <div>
            <Label className="text-gray-300 text-sm">Schrijfstijl</Label>
            <Input
              value={formData.writingStyle}
              onChange={(e) => setFormData({ ...formData, writingStyle: e.target.value })}
              disabled={!editing}
              placeholder="Bijvoorbeeld: Informatief, conversationeel"
              className="bg-zinc-800 border-zinc-700 text-white text-sm mt-1"
            />
          </div>
        </div>

        {editing && (
          <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-zinc-700">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-[#ff6b35] hover:bg-[#ff8c42] text-white text-sm"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Opslaan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Opslaan
                </>
              )}
            </Button>
            <Button
              onClick={() => {
                setEditing(false);
                setFormData({
                  name: project.name || '',
                  websiteUrl: project.websiteUrl || '',
                  description: project.description || '',
                  language: project.language || 'NL',
                  niche: project.niche || '',
                  keywords: project.keywords?.join(', ') || '',
                  targetAudience: project.targetAudience || '',
                  brandVoice: project.brandVoice || '',
                  writingStyle: project.writingStyle || ''
                });
              }}
              variant="outline"
              className="flex-1 border-zinc-700 text-white hover:bg-zinc-800 text-sm"
            >
              Annuleren
            </Button>
          </div>
        )}

        <div className="pt-4 border-t border-zinc-700">
          <Button
            onClick={handleDelete}
            variant="destructive"
            size="sm"
            className="text-xs"
          >
            <Trash2 className="w-3 h-3 mr-2" />
            Project Verwijderen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
