'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Lightbulb, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

interface TopicSuggestionsProps {
  onSelect: (topic: string) => void;
  language: 'nl' | 'en';
}

export default function TopicSuggestions({ onSelect, language }: TopicSuggestionsProps) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleGenerateSuggestions = async () => {
    if (!input.trim()) {
      toast.error('Vul een keyword of niche in');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/client/ultimate-writer/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'topics',
          input: input.trim(),
          language,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate suggestions');
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);
      toast.success('Suggesties gegenereerd!');
    } catch (error) {
      console.error('Suggestions error:', error);
      toast.error('Fout bij genereren van suggesties');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    onSelect(suggestion);
    setIsOpen(false);
    setSuggestions([]);
    toast.success('Onderwerp geselecteerd!');
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="w-full bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white"
      >
        <Lightbulb className="w-4 h-4 mr-2" />
        AI Onderwerp Suggesties
      </Button>
    );
  }

  return (
    <Card className="bg-zinc-800 border-zinc-700 p-4 space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-white font-medium flex items-center gap-2">
          <Lightbulb className="w-4 h-4" />
          Onderwerp Suggesties
        </h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setIsOpen(false);
            setSuggestions([]);
          }}
          className="h-6 w-6 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Bijvoorbeeld: elektrische auto's"
          className="bg-zinc-900 border-zinc-700 text-white"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleGenerateSuggestions();
            }
          }}
        />
        <Button
          onClick={handleGenerateSuggestions}
          disabled={isLoading}
          className="bg-gradient-to-r from-[#ff6b35] to-[#ff8c5a] hover:from-[#ff5520] hover:to-[#ff7740] text-white"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Lightbulb className="w-4 h-4" />
          )}
        </Button>
      </div>

      {suggestions.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          <p className="text-xs text-zinc-400">Klik op een suggestie om te gebruiken:</p>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSelectSuggestion(suggestion)}
              className="w-full text-left p-3 bg-zinc-900 hover:bg-zinc-950 border border-zinc-700 hover:border-[#ff6b35] rounded-lg text-sm text-zinc-300 hover:text-white transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}
