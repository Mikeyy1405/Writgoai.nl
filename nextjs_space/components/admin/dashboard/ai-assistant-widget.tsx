'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Send, FileText, BarChart3, UserPlus, Calendar } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function AIAssistantWidget() {
  const [message, setMessage] = useState('');
  const router = useRouter();

  const quickActions = [
    {
      label: 'Genereer artikel',
      icon: FileText,
      href: '/admin/blog/editor',
      color: 'text-blue-400',
    },
    {
      label: 'Bekijk statistieken',
      icon: BarChart3,
      href: '/admin/dashboard',
      color: 'text-green-400',
    },
    {
      label: 'Klant toevoegen',
      icon: UserPlus,
      href: '/admin/clients',
      color: 'text-purple-400',
    },
    {
      label: 'Content plannen',
      icon: Calendar,
      href: '/admin/distribution',
      color: 'text-orange-400',
    },
  ];

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    const messageLower = message.toLowerCase();
    
    // Keyword-based routing map
    const routingMap = [
      { keywords: ['blog', 'artikel', 'schrij'], route: '/admin/blog/editor', label: 'artikeleditor' },
      { keywords: ['statistiek', 'stats', 'cijfers'], route: '/admin/dashboard', label: 'dashboard' },
      { keywords: ['klant', 'client'], route: '/admin/clients', label: 'klanten' },
      { keywords: ['plan', 'social', 'distributie'], route: '/admin/distribution', label: 'distributie centrum' },
      { keywords: ['email', 'mail'], route: '/admin/emails', label: 'emails' },
      { keywords: ['factuur', 'invoice'], route: '/admin/financien', label: 'financiën' },
    ];
    
    const matchedRoute = routingMap.find(({ keywords }) => 
      keywords.some(keyword => messageLower.includes(keyword))
    );
    
    if (matchedRoute) {
      toast.success(`Navigeer naar ${matchedRoute.label}...`);
      router.push(matchedRoute.route);
    } else {
      toast.info('AI assistent: Ik begrijp je vraag nog niet. Probeer een snelle actie te gebruiken!');
    }
    
    setMessage('');
  };

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
          {/* Welcome message */}
          <div className="p-3 bg-gradient-to-r from-[#FF6B35]/10 to-purple-500/10 rounded-lg border border-[#FF6B35]/20">
            <p className="text-sm text-zinc-300">
              👋 Hallo! Ik help je snel navigeren. Stel een vraag of kies een snelle actie.
            </p>
          </div>

          {/* Chat input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Vraag me iets..."
              className="flex-1 px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#FF6B35]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage();
                }
              }}
            />
            <Button 
              className="bg-[#FF6B35] hover:bg-[#FF8555]"
              onClick={handleSendMessage}
              disabled={!message.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {/* Quick actions */}
          <div className="space-y-2">
            <p className="text-xs text-zinc-500">Snelle acties:</p>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={index}
                    onClick={() => router.push(action.href)}
                    className="text-left px-3 py-2 text-xs bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-zinc-300 transition-colors flex items-center gap-2"
                  >
                    <Icon className={`w-4 h-4 ${action.color}`} />
                    <span>{action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Info message */}
          <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-800">
            <p className="text-xs text-zinc-500 text-center">
              💡 Tip: Typ woorden zoals "artikel", "klant", "email" of "statistieken"
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
