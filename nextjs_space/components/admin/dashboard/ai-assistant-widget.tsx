'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Send } from 'lucide-react';
import { useState } from 'react';

export function AIAssistantWidget() {
  const [message, setMessage] = useState('');

  const suggestions = [
    'Genereer een nieuwe blog',
    'Stuur factuur naar klant X',
    'Plan social media post',
    'Bekijk openstaande facturen',
  ];

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#FF6B35]" />
          AI Assistent
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chat input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Vraag je AI assistent..."
              className="flex-1 px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#FF6B35]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  // TODO: Implement AI chat
                  console.log('Send message:', message);
                  setMessage('');
                }
              }}
            />
            <Button 
              className="bg-[#FF6B35] hover:bg-[#FF8555]"
              onClick={() => {
                // TODO: Implement AI chat
                console.log('Send message:', message);
                setMessage('');
              }}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {/* Suggestions */}
          <div className="space-y-2">
            <p className="text-xs text-zinc-500">Snelle suggesties:</p>
            <div className="grid grid-cols-2 gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setMessage(suggestion)}
                  className="text-left px-3 py-2 text-xs bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-zinc-300 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Coming soon message */}
          <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
            <p className="text-xs text-zinc-400">
              🚀 AI Assistent met AIML API komt binnenkort beschikbaar
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
