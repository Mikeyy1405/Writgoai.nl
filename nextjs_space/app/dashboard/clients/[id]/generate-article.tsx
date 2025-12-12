
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FileText, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface GenerateArticleDialogProps {
  clientId: string;
  clientName: string;
  onSuccess?: () => void;
}

export function GenerateArticleDialog({
  clientId,
  clientName,
  onSuccess,
}: GenerateArticleDialogProps) {
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error('Vul een onderwerp in');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/admin/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          topic: topic.trim(),
          keywords: keywords
            .split(',')
            .map((k) => k.trim())
            .filter(Boolean),
          useCredits: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate article');
      }

      toast.success('Artikel succesvol gegenereerd!', {
        description: `"${data.article.title}" is aangemaakt en geleverd aan ${clientName}`,
      });

      setOpen(false);
      setTopic('');
      setKeywords('');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error generating article:', error);
      toast.error('Fout bij genereren artikel', {
        description:
          error instanceof Error ? error.message : 'Probeer het opnieuw',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Sparkles className="h-4 w-4" />
          Genereer Artikel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-orange-600" />
            Artikel Genereren voor {clientName}
          </DialogTitle>
          <DialogDescription>
            Genereer een SEO-geoptimaliseerd artikel met AI op basis van het
            klantprofiel. Er wordt 1 artikel credit afgetrokken.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="topic">Onderwerp *</Label>
            <Input
              id="topic"
              placeholder="Bijv: De voordelen van marketing automation"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isGenerating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="keywords">
              Zoekwoorden (optioneel, komma gescheiden)
            </Label>
            <Textarea
              id="keywords"
              placeholder="Bijv: marketing automation, lead generatie, email marketing"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              disabled={isGenerating}
              rows={3}
            />
          </div>

          <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
            <p className="font-medium mb-1">✨ AI gebruikt automatisch:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-600">
              <li>Bedrijfsinformatie uit het AI-profiel</li>
              <li>Content voorkeuren en tone of voice</li>
              <li>SEO optimalisatie en structuur</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isGenerating}
          >
            Annuleren
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Genereren...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Genereer Artikel
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
