'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Sparkles,
  Send,
  Loader2,
  User,
  Bot,
  Plus,
  Upload,
  Image as ImageIcon,
  X,
  Download,
  Globe,
  Zap,
  Settings,
  Languages,
} from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Image from 'next/image';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  images?: string[];
  files?: Array<{ name: string; type: string; content: string }>;
  modelInfo?: {
    model: string;
    tier: string;
    reason: string;
  };
}

export default function UniversalAIAgent() {
  const { data: session } = useSession() || {};
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [language, setLanguage] = useState<'nl' | 'en'>('nl');
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll naar beneden
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Welcome message
  useEffect(() => {
    setMessages([{
      role: 'assistant',
      content: language === 'nl' 
        ? '👋 Hallo! Ik ben je universele AI assistent. Ik kan:\n\n✍️ **Tekst schrijven** - Blogs, artikelen, social media posts\n🔍 **Internet doorzoeken** - Voor actuele informatie\n🎨 **Afbeeldingen genereren** - Beschrijf wat je wilt zien\n📄 **Bestanden analyseren** - Upload documenten voor analyse\n💬 **Gewoon chatten** - Stel me alles!\n\nWat kan ik voor je doen?'
        : '👋 Hello! I\'m your universal AI assistant. I can:\n\n✍️ **Write text** - Blogs, articles, social media posts\n🔍 **Search the web** - For current information\n🎨 **Generate images** - Describe what you want to see\n📄 **Analyze files** - Upload documents for analysis\n💬 **Just chat** - Ask me anything!\n\nWhat can I do for you?'
    }]);
  }, [language]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
    toast.success(`${files.length} ${language === 'nl' ? 'bestand(en) toegevoegd' : 'file(s) added'}`);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && uploadedFiles.length === 0) return;

    const clientId = (session?.user as any)?.id;
    if (!clientId) {
      toast.error(language === 'nl' ? 'Je moet ingelogd zijn' : 'You must be logged in');
      return;
    }

    // Prepare user message
    const userMessage: Message = {
      role: 'user',
      content: input,
      files: []
    };

    // Add files to message
    if (uploadedFiles.length > 0) {
      const filePromises = uploadedFiles.map(file => {
        return new Promise<{ name: string; type: string; content: string }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              name: file.name,
              type: file.type,
              content: reader.result as string
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });
      
      userMessage.files = await Promise.all(filePromises);
    }

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setUploadedFiles([]);
    setIsLoading(true);
    setProgress(0);

    try {
      const response = await fetch('/api/client/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          files: userMessage.files,
          clientId,
          language,
          stream: true,
          // ✅ VERBETERD: Gebruik volledige geschiedenis in plaats van slechts 10 berichten
          // Dit geeft de AI beter begrip van de context en eerdere vragen
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!response.ok) {
        throw new Error(language === 'nl' ? 'Er ging iets mis' : 'Something went wrong');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      let currentModelInfo: any = null;

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'status') {
                setStatusMessage(data.message);
                setProgress(data.progress || 0);
              } else if (data.type === 'word') {
                assistantMessage = data.content;
                setMessages(prev => {
                  const newMessages = [...prev];
                  if (newMessages[newMessages.length - 1]?.role === 'assistant') {
                    newMessages[newMessages.length - 1].content = assistantMessage;
                  } else {
                    newMessages.push({
                      role: 'assistant',
                      content: assistantMessage
                    });
                  }
                  return newMessages;
                });
              } else if (data.type === 'image_generated') {
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMsg = newMessages[newMessages.length - 1];
                  if (lastMsg?.role === 'assistant') {
                    lastMsg.images = data.images;
                  }
                  return newMessages;
                });
              } else if (data.type === 'model_info') {
                currentModelInfo = data;
              } else if (data.type === 'complete') {
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMsg = newMessages[newMessages.length - 1];
                  if (lastMsg?.role === 'assistant') {
                    lastMsg.modelInfo = currentModelInfo;
                  }
                  return newMessages;
                });
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error: any) {
      // ✅ VERBETERD: User-friendly error messages met suggesties
      let errorMessage = '';
      let suggestionMessage = '';
      
      if (error.message?.includes('timeout') || error.message?.includes('took too long')) {
        errorMessage = language === 'nl' 
          ? '⏱️ Je vraag was te complex en duurde te lang.'
          : '⏱️ Your question was too complex and took too long.';
        suggestionMessage = language === 'nl'
          ? '\n\n💡 **Tip:** Probeer je vraag op te splitsen in kleinere delen.'
          : '\n\n💡 **Tip:** Try breaking your question into smaller parts.';
      } else if (error.message?.includes('credits') || error.message?.includes('insufficient')) {
        errorMessage = language === 'nl'
          ? '💳 Je hebt niet genoeg credits.'
          : '💳 You don\'t have enough credits.';
        suggestionMessage = language === 'nl'
          ? '\n\n💡 **Tip:** Koop meer credits in je account instellingen.'
          : '\n\n💡 **Tip:** Purchase more credits in your account settings.';
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = language === 'nl'
          ? '🌐 Verbindingsprobleem met de server.'
          : '🌐 Connection problem with the server.';
        suggestionMessage = language === 'nl'
          ? '\n\n💡 **Tip:** Controleer je internetverbinding en probeer het opnieuw.'
          : '\n\n💡 **Tip:** Check your internet connection and try again.';
      } else {
        errorMessage = language === 'nl'
          ? '❌ Er ging iets mis.'
          : '❌ Something went wrong.';
        suggestionMessage = language === 'nl'
          ? '\n\n💡 **Tip:** Probeer het opnieuw of formuleer je vraag anders.'
          : '\n\n💡 **Tip:** Try again or rephrase your question.';
      }
      
      toast.error(errorMessage);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: errorMessage + suggestionMessage
      }]);
    } finally {
      setIsLoading(false);
      setStatusMessage('');
      setProgress(0);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-3 md:p-4 bg-black/50 backdrop-blur-lg border-b border-orange-500/20">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base md:text-xl font-bold text-white">WritgoAI Assistant</h1>
            <p className="text-xs text-gray-400 hidden md:block">{language === 'nl' ? 'Universele AI Assistent' : 'Universal AI Assistant'}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage(language === 'nl' ? 'en' : 'nl')}
            className="text-gray-400 hover:text-white text-xs md:text-sm"
          >
            <Languages className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            {language === 'nl' ? 'NL' : 'EN'}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setMessages([]);
              window.location.reload();
            }}
            className="text-gray-400 hover:text-white text-xs md:text-sm"
          >
            <Plus className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            <span className="hidden md:inline">{language === 'nl' ? 'Nieuw' : 'New'}</span>
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-3 md:p-6">
        <div className="w-full max-w-full md:max-w-5xl md:mx-auto space-y-4 md:space-y-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === 'user'
                  ? 'bg-blue-500'
                  : 'bg-gradient-to-r from-orange-500 to-orange-600'
              }`}>
                {message.role === 'user' ? (
                  <User className="w-3 h-3 md:w-4 md:h-4 text-white" />
                ) : (
                  <Bot className="w-3 h-3 md:w-4 md:h-4 text-white" />
                )}
              </div>

              {/* Message Content */}
              <div className={`flex-1 ${
                message.role === 'user' ? 'text-right' : 'text-left'
              }`}>
                <Card className={`p-3 md:p-4 ${
                  message.role === 'user'
                    ? 'bg-blue-500/10 border-blue-500/20'
                    : 'bg-gray-800/50 border-gray-700/50'
                }`}>
                  {/* Text Content */}
                  <div className="prose prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  </div>

                  {/* Files */}
                  {message.files && message.files.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.files.map((file, i) => (
                        <div key={i} className="text-xs bg-gray-700 rounded px-2 py-1">
                          📄 {file.name}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Generated Images */}
                  {message.images && message.images.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {message.images.map((img, i) => (
                        <div key={i} className="relative aspect-square">
                          <Image
                            src={img}
                            alt={`Generated ${i + 1}`}
                            fill
                            className="object-cover rounded-lg"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Model Info */}
                  {message.modelInfo && (
                    <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-400">
                      <Zap className="w-3 h-3 inline mr-1" />
                      {message.modelInfo.model} ({message.modelInfo.tier})
                    </div>
                  )}
                </Card>
              </div>
            </div>
          ))}

          {/* Loading State */}
          {isLoading && statusMessage && (
            <div className="flex gap-2 md:gap-3">
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                <Loader2 className="w-3 h-3 md:w-4 md:h-4 text-white animate-spin" />
              </div>
              <Card className="flex-1 p-3 md:p-4 bg-gray-800/50 border-gray-700/50">
                <p className="text-xs md:text-sm text-gray-300 mb-2">{statusMessage}</p>
                {progress > 0 && <Progress value={progress} className="h-1" />}
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-3 md:p-4 bg-black/50 backdrop-blur-lg border-t border-orange-500/20">
        <div className="w-full max-w-full md:max-w-5xl md:mx-auto">
          {/* Uploaded Files Preview */}
          {uploadedFiles.length > 0 && (
            <div className="mb-2 md:mb-3 flex flex-wrap gap-1.5 md:gap-2">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1.5 md:gap-2 bg-gray-800 rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm"
                >
                  <span className="text-gray-300 truncate max-w-[120px] md:max-w-xs">{file.name}</span>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-gray-400 hover:text-red-400"
                  >
                    <X className="w-3 h-3 md:w-4 md:h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-1.5 md:gap-2">
            {/* File Upload */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.txt,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="bg-gray-800 border-gray-700 hover:bg-gray-700 h-10 w-10 md:h-12 md:w-12"
            >
              <Upload className="w-4 h-4 md:w-5 md:h-5" />
            </Button>

            {/* Text Input */}
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={language === 'nl' ? 'Typ je bericht...' : 'Type your message...'}
              disabled={isLoading}
              className="flex-1 min-h-[40px] md:min-h-[60px] bg-gray-800 border-gray-700 text-white resize-none text-sm md:text-base"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />

            {/* Send Button */}
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || (!input.trim() && uploadedFiles.length === 0)}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 h-10 w-10 md:h-12 md:w-12"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
              ) : (
                <Send className="w-4 h-4 md:w-5 md:h-5" />
              )}
            </Button>
          </form>

          <p className="text-[10px] md:text-xs text-gray-500 text-center mt-1.5 md:mt-2">
            {language === 'nl'
              ? 'WritgoAI kan fouten maken. Controleer belangrijke informatie.'
              : 'WritgoAI can make mistakes. Check important information.'}
          </p>
        </div>
      </div>
    </div>
  );
}