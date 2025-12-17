
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sparkles, 
  Send, 
  Loader2, 
  Bot, 
  User,
  Lightbulb,
  TrendingUp,
  FileText,
  Video,
  Share2,
  Globe,
  Target,
  Zap,
  CheckCircle2,
  Plus,
  MessageSquare,
  Trash2,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  suggestions?: string[];
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  lastMessageAt: Date;
  createdAt: Date;
}

interface WritgoAIAgentProps {
  clientData?: any;
  onSuggestion?: (suggestion: string) => void;
  onActionComplete?: () => void;
}

export default function WritgoAIAgent({ clientData, onSuggestion, onActionComplete }: WritgoAIAgentProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Laad conversations bij het starten
  useEffect(() => {
    if (clientData?.id) {
      loadConversations();
    }
  }, [clientData?.id]);

  // Initialiseer met welkomstbericht als er geen actieve conversation is
  useEffect(() => {
    if (!activeConversationId && messages.length === 0 && !isLoadingConversations) {
      const welcomeMessage = getWelcomeMessage();
      setMessages([{
        role: 'assistant',
        content: welcomeMessage.content,
        suggestions: welcomeMessage.suggestions,
        timestamp: new Date(),
      }]);
    }
  }, [activeConversationId, clientData, isLoadingConversations]);

  // Laad conversations van de client
  async function loadConversations() {
    if (!clientData?.id) return;
    
    setIsLoadingConversations(true);
    try {
      const response = await fetch(`/api/client/conversations?clientId=${clientData.id}`);
      if (!response.ok) throw new Error('Failed to load conversations');
      
      const data = await response.json();
      if (data.success && data.conversations) {
        const formattedConversations = data.conversations.map((conv: any) => ({
          id: conv.id,
          title: conv.title,
          messages: conv.messages.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.createdAt),
          })),
          lastMessageAt: new Date(conv.lastMessageAt),
          createdAt: new Date(conv.createdAt),
        }));
        
        setConversations(formattedConversations);
        
        // Laad de meest recente conversation als er geen actieve is
        if (formattedConversations.length > 0 && !activeConversationId) {
          const mostRecent = formattedConversations[0];
          setActiveConversationId(mostRecent.id);
          setMessages(mostRecent.messages);
        }
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('Kon gesprekken niet laden');
    } finally {
      setIsLoadingConversations(false);
    }
  }

  // Maak een nieuwe conversation
  async function createNewConversation(initialMessage?: string) {
    if (!clientData?.id) return null;
    
    try {
      const response = await fetch('/api/client/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: clientData.id,
          title: initialMessage ? initialMessage.substring(0, 50) : 'Nieuw gesprek',
          initialMessage,
        }),
      });

      if (!response.ok) throw new Error('Failed to create conversation');
      
      const data = await response.json();
      if (data.success && data.conversation) {
        const newConversation: Conversation = {
          id: data.conversation.id,
          title: data.conversation.title,
          messages: data.conversation.messages.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.createdAt),
          })),
          lastMessageAt: new Date(data.conversation.lastMessageAt),
          createdAt: new Date(data.conversation.createdAt),
        };
        
        setConversations(prev => [newConversation, ...prev]);
        setActiveConversationId(newConversation.id);
        setMessages(newConversation.messages);
        
        return newConversation.id;
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Kon nieuw gesprek niet aanmaken');
      return null;
    }
  }

  // Sla een message op in de database
  async function saveMessage(conversationId: string, role: 'user' | 'assistant', content: string) {
    try {
      const response = await fetch('/api/client/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          role,
          content,
        }),
      });

      if (!response.ok) throw new Error('Failed to save message');
      
      const data = await response.json();
      return data.message;
    } catch (error) {
      console.error('Error saving message:', error);
      // Niet fataal - bericht is al in UI
    }
  }

  // Verwijder een conversation
  async function deleteConversation(conversationId: string) {
    try {
      const response = await fetch(`/api/client/conversations?conversationId=${conversationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete conversation');
      
      // Verwijder uit lokale state
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      
      // Als dit de actieve conversation was, reset de UI
      if (activeConversationId === conversationId) {
        setActiveConversationId(null);
        setMessages([]);
        // Laad de volgende conversation als die er is
        const remaining = conversations.filter(c => c.id !== conversationId);
        if (remaining.length > 0) {
          setActiveConversationId(remaining[0].id);
          setMessages(remaining[0].messages);
        }
      }
      
      toast.success('Gesprek verwijderd');
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Kon gesprek niet verwijderen');
    }
  }

  // Start een nieuwe chat
  function startNewChat() {
    setActiveConversationId(null);
    setMessages([]);
    const welcomeMessage = getWelcomeMessage();
    setMessages([{
      role: 'assistant',
      content: welcomeMessage.content,
      suggestions: welcomeMessage.suggestions,
      timestamp: new Date(),
    }]);
  }

  // Scroll naar beneden bij nieuwe berichten
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  function getWelcomeMessage(): { content: string; suggestions: string[] } {
    const hasWordPress = !!(clientData?.wordpressUrl);
    const hasContentPlan = !!(clientData?.contentPlan && clientData.contentPlan.length > 0);
    const hasSocials = !!(clientData?.lateDevAccounts && clientData.lateDevAccounts.length > 0);

    if (!hasWordPress) {
      return {
        content: `👋 Hoi! Ik ben je **WritgoAI Agent**. Ik zie dat je WordPress nog niet hebt verbonden.\n\nIk help je graag met:\n• 🌐 Je website analyseren en content strategie maken\n• 📝 Blogs schrijven (1500+ woorden, SEO-geoptimaliseerd)\n• 📱 Social media content genereren\n• 🎬 Video scripts maken\n\nLaten we beginnen! Wat wil je als eerste doen?`,
        suggestions: [
          'Leg uit hoe WordPress verbinden werkt',
          'Wat voor content kun je maken?',
          'Hoe werkt de AI content strategie?'
        ]
      };
    }

    if (!hasContentPlan) {
      return {
        content: `👋 Super! Je WordPress is verbonden aan **${clientData.wordpressUrl}**\n\nNu kan ik je website scannen om een **slimme 7-daags content strategie** te maken.\n\nIk analyseer:\n✅ Je website content & diensten\n✅ Doelgroep & tone of voice\n✅ Relevante keywords & trends\n✅ Optimale content mix (blog + social + video)\n\nZal ik je website nu scannen?`,
        suggestions: [
          'Ja, scan mijn website!',
          'Wat gebeurt er tijdens het scannen?',
          'Hoe bepaal je de content strategie?'
        ]
      };
    }

    return {
      content: `🎉 Perfect! Je content plan staat klaar met **${clientData.contentPlan.length} dagen** aan thema's!\n\nIk kan nu voor je:\n• 📝 Professionele blogs schrijven\n• 📱 Social media posts maken\n• 🎬 Video scripts genereren\n• 🚀 Complete content sets maken\n\nWat wil je dat ik doe?`,
      suggestions: [
        'Schrijf een blog over [onderwerp]',
        'Maak social media content',
        'Genereer een complete content set',
        'Geef me content strategisch advies'
      ]
    };
  }

  async function handleSend() {
    if (!input.trim() || isProcessing) return;

    const userMessageContent = input.trim();
    setInput('');
    setIsProcessing(true);

    try {
      // Maak een nieuwe conversation als dit de eerste message is
      let conversationId: string | null = activeConversationId;
      if (!conversationId) {
        const newId = await createNewConversation(userMessageContent);
        if (!newId) {
          throw new Error('Failed to create conversation');
        }
        conversationId = newId;
      }

      // Voeg user message toe aan UI
      const userMessage: Message = {
        role: 'user',
        content: userMessageContent,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);

      // Sla user message op in database
      await saveMessage(conversationId, 'user', userMessageContent);

      // Stuur naar AI agent API
      const response = await fetch('/api/client/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessageContent,
          context: {
            hasWordPress: !!(clientData?.wordpressUrl),
            hasContentPlan: !!(clientData?.contentPlan && clientData.contentPlan.length > 0),
            hasSocials: !!(clientData?.lateDevAccounts && clientData.lateDevAccounts.length > 0),
          }
        }),
      });

      if (!response.ok) {
        throw new Error('AI agent response failed');
      }

      const data = await response.json();
      
      // Verwerk de response
      const assistantResponse = processAgentResponse(data.response);
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: assistantResponse.content,
        suggestions: assistantResponse.suggestions,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Sla assistant message op in database
      await saveMessage(conversationId, 'assistant', assistantResponse.content);

      // Update de conversation in de lijst
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, messages: [...conv.messages, userMessage, assistantMessage], lastMessageAt: new Date() }
          : conv
      ));

      // Check of er acties uitgevoerd moeten worden
      if (data.response.results) {
        onActionComplete?.();
      }

    } catch (error) {
      console.error('Agent error:', error);
      toast.error('Er ging iets mis met de AI agent');
      const errorMessage: Message = {
        role: 'assistant',
        content: '😕 Sorry, er ging iets mis. Probeer het opnieuw of herformuleer je vraag.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  }

  function processAgentResponse(response: any): { content: string; suggestions?: string[] } {
    if (response.results) {
      let content = '✅ Ik heb je taak uitgevoerd!\n\n';
      
      if (response.results.research) {
        content += `📚 **Research:**\n${response.results.research.substring(0, 500)}...\n\n`;
      }
      
      if (response.results.plan) {
        content += `📋 **Content Plan:**\n`;
        content += `Hoofdthema: ${response.results.plan.hoofdthema || 'Zie details'}\n\n`;
      }
      
      if (response.results.blog) {
        content += `📝 **Blog gegenereerd!** (${response.results.blog.length} karakters)\n\n`;
      }
      
      if (response.results.social) {
        content += `📱 **Social media post gemaakt!**\n`;
        content += `Caption: ${response.results.social.caption?.substring(0, 100)}...\n\n`;
      }
      
      if (response.results.video) {
        content += `🎬 **Video script klaar!**\n`;
        content += `Titel: ${response.results.video.title}\n\n`;
      }

      return {
        content,
        suggestions: [
          'Genereer nog een blog',
          'Maak social media content',
          'Wat zijn trending topics?'
        ]
      };
    }

    // Default response
    return {
      content: typeof response === 'string' ? response : response.response || 'Ik heb je vraag verwerkt!',
    };
  }

  function handleSuggestionClick(suggestion: string) {
    setInput(suggestion);
    
    // Bij specifieke suggesties direct actie uitvoeren
    if (suggestion.includes('scan mijn website') || suggestion.includes('Ja, scan')) {
      onSuggestion?.('scan-website');
    } else {
      // Anders stuur het als bericht
      setTimeout(() => handleSend(), 100);
    }
  }

  return (
    <div className="flex gap-4 h-full">
      {/* Sidebar met conversations */}
      {showSidebar && (
        <Card className="glass-card shadow-xl border-2 border-blue-200 w-80 flex-shrink-0 flex flex-col">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white pb-4">
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-lg font-bold">Gesprekken</CardTitle>
              <Button
                size="sm"
                onClick={() => setShowSidebar(false)}
                className="bg-slate-900/20 hover:bg-slate-900/30 border-none"
              >
                <PanelLeftClose className="w-4 h-4" />
              </Button>
            </div>
            <Button
              onClick={startNewChat}
              className="w-full bg-slate-900 text-blue-400 hover:bg-zinc-900 font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nieuw gesprek
            </Button>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-auto p-2">
            {isLoadingConversations ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Geen gesprekken</p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all group ${
                      activeConversationId === conv.id
                        ? 'bg-zinc-900 border-blue-300'
                        : 'bg-slate-900 border-slate-700 hover:border-blue-200'
                    }`}
                    onClick={() => {
                      setActiveConversationId(conv.id);
                      setMessages(conv.messages);
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-slate-300 truncate">
                          {conv.title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {conv.messages.length} bericht(en)
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(conv.lastMessageAt).toLocaleDateString('nl-NL', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conv.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main chat area */}
      <Card className="glass-card shadow-xl border-2 border-blue-200 flex-1 flex flex-col">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!showSidebar && (
                <Button
                  size="sm"
                  onClick={() => setShowSidebar(true)}
                  className="bg-slate-900/20 hover:bg-slate-900/30 border-none mr-2"
                >
                  <PanelLeft className="w-4 h-4" />
                </Button>
              )}
              <div className="w-12 h-12 bg-slate-900/20 backdrop-blur rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white animate-pulse" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">WritgoAI Agent</CardTitle>
                <p className="text-sm text-blue-100">Je slimme content assistent</p>
              </div>
            </div>
            {isProcessing && (
              <div className="flex items-center gap-2 bg-slate-900/20 backdrop-blur px-3 py-1 rounded-full">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">Bezig...</span>
              </div>
            )}
          </div>
        </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages */}
        <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className="space-y-2">
                <div className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  )}
                  
                  <div className={`max-w-[80%] ${
                    message.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-900 border-2 border-slate-700'
                  } rounded-2xl px-4 py-3 shadow-sm`}>
                    <div className={`text-sm whitespace-pre-wrap ${message.role === 'user' ? 'text-white' : 'text-slate-300'}`}>
                      {message.content.split('\n').map((line, i) => {
                        // Parse markdown-style bold
                        if (line.includes('**')) {
                          const parts = line.split('**');
                          return (
                            <p key={i} className="mb-1">
                              {parts.map((part, j) => 
                                j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                              )}
                            </p>
                          );
                        }
                        return <p key={i} className="mb-1">{line}</p>;
                      })}
                    </div>
                    <span className={`text-xs mt-2 block ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                      {message.timestamp.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {message.role === 'user' && (
                    <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>

                {/* Suggestions */}
                {message.role === 'assistant' && message.suggestions && (
                  <div className="flex flex-wrap gap-2 ml-11">
                    {message.suggestions.map((suggestion, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="text-xs bg-zinc-900 border-blue-200 text-blue-700 hover:bg-blue-100"
                      >
                        <Lightbulb className="w-3 h-3 mr-1" />
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t bg-slate-800">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Vraag me iets of geef een opdracht..."
              className="flex-1 bg-slate-900 border-2"
              disabled={isProcessing}
            />
            <Button
              onClick={handleSend}
              disabled={isProcessing || !input.trim()}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6"
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
      </Card>
    </div>
  );
}
