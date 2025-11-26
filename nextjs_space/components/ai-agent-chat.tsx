
'use client';

/**
 * AI Agent Chat Component
 * Interactieve chat met de AI agent
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Bot, User, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
  results?: any;
}

export default function AIAgentChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    try {
      // Build conversation history for the API
      const conversationMessages = [
        ...messages.map(msg => ({
          role: msg.role === 'agent' ? 'assistant' : 'user',
          content: msg.content
        })),
        {
          role: 'user',
          content: currentInput
        }
      ];

      const response = await fetch('/api/client/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: conversationMessages }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API Error:', errorData);
        throw new Error(errorData.message || errorData.error || 'Agent fout');
      }

      const data = await response.json();

      const agentMessage: Message = {
        role: 'agent',
        content: data.message || formatAgentResponse(data),
        timestamp: new Date(),
        results: data,
      };

      setMessages((prev) => [...prev, agentMessage]);
    } catch (error: any) {
      console.error('Chat fout:', error);
      const errorMessage: Message = {
        role: 'agent',
        content: error.message || 'Sorry, er ging iets mis. Probeer het opnieuw.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const formatAgentResponse = (response: any): string => {
    if (!response) return 'Ik heb je verzoek verwerkt.';

    let text = '';

    if (response.plan?.reasoning) {
      text += `🎯 ${response.plan.reasoning}\n\n`;
    }

    if (response.results) {
      const results = response.results;
      
      if (results.research) {
        text += `📚 Research:\n${results.research.substring(0, 200)}...\n\n`;
      }
      
      if (results.blog) {
        text += `✍️ Blog gegenereerd!\n`;
      }
      
      if (results.social) {
        text += `📱 Social media content gegenereerd voor ${Object.keys(results.social).join(', ')}\n`;
      }
      
      if (results.video) {
        text += `🎥 Video script gegenereerd!\n`;
      }
      
      if (results.plan) {
        text += `📋 Content plan gemaakt\n`;
      }
    }

    return text || 'Taak uitgevoerd!';
  };

  const quickActions = [
    'Schrijf een blog over duurzaamheid',
    'Maak social media posts voor Instagram',
    'Genereer een video script over AI',
    'Plan content voor deze week',
  ];

  return (
    <Card className="w-full h-[600px] flex flex-col">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          AI Agent Assistent
          <Badge variant="secondary" className="ml-auto">
            <Sparkles className="h-3 w-3 mr-1" />
            AIML API
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <Bot className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-sm">Stel me een vraag of geef me een taak!</p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {quickActions.map((action, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => setInput(action)}
                  >
                    {action}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'agent' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <p className="text-xs opacity-60 mt-1">
                  {msg.timestamp.toLocaleTimeString('nl-NL', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>

                {msg.results?.results && (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    {msg.results.results.blog && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mr-2 mb-2"
                        onClick={() => {
                          // Open blog in nieuw venster
                          const win = window.open('', '_blank');
                          if (win) {
                            win.document.write(msg.results.results.blog);
                          }
                        }}
                      >
                        📝 Bekijk Blog
                      </Button>
                    )}
                    {msg.results.results.social && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mr-2 mb-2"
                        onClick={() => {
                          alert(JSON.stringify(msg.results.results.social, null, 2));
                        }}
                      >
                        📱 Bekijk Social Media
                      </Button>
                    )}
                    {msg.results.results.video && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mr-2 mb-2"
                        onClick={() => {
                          alert(JSON.stringify(msg.results.results.video, null, 2));
                        }}
                      >
                        🎥 Bekijk Video Script
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-muted rounded-lg p-3">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Typ je vraag of taak... (Enter om te verzenden)"
              className="min-h-[60px] resize-none"
              disabled={loading}
            />
            <Button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              size="icon"
              className="h-[60px] w-[60px]"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
