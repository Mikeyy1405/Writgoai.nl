'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface AIBlogGeneratorProps {
  onGenerate: (data: {
    title: string;
    excerpt: string;
    content: string;
    metaTitle: string;
    metaDescription: string;
    focusKeyword: string;
  }) => void;
}

export function AIBlogGenerator({ onGenerate }: AIBlogGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [tone, setTone] = useState('professioneel');

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error('Vul een onderwerp in');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/admin/blog/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          keywords: keywords.trim(),
          tone,
        }),
      });

      if (!response.ok) {
        throw new Error('Genereren mislukt');
      }

      const data = await response.json();
      onGenerate(data);
      toast.success('Blog succesvol gegenereerd!');
      
      // Reset form
      setTopic('');
      setKeywords('');
      setTone('professioneel');
    } catch (error) {
      console.error('Error generating blog:', error);
      toast.error('Er ging iets mis bij het genereren');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/30">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-6 h-6 text-orange-500" />
        <h2 className="text-xl font-bold text-white">AI Blog Generator</h2>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="topic" className="text-gray-300">
            Onderwerp *
          </Label>
          <Input
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Bijv: Voordelen van AI in content marketing"
            className="mt-2 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
            disabled={generating}
          />
        </div>

        <div>
          <Label htmlFor="keywords" className="text-gray-300">
            Keywords (optioneel)
          </Label>
          <Input
            id="keywords"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="Bijv: AI, content marketing, SEO"
            className="mt-2 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
            disabled={generating}
          />
        </div>

        <div>
          <Label htmlFor="tone" className="text-gray-300">
            Toon
          </Label>
          <Select value={tone} onValueChange={setTone} disabled={generating}>
            <SelectTrigger className="mt-2 bg-gray-800 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="professioneel" className="text-white hover:bg-gray-700">
                Professioneel
              </SelectItem>
              <SelectItem value="informeel" className="text-white hover:bg-gray-700">
                Informeel
              </SelectItem>
              <SelectItem value="technisch" className="text-white hover:bg-gray-700">
                Technisch
              </SelectItem>
              <SelectItem value="vriendelijk" className="text-white hover:bg-gray-700">
                Vriendelijk
              </SelectItem>
              <SelectItem value="overtuigend" className="text-white hover:bg-gray-700">
                Overtuigend
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={generating || !topic.trim()}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg shadow-orange-500/20"
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Genereren...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Genereer met AI
            </>
          )}
        </Button>
      </div>

      <p className="mt-4 text-xs text-gray-400 text-center">
        De AI genereert een complete blog post met SEO-optimalisatie
      </p>
    </Card>
  );
}
