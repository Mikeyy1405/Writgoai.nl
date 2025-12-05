'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface WordPressPost {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  metaDescription?: string;
}

interface WordPressPostEditorProps {
  post: WordPressPost;
  siteId: string;
  onClose: () => void;
  onSave: () => void;
}

export default function WordPressPostEditor({ post, siteId, onClose, onSave }: WordPressPostEditorProps) {
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [excerpt, setExcerpt] = useState(post.excerpt);
  const [metaDescription, setMetaDescription] = useState(post.metaDescription || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Validate
      if (!title.trim()) {
        toast.error('Titel is verplicht');
        return;
      }
      
      if (!content.trim()) {
        toast.error('Content is verplicht');
        return;
      }

      toast.loading('Post bijwerken...', { id: 'save-post' });

      const response = await fetch(`/api/content-hub/wordpress-posts/${post.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId,
          title,
          content,
          excerpt,
          metaDescription,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Kon post niet bijwerken');
      }

      toast.success('Post succesvol bijgewerkt!', { id: 'save-post' });
      onSave();
    } catch (error: any) {
      console.error('Failed to save post:', error);
      toast.error(error.message || 'Kon post niet opslaan', { id: 'save-post' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>WordPress Post Bewerken</DialogTitle>
          <DialogDescription>
            Bewerk de post en sla de wijzigingen op naar WordPress
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Voer de post titel in..."
              disabled={saving}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Content * (HTML)</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Voer de post content in (HTML formaat)..."
              rows={15}
              disabled={saving}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Gebruik HTML tags zoals h2, p, ul, li, strong voor opmaak
            </p>
          </div>

          {/* Excerpt */}
          <div className="space-y-2">
            <Label htmlFor="excerpt">Samenvatting (Excerpt)</Label>
            <Textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Korte samenvatting van de post..."
              rows={3}
              disabled={saving}
            />
          </div>

          {/* Meta Description */}
          <div className="space-y-2">
            <Label htmlFor="metaDescription">
              Meta Description (SEO)
              <span className="text-xs text-muted-foreground ml-2">
                {metaDescription.length}/160
              </span>
            </Label>
            <Textarea
              id="metaDescription"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value.substring(0, 160))}
              placeholder="SEO meta description (max 160 karakters)..."
              rows={2}
              disabled={saving}
              maxLength={160}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            <X className="h-4 w-4 mr-2" />
            Annuleren
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Opslaan...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Opslaan
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
