
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Send, Sparkles, X, Minimize2, Maximize2 } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface AIFloatingAssistantProps {
  onTaskCreated?: () => void;
}

export function AIFloatingAssistant({ onTaskCreated }: AIFloatingAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [context, setContext] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;

    setIsLoading(true);
    setResponse(null);

    try {
      const res = await fetch('/api/ai-planner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          message,
          context: context || undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        setResponse(data);
        setMessage('');
        setContext('');
        
        // Call callback to refresh tasks
        if (onTaskCreated) {
          setTimeout(() => {
            onTaskCreated();
          }, 1000);
        }
      } else {
        alert('Er ging iets mis. Probeer het opnieuw.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Er ging iets mis. Probeer het opnieuw.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setResponse(null);
    setMessage('');
    setContext('');
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl bg-gradient-to-r from-writgo-navy to-writgo-orange hover:from-writgo-navy hover:to-writgo-orange-light z-50 transition-all hover:scale-110"
          size="icon"
        >
          <Sparkles className="w-6 h-6" />
        </Button>
      )}

      {/* Floating Assistant Window */}
      {isOpen && (
        <div className={`fixed ${isMinimized ? 'bottom-6 right-6' : 'bottom-6 right-6'} z-50 transition-all duration-300`}>
          <Card className={`shadow-2xl border-2 border-writgo-orange ${isMinimized ? 'w-80' : 'w-96'}`}>
            <CardHeader className="bg-gradient-to-r from-writgo-navy to-writgo-orange text-white p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="w-5 h-5" />
                    AI Assistent
                  </CardTitle>
                  {!isMinimized && (
                    <CardDescription className="text-indigo-100 text-sm mt-1">
                      Vraag me om taken te plannen of formulieren in te vullen
                    </CardDescription>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="h-8 w-8 text-white hover:bg-white/20"
                  >
                    {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClose}
                    className="h-8 w-8 text-white hover:bg-white/20"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {!isMinimized && (
              <CardContent className="p-4 max-h-[600px] overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="ai-message" className="text-sm font-medium">
                      Wat kan ik voor je doen?
                    </Label>
                    <Textarea
                      id="ai-message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Bijvoorbeeld: 'Plan 10 teksten voor bedrijf X morgen' of 'Vul een nieuwe taak in voor klant Y'"
                      className="min-h-[100px] mt-2 text-sm"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="ai-context" className="text-sm font-medium">
                      Extra context (optioneel)
                    </Label>
                    <Input
                      id="ai-context"
                      value={context}
                      onChange={(e) => setContext(e.target.value)}
                      placeholder="Bijvoorbeeld: klant naam, deadline, etc."
                      className="mt-2 text-sm"
                      disabled={isLoading}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isLoading || !message.trim()}
                    className="w-full bg-gradient-to-r from-writgo-navy to-writgo-orange hover:from-writgo-navy hover:to-writgo-orange-light text-white"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Bezig...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Verstuur
                      </>
                    )}
                  </Button>
                </form>

                {/* Response */}
                {response && (
                  <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="font-semibold text-green-900 text-sm">
                        {response.message}
                      </p>
                      <p className="text-green-700 text-xs mt-1">{response.summary}</p>
                    </div>

                    {response.tasks && response.tasks.length > 0 && (
                      <div className="bg-white border border-orange-100 rounded-lg p-3">
                        <h4 className="font-semibold text-gray-700 text-sm mb-2">
                          Aangemaakte taken ({response.tasks.length}):
                        </h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {response.tasks.map((task: any) => (
                            <div
                              key={task.id}
                              className="border rounded p-2 bg-orange-50 text-xs"
                            >
                              <div className="font-semibold text-gray-700">{task.title}</div>
                              <div className="text-gray-600 mt-0.5">
                                📅 {format(new Date(task.deadline), 'dd MMM yyyy', { locale: nl })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Quick Examples */}
                {!response && (
                  <div className="mt-4 bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <h4 className="font-semibold text-gray-700 text-xs mb-2">Voorbeelden:</h4>
                    <ul className="space-y-1 text-xs text-gray-700">
                      <li className="flex items-start gap-1">
                        <span className="text-writgo-orange">•</span>
                        <span>"Plan 10 teksten voor bedrijf X morgen"</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <span className="text-writgo-orange">•</span>
                        <span>"Vul een nieuwe klant in: Bedrijf Y"</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <span className="text-writgo-orange">•</span>
                        <span>"Maak 5 blogposts aan voor volgende week"</span>
                      </li>
                    </ul>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
