'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { getValidKeywords } from '@/lib/content-hub/article-utils';

interface EditArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  article: {
    id: string;
    title: string;
    keywords: string[];
    status: string;
  };
}

export default function EditArticleModal({
  isOpen,
  onClose,
  onSuccess,
  article,
}: EditArticleModalProps) {
  const [title, setTitle] = useState(article.title);
  const [keywords, setKeywords] = useState<string[]>(article.keywords);
  const [newKeyword, setNewKeyword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when article changes
  useEffect(() => {
    setTitle(article.title);
    setKeywords(article.keywords);
    setNewKeyword('');
  }, [article]);

  const handleAddKeyword = () => {
    const trimmedKeyword = newKeyword.trim();
    if (trimmedKeyword && !keywords.includes(trimmedKeyword)) {
      setKeywords([...keywords, trimmedKeyword]);
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  const handleKeywordKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  const handleSave = async () => {
    // Validation
    if (!title.trim()) {
      toast.error('Titel is verplicht');
      return;
    }

    if (keywords.length === 0) {
      toast.error('Minimaal één keyword is verplicht');
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/content-hub/articles/${article.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          keywords: getValidKeywords(keywords),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update article');
      }

      toast.success('Artikel succesvol bijgewerkt');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to update article:', error);
      toast.error(error.message || 'Kon artikel niet bijwerken');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Artikel Bewerken</DialogTitle>
          <DialogDescription>
            Pas de titel en keywords aan voor dit artikel. Let op: alleen pending artikelen kunnen worden bewerkt.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title Input */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Titel <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Voer artikel titel in..."
              disabled={isSaving}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              {title.length}/200 tekens
            </p>
          </div>

          {/* Keywords */}
          <div className="space-y-2">
            <Label htmlFor="keywords">
              Keywords <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="keywords"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyPress={handleKeywordKeyPress}
                placeholder="Voeg keyword toe..."
                disabled={isSaving}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddKeyword}
                disabled={!newKeyword.trim() || isSaving}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Keywords List */}
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 p-3 border rounded-lg bg-muted/30">
                {keywords.map((keyword, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="gap-1 pr-1 text-sm"
                  >
                    {keyword}
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(index)}
                      disabled={isSaving}
                      className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {keywords.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Voeg minimaal één keyword toe
              </p>
            )}
          </div>

          {/* Status Warning */}
          {article.status !== 'pending' && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Dit artikel heeft de status "{article.status}". Alleen pending artikelen kunnen worden bewerkt.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Annuleren
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !title.trim() || keywords.length === 0}
            className="gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Opslaan...
              </>
            ) : (
              'Opslaan'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
