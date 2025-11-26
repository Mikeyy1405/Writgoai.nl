
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileText, 
  Video, 
  Globe, 
  Search,
  Smartphone,
  Zap,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  User,
  Bot,
  DollarSign,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface OrderDetails {
  type?: string;
  title?: string;
  description?: string;
  specifications?: any;
  estimatedCost?: number;
  creditCost?: number;
}

const ORDER_TYPES = [
  {
    id: 'article',
    title: 'SEO Artikel',
    icon: FileText,
    description: 'Professioneel geschreven artikel',
    basePrice: '€0.04 per woord',
    gradient: 'bg-[#ff6b35]',
  },
  {
    id: 'video',
    title: 'Video',
    icon: Video,
    description: 'Custom video productie',
    basePrice: 'Op aanvraag',
    gradient: 'from-red-500 to-orange-600',
  },
  {
    id: 'website',
    title: 'Website',
    icon: Globe,
    description: 'Volledige website',
    basePrice: '€600',
    gradient: 'bg-[#ff6b35]',
  },
  {
    id: 'keyword_research',
    title: 'Zoekwoordonderzoek',
    icon: Search,
    description: 'Uitgebreid keyword onderzoek',
    basePrice: '€60/uur',
    gradient: 'from-green-500 to-emerald-600',
  },
  {
    id: 'social_media',
    title: 'Social Media',
    icon: Smartphone,
    description: 'Social media content pakket',
    basePrice: 'Op aanvraag',
    gradient: 'bg-[#ff6b35]',
  },
  {
    id: 'ai_app',
    title: 'AI Applicatie',
    icon: Zap,
    description: 'Custom AI app development',
    basePrice: 'Op aanvraag',
    gradient: 'from-yellow-500 to-orange-500',
  },
];

// Price calculation helper
const calculatePrice = (type: string, specs: any) => {
  switch (type) {
    case 'article':
      const wordCount = specs?.wordCount || 1000;
      return { euros: wordCount * 0.04, credits: wordCount * 0.04 * 10 }; // 1 euro = 10 credits
    case 'website':
      return { euros: 600, credits: 6000 };
    case 'keyword_research':
      const hours = specs?.estimatedHours || 1;
      return { euros: hours * 60, credits: hours * 600 };
    default:
      return { euros: 0, credits: 0 };
  }
};

