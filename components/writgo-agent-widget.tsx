
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Briefcase, ChevronDown, X, Mic, MicOff, Volume2, VolumeX, Minimize2, Maximize2, Sparkles, Layout, FileText, Map, Calendar, MessageSquare, Wand2, Library } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// --- TYPES ---
interface Project {
  id: string;
  name: string;
  website: string | null;
  niche: string | null;
}

interface Message {
  id: number;
  sender: 'user' | 'ai';
  text: string;
  meta?: string | null;
  action?: {
    label: string;
    href: string;
  };
}

// --- TOOL ROUTES ---
const TOOL_ROUTES = {
  'content planner': '/client-portal/content-planner',
  'contentplanner': '/client-portal/content-planner',
  'topical map': '/client-portal/topical-mapping',
  'topicalmap': '/client-portal/topical-mapping',
  'auto writer': '/client-portal/content-generator',
  'autowriter': '/client-portal/content-generator',
  'ai schrijver': '/client-portal/content-generator',
  'writer': '/client-portal/content-generator',
  'ai chat': '/client-portal/ai-chat',
  'chat': '/client-portal/ai-chat',
  'content library': '/client-portal/content-library',
  'bibliotheek': '/client-portal/content-library',
  'wordpress': '/client-portal/wordpress-content',
  'image generator': '/client-portal/image-generator',
  'afbeeldingen': '/client-portal/image-generator',
  'video': '/client-portal/video-generator'
};

