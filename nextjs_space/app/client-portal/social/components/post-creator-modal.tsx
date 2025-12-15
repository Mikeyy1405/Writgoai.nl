'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Sparkles, Loader2, Calendar, Send } from 'lucide-react';

interface PostCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onPostCreated: () => void;
}

const PLATFORMS = [
  { id: 'linkedin', name: 'LinkedIn', icon: '🔵' },
  { id: 'instagram', name: 'Instagram', icon: '🟢' },
  { id: 'twitter', name: 'X', icon: '🟠' },
  { id: 'facebook', name: 'Facebook', icon: '🔴' },
  { id: 'tiktok', name: 'TikTok', icon: '⚫' },
];

export default function PostCreatorModal({
  isOpen,
  onClose,
  projectId,
  onPostCreated,
}: PostCreatorModalProps) {
  const [useAI, setUseAI] = useState(false);
  const [topic, setTopic] = useState('');
  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['linkedin']);
  const [scheduledFor, setScheduledFor] = useState('');
  const [generating, setGenerating] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleGenerateContent = async () => {
    if (!topic.trim()) {
      toast.error('Voer een onderwerp in');
      return;
    }

    try {
      setGenerating(true);
      toast.loading('AI genereert content...', { id: 'generate' });

      const response = await fetch('/api/client/social/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          topic,
          platforms: selectedPlatforms,
          tone: 'professional',
          includeHashtags: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const data = await response.json();
      
      // Use content for first selected platform
      const firstPlatform = selectedPlatforms[0];
      if (data.content[firstPlatform]) {
        setContent(data.content[firstPlatform]);
        toast.success('Content gegenereerd!', { id: 'generate' });
      } else {
        throw new Error('No content generated');
      }
    } catch (error: any) {
      console.error('Error generating content:', error);
      toast.error('Kon content niet genereren', { id: 'generate' });
    } finally {
      setGenerating(false);
    }
  };

  const handleCreatePost = async () => {
    if (!content.trim()) {
      toast.error('Voer content in');
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast.error('Selecteer minimaal één platform');
      return;
    }

    try {
      setCreating(true);
      toast.loading('Post aanmaken...', { id: 'create' });

      // Create a post for each selected platform
      const promises = selectedPlatforms.map((platform) =>
        fetch('/api/client/social', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            content,
            platform,
            scheduledFor: scheduledFor || null,
          }),
        })
      );

      const responses = await Promise.all(promises);
      const successful = responses.filter((r) => r.ok);
      const failed = responses.length - successful.length;

      if (failed > 0) {
        const failedPlatforms = selectedPlatforms.filter((_, i) => !responses[i].ok);
        toast.warning(
          `${successful.length} post(s) aangemaakt, ${failed} mislukt voor: ${failedPlatforms.join(', ')}`,
          { id: 'create' }
        );
      } else {
        toast.success(`${selectedPlatforms.length} post(s) aangemaakt!`, { id: 'create' });
      }

      if (successful.length > 0) {
        onPostCreated();
        handleClose();
      }
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast.error('Kon post(s) niet aanmaken', { id: 'create' });
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setTopic('');
    setContent('');
    setSelectedPlatforms(['linkedin']);
    setScheduledFor('');
    setUseAI(false);
    onClose();
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nieuwe Social Media Post</DialogTitle>
          <DialogDescription>
            Creëer een nieuwe post met of zonder AI
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* AI Toggle */}
          <div className="flex items-center justify-between p-3 border border-gray-700 rounded-md">
            <Label htmlFor="use-ai" className="flex items-center gap-2 cursor-pointer">
              <Sparkles className="h-4 w-4 text-orange-500" />
              Gebruik AI om content te genereren
            </Label>
            <input
              id="use-ai"
              type="checkbox"
              checked={useAI}
              onChange={(e) => setUseAI(e.target.checked)}
              className="w-4 h-4"
            />
          </div>

          {/* Platform Selection */}
          <div className="space-y-2">
            <Label>Platforms</Label>
            <div className="grid grid-cols-2 gap-2">
              {PLATFORMS.map((platform) => {
                const isSelected = selectedPlatforms.includes(platform.id);
                return (
                  <Button
                    key={platform.id}
                    type="button"
                    variant={isSelected ? 'default' : 'outline'}
                    onClick={() => togglePlatform(platform.id)}
                    className="justify-start"
                    size="sm"
                  >
                    <span className="mr-2">{platform.icon}</span>
                    {platform.name}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* AI Topic Input */}
          {useAI && (
            <div className="space-y-2">
              <Label htmlFor="topic">Onderwerp</Label>
              <Textarea
                id="topic"
                placeholder="Bijvoorbeeld: De voordelen van content marketing voor kleine bedrijven..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={3}
              />
              <Button
                onClick={handleGenerateContent}
                disabled={generating || !topic.trim()}
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    AI genereert...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Genereer Content
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Content Input */}
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Schrijf je post content hier..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
            />
            <p className="text-xs text-muted-foreground">
              {content.length} karakters
            </p>
          </div>

          {/* Scheduling */}
          <div className="space-y-2">
            <Label htmlFor="schedule">Inplannen (optioneel)</Label>
            <Input
              id="schedule"
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Annuleren
            </Button>
            <Button
              onClick={handleCreatePost}
              disabled={creating || !content.trim()}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Aanmaken...
                </>
              ) : scheduledFor ? (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Inplannen
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Maak Post
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