export default function RequestTaskPage() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const [step, setStep] = useState<'select' | 'chat' | 'confirm' | 'success'>('select');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderDetails>({});
  const [submitting, setSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startChat = (type: string) => {
    setSelectedType(type);
    setStep('chat');
    
    // Initial AI message
    const initialMessage: Message = {
      role: 'assistant',
      content: getInitialMessage(type),
      timestamp: new Date(),
    };
    setMessages([initialMessage]);
    setOrderDetails({ type });
  };

  const getInitialMessage = (type: string): string => {
    switch (type) {
      case 'article':
        return 'Hoi! Ik help je graag met het bestellen van een SEO artikel. Laten we beginnen! Wat is het onderwerp van je artikel?';
      case 'video':
        return 'Perfect! Vertel me meer over de video die je wilt laten maken. Wat is het onderwerp en doel van de video?';
      case 'website':
        return 'Super! Een nieuwe website. Vertel me: wat is het doel van de website en welke functionaliteit heeft u nodig?';
      case 'keyword_research':
        return 'Goed! Voor welke website/niche wil je zoekwoordonderzoek? Wat is je huidige focus?';
      case 'social_media':
        return 'Leuk! Voor welk platform wil je content (Instagram, Facebook, TikTok, etc.) en hoeveel posts?';
      case 'ai_app':
        return 'Interessant! Beschrijf de AI applicatie die je voor ogen hebt. Welk probleem moet het oplossen?';
      default:
        return 'Hoe kan ik je helpen met deze opdracht?';
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      // Simulate AI response (in real app, call AI API here)
      const aiResponse = await generateAIResponse(selectedType!, messages.concat(userMessage), orderDetails);
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: aiResponse.message,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setOrderDetails(prev => ({ ...prev, ...aiResponse.updates }));

      // Check if we have enough info
      if (aiResponse.readyToSubmit) {
        setTimeout(() => setStep('confirm'), 1000);
      }
    } catch (error: any) {
      toast.error('Er ging iets mis bij het verwerken van je bericht');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const generateAIResponse = async (type: string, msgs: Message[], currentDetails: OrderDetails) => {
    // Simple logic - in production, use real AI API
    const lastUserMsg = msgs[msgs.length - 1].content.toLowerCase();
    const updates: any = {};
    let message = '';
    let readyToSubmit = false;

    if (type === 'article') {
      if (!currentDetails.title) {
        updates.title = msgs[msgs.length - 1].content;
        message = 'Mooi onderwerp! Hoeveel woorden moet het artikel ongeveer zijn? (bijv. 1000, 1500, 2000 woorden)';
      } else if (!currentDetails.specifications?.wordCount) {
        const wordCount = parseInt(lastUserMsg.replace(/\D/g, '')) || 1000;
        updates.specifications = { wordCount };
        const price = calculatePrice(type, { wordCount });
        updates.estimatedCost = price.euros;
        updates.creditCost = price.credits;
        message = `Perfect! Een artikel van ${wordCount} woorden over "${currentDetails.title}". Heb je specifieke keywords of SEO-eisen?`;
      } else if (!currentDetails.specifications?.keywords) {
        updates.specifications = { ...currentDetails.specifications, keywords: lastUserMsg };
        message = 'Top! Wanneer heb je het artikel nodig? (bijv. binnen 3 dagen, volgende week)';
      } else if (!currentDetails.specifications?.deadline) {
        updates.specifications = { ...currentDetails.specifications, deadline: lastUserMsg };
        updates.description = `${currentDetails.specifications.wordCount} woorden artikel over "${currentDetails.title}". Keywords: ${currentDetails.specifications.keywords}. Deadline: ${lastUserMsg}`;
        readyToSubmit = true;
        message = 'Geweldig! Ik heb alle informatie. Laten we de opdracht samenvatten...';
      }
    } else if (type === 'website') {
      if (!currentDetails.title) {
        updates.title = 'Website: ' + msgs[msgs.length - 1].content;
        message = 'Interessant! Hoeveel pagina\'s heeft de website nodig? (bijv. 5 pagina\'s)';
      } else if (!currentDetails.specifications?.pages) {
        updates.specifications = { description: lastUserMsg };
        updates.estimatedCost = 600;
        updates.creditCost = 6000;
        updates.description = lastUserMsg;
        readyToSubmit = true;
        message = 'Perfect! Ik heb genoeg informatie om een offerte te maken.';
      }
    } else {
      // Generic flow
      if (!currentDetails.description) {
        updates.description = lastUserMsg;
        updates.estimatedCost = 60; // Base 1 hour
        updates.creditCost = 600;
        readyToSubmit = true;
        message = 'Bedankt voor de informatie! Laat me een offerte voorbereiden.';
      }
    }

    return { message, updates, readyToSubmit };
  };

  const handleSubmitOrder = async () => {
    setSubmitting(true);

    try {
      const response = await fetch('/api/task-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskType: orderDetails.type,
          title: orderDetails.title || 'Custom Order',
          description: orderDetails.description || messages.map(m => `${m.role}: ${m.content}`).join('\n'),
          specifications: orderDetails.specifications,
          estimatedCost: orderDetails.estimatedCost,
          creditCost: orderDetails.creditCost,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit order');
      }

      setStep('success');
      toast.success('Opdracht succesvol ingediend!');
    } catch (error: any) {
      toast.error('Er ging iets mis bij het indienen');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  // Step 1: Select Order Type
  if (step === 'select') {
    return (
      <div className="container mx-auto p-6 max-w-6xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Opdracht Aanvragen</h1>
            <p className="text-muted-foreground">
              Bestel custom content, websites, of AI applicaties
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ORDER_TYPES.map((orderType) => {
            const Icon = orderType.icon;
            return (
              <Card
                key={orderType.id}
                className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-orange-500 overflow-hidden"
                onClick={() => startChat(orderType.id)}
              >
                <div className={cn(
                  'absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity',
                  `bg-gradient-to-br ${orderType.gradient}`
                )} />
                
                <div className="relative p-6 space-y-3">
                  <div className={cn(
                    'w-12 h-12 rounded-lg flex items-center justify-center',
                    `bg-gradient-to-br ${orderType.gradient}`
                  )}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{orderType.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{orderType.description}</p>
                    <Badge variant="outline">{orderType.basePrice}</Badge>
                  </div>

                  <div className="flex items-center text-orange-600 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    Bestellen
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Step 2: Chat with AI
  if (step === 'chat') {
    return (
      <div className="container mx-auto p-6 max-w-4xl space-y-4">
        <Button variant="ghost" onClick={() => setStep('select')}>
          ← Terug
        </Button>

        <Card className="h-[600px] flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex gap-3',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br bg-[#ff6b35] flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}

                <div
                  className={cn(
                    'max-w-[70%] rounded-2xl px-4 py-3',
                    msg.role === 'user'
                      ? 'bg-[#ff6b35] text-white'
                      : 'bg-zinc-800 text-white'
                  )}
                >
                  <p className="text-sm">{msg.content}</p>
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br bg-[#ff6b35] flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br bg-[#ff6b35] flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-zinc-800 rounded-2xl px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-300" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type je bericht..."
                rows={2}
                className="resize-none"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || loading}
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                size="lg"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Step 3: Confirm Order
  if (step === 'confirm') {
    const orderType = ORDER_TYPES.find(t => t.id === orderDetails.type);
    const Icon = orderType?.icon || FileText;

    return (
      <div className="container mx-auto p-6 max-w-2xl space-y-6">
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-12 h-12 rounded-lg flex items-center justify-center',
              `bg-gradient-to-br ${orderType?.gradient}`
            )}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Bevestig je opdracht</h2>
              <p className="text-sm text-muted-foreground">Controleer de details voordat je indient</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-200">Type</label>
              <p className="text-lg">{orderType?.title}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-200">Titel</label>
              <p className="text-lg">{orderDetails.title}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-200">Beschrijving</label>
              <p className="text-sm text-gray-300">{orderDetails.description}</p>
            </div>

            {orderDetails.specifications && (
              <div>
                <label className="text-sm font-medium text-gray-200">Specificaties</label>
                <pre className="text-sm bg-zinc-900 p-3 rounded-lg overflow-auto">
                  {JSON.stringify(orderDetails.specifications, null, 2)}
                </pre>
              </div>
            )}

            <div className="bg-zinc-900 border-2 border-orange-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Geschatte prijs</p>
                  <p className="text-2xl font-bold text-orange-600">
                    €{orderDetails.estimatedCost?.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-300">Credits</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {orderDetails.creditCost?.toFixed(0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep('chat')}
              className="flex-1"
            >
              Terug
            </Button>
            <Button
              onClick={handleSubmitOrder}
              disabled={submitting}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Indienen...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Bevestigen & Indienen
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Step 4: Success
  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card className="p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </div>
        
        <div>
          <h2 className="text-2xl font-bold mb-2">Opdracht Verzonden!</h2>
          <p className="text-muted-foreground">
            We hebben je opdracht ontvangen en nemen zo snel mogelijk contact met je op.
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => {
              setStep('select');
              setMessages([]);
              setOrderDetails({});
              setSelectedType(null);
            }}
          >
            Nieuwe Opdracht
          </Button>
          <Button
            onClick={() => router.push('/client-portal/my-tasks')}
            className="bg-gradient-to-r from-orange-500 to-red-600"
          >
            Bekijk Mijn Opdrachten
          </Button>
        </div>
      </Card>
    </div>
  );
}