// --- UTILITY FUNCTIONS ---
// Clean text for display (remove HTML and Markdown)
const cleanTextForDisplay = (text: string): string => {
  let cleaned = text;
  
  // Remove HTML tags
  cleaned = cleaned.replace(/<[^>]*>/g, '');
  
  // Remove markdown code blocks
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
  
  // Remove markdown bold/italic
  cleaned = cleaned.replace(/(\*\*|__)(.*?)\1/g, '$2');
  cleaned = cleaned.replace(/(\*|_)(.*?)\1/g, '$2');
  
  // Remove markdown headers
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');
  
  // Remove markdown links [text](url) - keep text
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
  
  // Remove markdown lists markers
  cleaned = cleaned.replace(/^\s*[-*+]\s+/gm, '• ');
  cleaned = cleaned.replace(/^\s*\d+\.\s+/gm, '');
  
  // Remove markdown blockquotes
  cleaned = cleaned.replace(/^\s*>\s+/gm, '');
  
  // Remove HTML entities
  cleaned = cleaned.replace(/&nbsp;/g, ' ');
  cleaned = cleaned.replace(/&amp;/g, '&');
  cleaned = cleaned.replace(/&lt;/g, '<');
  cleaned = cleaned.replace(/&gt;/g, '>');
  cleaned = cleaned.replace(/&quot;/g, '"');
  cleaned = cleaned.replace(/&#39;/g, "'");
  
  // Clean up multiple spaces and trim
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  // Clean up multiple newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  return cleaned;
};

// --- COMPONENTS ---
const MessageBubble = ({ message, onActionClick }: { message: Message; onActionClick?: (href: string) => void }) => {
  const isAi = message.sender === 'ai';
  
  // Clean the message text for display
  const displayText = cleanTextForDisplay(message.text);
  
  return (
    <div className={`flex w-full mb-4 ${isAi ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex max-w-[90%] ${isAi ? 'flex-row' : 'flex-row-reverse'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${isAi ? 'bg-gray-700 text-orange-400' : 'bg-gray-600 text-gray-300'} mx-2 mt-1`}>
          {isAi ? <Bot size={16} /> : <User size={16} />}
        </div>
        
        {/* Bubble Text */}
        <div className={`p-3 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${
          isAi 
            ? 'bg-gray-800 border border-gray-700 text-gray-100 rounded-tl-none' 
            : 'bg-orange-600 text-white rounded-tr-none'
        }`}>
          {displayText}
          {message.meta && isAi && (
             <div className="mt-2 pt-2 border-t border-gray-600 text-[10px] text-gray-400 flex gap-1 items-center">
                <Briefcase size={10} className="text-orange-500" /> {message.meta}
             </div>
          )}
          {message.action && isAi && (
            <button
              onClick={() => onActionClick?.(message.action!.href)}
              className="mt-3 w-full px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {message.action.label}
              <Sparkles size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default function WritgoAgentWidget() {
  const { data: session } = useSession();
  const router = useRouter();
  
  // Widget State
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); 
  const [showProjectMenu, setShowProjectMenu] = useState(false);

  // Data State
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(false);
  
  // App State
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('nl'); 
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 1, 
      sender: 'ai', 
      text: "Hoi! Ik ben je WritGo AI-assistent. Ik help je met SEO-strategie, content planning en technische vragen. Selecteer een project om te starten, of stel direct een vraag!", 
      meta: null 
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  
  // Voice States
  const [isRecording, setIsRecording] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const currentAudio = useRef<HTMLAudioElement | null>(null);
  const activeProject = projects.find(p => p.id === activeProjectId);

  // Load projects when widget opens
  useEffect(() => {
    if (isOpen && session && projects.length === 0) {
      loadProjects();
    }
  }, [isOpen, session]);

  // Cleanup audio when widget closes or component unmounts
  useEffect(() => {
    return () => {
      if (currentAudio.current) {
        currentAudio.current.pause();
        currentAudio.current = null;
      }
    };
  }, []);

  // Stop audio when widget closes
  useEffect(() => {
    if (!isOpen && currentAudio.current) {
      currentAudio.current.pause();
      currentAudio.current = null;
      setIsSpeaking(false);
    }
  }, [isOpen]);

  // Stop audio when audio is disabled
  useEffect(() => {
    if (!audioEnabled && currentAudio.current) {
      currentAudio.current.pause();
      currentAudio.current = null;
      setIsSpeaking(false);
    }
  }, [audioEnabled]);

  // Scroll to bottom
  useEffect(() => {
    if (isOpen) {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Stop speaking when component unmounts
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Load projects
  const loadProjects = async () => {
    if (!session?.user?.email) return;
    
    setLoadingProjects(true);
    try {
      const response = await fetch('/api/client/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
        
        // Auto-select primary project
        const primaryProject = data.projects.find((p: Project & { isPrimary: boolean }) => p.isPrimary);
        if (primaryProject) {
          setActiveProjectId(primaryProject.id);
        } else if (data.projects.length > 0) {
          setActiveProjectId(data.projects[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoadingProjects(false);
    }
  };

  // --- VOICE LOGIC ---
  const handleSpeechToText = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Je browser ondersteunt geen spraakherkenning.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'nl' ? 'nl-NL' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = (event: any) => {
      console.error("Speech error", event.error);
      setIsRecording(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.start();
  };

  // Clean text for speech (remove HTML and Markdown)
  const cleanTextForSpeech = (text: string): string => {
    let cleaned = text;
    
    // Remove HTML tags
    cleaned = cleaned.replace(/<[^>]*>/g, '');
    
    // Remove markdown bold/italic
    cleaned = cleaned.replace(/(\*\*|__)(.*?)\1/g, '$2');
    cleaned = cleaned.replace(/(\*|_)(.*?)\1/g, '$2');
    
    // Remove markdown headers
    cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');
    
    // Remove markdown links [text](url)
    cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
    
    // Remove markdown code blocks
    cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
    cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
    
    // Remove markdown lists
    cleaned = cleaned.replace(/^\s*[-*+]\s+/gm, '');
    cleaned = cleaned.replace(/^\s*\d+\.\s+/gm, '');
    
    // Remove markdown blockquotes
    cleaned = cleaned.replace(/^\s*>\s+/gm, '');
    
    // Remove HTML entities
    cleaned = cleaned.replace(/&nbsp;/g, ' ');
    cleaned = cleaned.replace(/&amp;/g, '&');
    cleaned = cleaned.replace(/&lt;/g, '<');
    cleaned = cleaned.replace(/&gt;/g, '>');
    cleaned = cleaned.replace(/&quot;/g, '"');
    
    // Remove multiple spaces and trim
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
  };

  const speakText = async (text: string, speakLanguage?: 'nl' | 'en') => {
    if (!audioEnabled || typeof window === 'undefined') return;
    
    // Stop any currently playing audio
    if (currentAudio.current) {
      currentAudio.current.pause();
      currentAudio.current = null;
      setIsSpeaking(false);
    }
    
    // Clean the text before speaking
    const cleanedText = cleanTextForSpeech(text);
    
    // Don't speak if text is too short after cleaning
    if (cleanedText.length < 5) return;
    
    // Use provided language or fall back to current language state
    const ttsLanguage = speakLanguage || language;
    
    try {
      // Call ElevenLabs TTS API (don't set speaking yet, wait for audio to load)
      const response = await fetch('/api/client/elevenlabs/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: cleanedText,
          language: ttsLanguage 
        }),
      });

      if (!response.ok) {
        console.error('[Widget] TTS API failed:', response.status);
        return;
      }

      const data = await response.json();
      
      if (!data.audioData) {
        console.log('[Widget] No audio data received');
        return;
      }

      // Create audio element
      const audio = new Audio(data.audioData);
      currentAudio.current = audio;
      
      // Only set speaking to true when audio actually starts playing
      audio.onloadeddata = () => {
        console.log('[Widget] Audio loaded');
      };
      
      audio.onplay = () => {
        setIsSpeaking(true);
        console.log('[Widget] Audio playing');
      };
      
      audio.onended = () => {
        setIsSpeaking(false);
        currentAudio.current = null;
        console.log('[Widget] Audio ended');
      };
      
      audio.onerror = (e) => {
        setIsSpeaking(false);
        currentAudio.current = null;
        console.error('[Widget] Audio playback error:', e);
      };
      
      // Start playback
      await audio.play();
      
    } catch (error) {
      console.error('[Widget] TTS Error:', error);
      setIsSpeaking(false);
    }
  };

  // Detect language from text
  const detectLanguageFromText = (text: string): 'nl' | 'en' => {
    const lowerText = text.toLowerCase();
    
    // Common English words that rarely appear in Dutch
    const englishIndicators = [
      'the', 'is', 'are', 'was', 'were', 'have', 'has', 'had',
      'will', 'would', 'should', 'could', 'can', 'may', 'might',
      'what', 'how', 'why', 'when', 'where', 'who',
      'this', 'that', 'these', 'those', 'with', 'from', 'about'
    ];
    
    // Common Dutch words
    const dutchIndicators = [
      'de', 'het', 'een', 'is', 'zijn', 'heeft', 'hebben',
      'wat', 'hoe', 'waarom', 'wanneer', 'waar', 'wie',
      'dit', 'dat', 'deze', 'die', 'met', 'van', 'over',
      'voor', 'naar', 'bij', 'op', 'aan'
    ];
    
    const words = lowerText.split(/\s+/);
    let englishScore = 0;
    let dutchScore = 0;
    
    words.forEach(word => {
      if (englishIndicators.includes(word)) englishScore++;
      if (dutchIndicators.includes(word)) dutchScore++;
    });
    
    // If we have clear indicators, use them
    if (englishScore > dutchScore && englishScore >= 2) {
      return 'en';
    }
    if (dutchScore > englishScore && dutchScore >= 2) {
      return 'nl';
    }
    
    // Default to current language if unclear
    return language as 'nl' | 'en';
  };

  // Detect tool mentions and route
  const detectToolRoute = (text: string): { label: string; href: string } | null => {
    const lowerText = text.toLowerCase();
    
    for (const [keyword, href] of Object.entries(TOOL_ROUTES)) {
      if (lowerText.includes(keyword)) {
        const toolName = keyword.charAt(0).toUpperCase() + keyword.slice(1);
        return {
          label: `Open ${toolName}`,
          href
        };
      }
    }
    
    return null;
  };

  // --- MESSAGE HANDLING ---
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!input.trim()) return;

    // Auto-detect language from user input
    const detectedLang = detectLanguageFromText(input);
    if (detectedLang !== language) {
      setLanguage(detectedLang);
      console.log(`[Widget] Auto-switched language to ${detectedLang}`);
    }

    const userMsg: Message = { id: Date.now(), sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input; 
    setInput('');
    setIsTyping(true);
    window.speechSynthesis.cancel();

    try {
      // Build context
      const projectContext = activeProject 
        ? `Project: ${activeProject.name}${activeProject.website ? `, Website: ${activeProject.website}` : ''}${activeProject.niche ? `, Niche: ${activeProject.niche}` : ''}`
        : 'Geen project geselecteerd';

      // Use the detected language for the AI response
      const responseLanguage = detectedLang;

      // System prompt for agent
      const systemPrompt = `Je bent de WritGo AI-assistent, een professionele SEO en content marketing expert.

CONTEXT:
${projectContext}

GEDRAGSREGELS:
1. Geef altijd concrete, actionable adviezen
2. Focus op SEO-strategie en content kwaliteit
3. Wees kort maar informatief (max 3-4 zinnen per antwoord)
4. Als je een tool moet aanbevelen, noem deze expliciet (bijv: "Gebruik de Content Planner voor...")
5. Spreek de gebruiker direct aan met "je"
6. Wees professioneel maar toegankelijk

BESCHIKBARE TOOLS:
- Content Planner: Topical Map + Content Research + Automatisering
- Auto Writer: Snelle SEO-artikelen (60 sec)
- AI Schrijver: Volledige controle over content
- Topical Map: Strategische content planning
- AI Chat: Diepgaande conversaties en analyse
- Content Library: Beheer en bewerk content
- WordPress: Direct publiceren
- Image Generator: AI-afbeeldingen
- Video Generator: Video content

BELANGRIJKE VERBODEN WOORDEN (NOOIT GEBRUIKEN):
wereld van, cruciaal, essentieel, kortom, conclusie, duik, duiken, vriend, wereld, jungle, duiken in, de sleutel, key, superheld, spul, induiken, veilige haven, gids, voordelen, zonder gedoe, gedoe, voordelen van, digitaal tijdperk, of je, of je nu, ontdek

KRITIEK: Antwoord ALTIJD in het ${responseLanguage === 'nl' ? 'Nederlands' : 'Engels'}, ongeacht de taal van eerdere berichten.`;

      // Call chat API
      const response = await fetch('/api/client/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentInput,
          conversationId: 'agent-widget',
          settings: {
            model: 'google/gemini-3-pro-preview',
            temperature: 0.7,
            systemPrompt
          }
        })
      });

      if (!response.ok) throw new Error('API call failed');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  accumulatedText += data.content;
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }

      // Detect if we should suggest a tool
      const toolAction = detectToolRoute(currentInput) || detectToolRoute(accumulatedText);

      const aiMsg: Message = { 
        id: Date.now() + 1, 
        sender: 'ai', 
        text: accumulatedText || 'Sorry, ik kon geen antwoord genereren. Probeer het opnieuw.',
        meta: activeProject?.name || null,
        action: toolAction || undefined
      };
      
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
      speakText(aiMsg.text, detectedLang);

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMsg: Message = {
        id: Date.now() + 1,
        sender: 'ai',
        text: 'Sorry, er ging iets mis. Probeer het opnieuw.',
        meta: null
      };
      setMessages(prev => [...prev, errorMsg]);
      setIsTyping(false);
    }
  };

  const handleActionClick = (href: string) => {
    router.push(href);
    setIsOpen(false);
  };

  // --- LAUNCHER BUTTON (CLOSED STATE) ---
  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-16 w-16 bg-orange-600 hover:bg-orange-700 text-white rounded-full shadow-[0_0_20px_rgba(234,88,12,0.3)] flex items-center justify-center transition-all duration-300 z-50 hover:scale-110 group"
      >
        <Bot size={32} className="group-hover:rotate-12 transition-transform" />
        <span className="absolute top-0 right-0 h-4 w-4 bg-white rounded-full border-2 border-gray-900"></span>
      </button>
    );
  }

  // --- WIDGET OPEN STATE ---
  return (
    <div className={`fixed bottom-6 right-6 bg-gray-900 rounded-2xl shadow-2xl flex flex-col border border-gray-800 overflow-hidden transition-all duration-300 z-50 font-sans ${isExpanded ? 'w-[380px] h-[80vh]' : 'w-[350px] h-[600px]'}`}>
      
      {/* HEADER */}
      <div className="bg-gray-900 p-4 text-white flex-shrink-0 relative border-b border-gray-800">
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
                <div className="bg-orange-600/20 p-2 rounded-lg backdrop-blur-sm border border-orange-500/20">
                    <Bot size={20} className="text-orange-500" />
                </div>
                <div>
                    <h3 className="font-bold text-sm text-gray-100">WritGo AI Assistent</h3>
                    <div 
                        className="flex items-center gap-1 text-gray-400 text-xs cursor-pointer hover:text-orange-400 transition-colors mt-0.5"
                        onClick={() => setShowProjectMenu(!showProjectMenu)}
                    >
                        <span className="truncate max-w-[120px]">
                          {loadingProjects ? 'Laden...' : activeProject?.name || 'Geen project'}
                        </span>
                        <ChevronDown size={12} className={`transform transition-transform ${showProjectMenu ? 'rotate-180' : ''}`} />
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-1">
                <button onClick={() => setLanguage(l => l === 'nl' ? 'en' : 'nl')} className="px-2 py-1 text-[10px] font-bold bg-gray-800 hover:bg-gray-700 text-gray-300 rounded uppercase border border-gray-700">
                    {language}
                </button>
                <button onClick={() => setIsExpanded(!isExpanded)} className="p-1.5 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-colors">
                    {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
                <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-red-900/30 hover:text-red-400 rounded text-gray-400 transition-colors">
                    <X size={16} />
                </button>
            </div>
        </div>

        {/* PROJECT DROPDOWN */}
        {showProjectMenu && (
            <div className="absolute top-full left-0 right-0 bg-gray-800 shadow-xl border border-gray-700 z-20 max-h-64 overflow-y-auto py-2 text-gray-200 rounded-b-xl mx-2 mt-1">
                <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase">Selecteer Project</div>
                {projects.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-400">Geen projecten gevonden</div>
                ) : (
                  projects.map(p => (
                    <button 
                        key={p.id}
                        onClick={() => { setActiveProjectId(p.id); setShowProjectMenu(false); }}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-700 flex items-center justify-between ${activeProjectId === p.id ? 'bg-gray-700/50 text-orange-400' : ''}`}
                    >
                        <div className="flex flex-col">
                            <span className="font-medium text-sm">{p.name}</span>
                            <span className="text-[10px] text-gray-400 truncate">{p.website || 'Geen website'}</span>
                        </div>
                        {activeProjectId === p.id && <div className="h-2 w-2 bg-orange-500 rounded-full"></div>}
                    </button>
                  ))
                )}
            </div>
        )}
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto bg-gray-900 p-4 scrollbar-hide">
        <div className="space-y-4">
            {/* Welkomstbericht met snelle acties */}
            {messages.length === 1 && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                    <button onClick={() => setInput('Hoe maak ik een content strategie?')} className="p-3 bg-gray-800 border border-gray-700 rounded-xl text-left shadow-sm hover:border-orange-500/50 transition-all group">
                        <Map size={16} className="text-orange-500 mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-medium text-gray-300 block">Content Strategie</span>
                    </button>
                    <button onClick={() => setInput('Welke SEO tool moet ik gebruiken?')} className="p-3 bg-gray-800 border border-gray-700 rounded-xl text-left shadow-sm hover:border-orange-500/50 transition-all group">
                        <Sparkles size={16} className="text-orange-500 mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-medium text-gray-300 block">SEO Advies</span>
                    </button>
                </div>
            )}

            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} onActionClick={handleActionClick} />
            ))}
            
            {isTyping && (
               <div className="flex w-full justify-start animate-pulse">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-gray-700 text-orange-400 mx-2 mt-1">
                        <Bot size={16} />
                    </div>
                    <div className="bg-gray-800 border border-gray-700 px-4 py-3 rounded-2xl rounded-tl-none">
                        <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-100"></div>
                            <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-200"></div>
                        </div>
                    </div>
              </div>
            )}
            <div ref={chatEndRef} />
        </div>
      </div>

      {/* FOOTER / INPUT */}
      <div className="p-3 bg-gray-900 border-t border-gray-800">
        {/* Toolbar */}
        <div className="flex justify-between items-center px-1 mb-2">
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setAudioEnabled(!audioEnabled)}
                    className={`p-1.5 rounded-md transition-colors ${audioEnabled ? 'text-orange-500 bg-orange-500/10' : 'text-gray-600 hover:bg-gray-800'}`}
                    title={audioEnabled ? "Geluid aan" : "Geluid uit"}
                >
                    {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
                {isSpeaking && <span className="text-[10px] text-orange-500 animate-pulse font-medium">AI spreekt...</span>}
            </div>
            <span className="text-[10px] text-gray-500">
                {activeProject ? `📊 ${activeProject.name}` : '💬 Algemeen'}
            </span>
        </div>

        <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
            <button
                type="button"
                onClick={handleSpeechToText}
                className={`p-3 rounded-xl flex-shrink-0 transition-all duration-200 ${
                    isRecording 
                    ? 'bg-red-600 text-white animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.5)]' 
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
                title="Spraak input"
            >
                {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            <div className="flex-1 bg-gray-800 rounded-xl border border-gray-700 focus-within:border-orange-500 focus-within:bg-gray-800 transition-colors flex items-center">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={language === 'nl' ? "Stel je SEO of content vraag..." : "Ask your SEO or content question..."}
                    className="w-full bg-transparent border-none focus:ring-0 text-sm px-3 py-3 text-gray-200 placeholder-gray-500 outline-none"
                />
            </div>
            
            <button 
                type="submit" 
                disabled={!input.trim() || isTyping}
                className={`p-3 rounded-xl flex-shrink-0 transition-all duration-200 ${
                    !input.trim() || isTyping 
                    ? 'bg-gray-800 text-gray-600' 
                    : 'bg-orange-600 text-white hover:bg-orange-700 shadow-lg shadow-orange-900/20'
                }`}
            >
                <Send size={18} />
            </button>
        </form>
      </div>
    </div>
  );
}
