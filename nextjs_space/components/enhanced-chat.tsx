
'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, Plus, X, Sparkles, ExternalLink, ImageIcon, PenToolIcon, Settings2, ChevronDown, ShieldCheck, Wand2, FileText, Save, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { ModelSelector } from './chat/model-selector';
import { FileUploadButton } from './chat/file-upload-button';
import { FileAttachments } from './chat/file-attachments';
import { CodeCanvas } from './chat/code-canvas';
import { PersonalitySelector } from './chat/personality-selector';
import { ReasoningModeSelector } from './chat/reasoning-mode-selector';
import { TemperatureSlider } from './chat/temperature-slider';
import { WebSearchToggle } from './chat/web-search-toggle';
import { ContextIndicator } from './chat/context-indicator';

import { CanvasModeToggle } from './chat/canvas-mode-toggle';
import { ArtifactsModeToggle } from './chat/artifacts-mode-toggle';
import { ImageEditor } from './chat/image-editor';
import { CanvasEditor } from './chat/canvas-editor';
import { CodePreviewCanvas } from './chat/code-preview-canvas';
import { BlogToolbar } from './chat/blog-toolbar';
import { BlogProductSelector } from './chat/blog-product-selector';
import { BlogLinkSelector } from './chat/blog-link-selector';
import { ImageSelectorModal } from './image-selector-modal';
import { ContentTemplates } from './chat/content-templates';
import { getDefaultModel, supportsArtifacts, type ModelId } from '@/lib/aiml-chat-models';
import { DEFAULT_CHAT_SETTINGS, PERSONALITY_PRESETS, type PersonalityPreset, type ReasoningMode, type ChatSettings } from '@/lib/chat-settings';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: any[];
  codeBlocks?: any[];
  model?: string;
  createdAt: Date;
}

interface EnhancedChatProps {
  conversationId: string;
  initialMessages?: Message[];
  onNewMessage?: (message: Message) => void;
  projectId?: string;
}

// Custom markdown components for better styling with HTML support
const MarkdownComponents = {
  h1: ({ node, ...props }: any) => (
    <h1 className="text-3xl font-bold mt-8 mb-5 text-foreground border-b-2 border-orange-500 pb-3" {...props} />
  ),
  h2: ({ node, ...props }: any) => (
    <h2 className="text-2xl font-bold mt-7 mb-4 text-foreground border-b border-gray-700 pb-2" {...props} />
  ),
  h3: ({ node, ...props }: any) => (
    <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground" {...props} />
  ),
  h4: ({ node, ...props }: any) => (
    <h4 className="text-lg font-semibold mt-5 mb-2 text-foreground" {...props} />
  ),
  h5: ({ node, ...props }: any) => (
    <h5 className="text-base font-semibold mt-4 mb-2 text-foreground" {...props} />
  ),
  h6: ({ node, ...props }: any) => (
    <h6 className="text-sm font-semibold mt-3 mb-1 text-muted-foreground" {...props} />
  ),
  p: ({ node, ...props }: any) => (
    <p className="mb-4 leading-relaxed text-foreground/90" {...props} />
  ),
  strong: ({ node, ...props }: any) => (
    <strong className="font-bold text-orange-500" {...props} />
  ),
  em: ({ node, ...props }: any) => (
    <em className="italic text-foreground/90" {...props} />
  ),
  a: ({ node, href, children, ...props }: any) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-orange-500 hover:text-orange-600 underline inline-flex items-center gap-1 font-medium transition-colors"
      {...props}
    >
      {children}
      <ExternalLink className="h-3 w-3 inline" />
    </a>
  ),
  ul: ({ node, ...props }: any) => (
    <ul className="list-none mb-4 space-y-2 text-foreground ml-4" {...props} />
  ),
  ol: ({ node, ...props }: any) => (
    <ol className="list-decimal list-inside mb-4 space-y-2 text-foreground ml-4" {...props} />
  ),
  li: ({ node, children, ...props }: any) => {
    // Check if this is part of an unordered list
    const parent = node?.parent;
    const isUnorderedList = parent?.tagName === 'ul';
    
    if (isUnorderedList) {
      return (
        <li className="flex items-start gap-2" {...props}>
          <span className="text-orange-500 mt-1.5 flex-shrink-0">•</span>
          <span className="flex-1">{children}</span>
        </li>
      );
    }
    
    // Ordered list item
    return <li className="leading-7" {...props}>{children}</li>;
  },
  blockquote: ({ node, ...props }: any) => (
    <blockquote className="border-l-4 border-orange-500 pl-4 py-2 my-4 italic text-muted-foreground bg-muted/50 rounded-r" {...props} />
  ),
  code: ({ node, inline, className, children, ...props }: any) => {
    if (inline) {
      return (
        <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-orange-600" {...props}>
          {children}
        </code>
      );
    }
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
  pre: ({ node, ...props }: any) => (
    <pre className="bg-muted p-4 rounded-lg overflow-x-auto my-4 border" {...props} />
  ),
  img: ({ node, src, alt, ...props }: any) => {
    if (!src) return null;
    
    // For chat-generated images (base64 or external URLs), use regular img tag
    // This ensures proper rendering of AI-generated images
    const isDataUrl = src.startsWith('data:');
    const isExternalUrl = src.startsWith('http://') || src.startsWith('https://');
    
    if (isDataUrl || isExternalUrl) {
      return (
        <div className="my-4 rounded-lg overflow-hidden border bg-muted">
          <div className="relative w-full">
            <img
              src={src}
              alt={alt || 'Generated Image'}
              className="w-full h-auto max-h-[600px] object-contain"
              onError={(e) => {
                console.error('❌ Image failed to load:', src.substring(0, 100));
                (e.target as HTMLImageElement).style.display = 'none';
              }}
              onLoad={() => {
                console.log('✅ Image loaded successfully');
              }}
              {...props}
            />
          </div>
          {alt && (
            <p className="text-sm text-muted-foreground p-2 text-center bg-background/50">
              {alt}
            </p>
          )}
        </div>
      );
    }
    
    // For local images, use Next.js Image component
    return (
      <div className="my-4 rounded-lg overflow-hidden border bg-muted">
        <div className="relative w-full aspect-video">
          <Image
            src={src}
            alt={alt || 'Image'}
            fill
            className="object-contain"
            {...props}
          />
        </div>
        {alt && (
          <p className="text-sm text-muted-foreground p-2 text-center bg-background/50">
            {alt}
          </p>
        )}
      </div>
    );
  },
  hr: ({ node, ...props }: any) => (
    <hr className="my-6 border-t border-border" {...props} />
  ),
  table: ({ node, ...props }: any) => (
    <div className="my-4 overflow-x-auto">
      <table className="min-w-full divide-y divide-border border" {...props} />
    </div>
  ),
  thead: ({ node, ...props }: any) => (
    <thead className="bg-muted" {...props} />
  ),
  tbody: ({ node, ...props }: any) => (
    <tbody className="divide-y divide-border bg-background" {...props} />
  ),
  tr: ({ node, ...props }: any) => (
    <tr {...props} />
  ),
  th: ({ node, ...props }: any) => (
    <th className="px-4 py-2 text-left text-sm font-semibold text-foreground" {...props} />
  ),
  td: ({ node, ...props }: any) => (
    <td className="px-4 py-2 text-sm text-foreground" {...props} />
  ),
};

export default function EnhancedChat({
  conversationId,
  initialMessages = [],
  onNewMessage,
  projectId,
}: EnhancedChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelId>(getDefaultModel());
  const [pendingAttachments, setPendingAttachments] = useState<any[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(true);
  
  // GPT-5.1 Settings
  const [chatSettings, setChatSettings] = useState<ChatSettings>(DEFAULT_CHAT_SETTINGS);
  
  // Image & Canvas Editors
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [showCanvasEditor, setShowCanvasEditor] = useState(false);
  const [currentCanvasContent, setCurrentCanvasContent] = useState('');
  
  // Code Preview Canvas
  const [showCodePreview, setShowCodePreview] = useState(false);
  const [currentCodeHtml, setCurrentCodeHtml] = useState('');
  const [currentCodeCss, setCurrentCodeCss] = useState('');
  const [currentCodeJs, setCurrentCodeJs] = useState('');
  
  // Blog Writing Mode
  const [blogWritingMode, setBlogWritingMode] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [showLinkSelector, setShowLinkSelector] = useState(false);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(projectId);
  
  // Originality Scanner
  const [scanningText, setScanningText] = useState(false);
  const [humanizingText, setHumanizingText] = useState(false);
  
  // Text Selection for Humanization
  const [selectedText, setSelectedText] = useState('');
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
  const [showSelectionMenu, setShowSelectionMenu] = useState(false);
  
  // Save/Publish states
  const [savingToLibrary, setSavingToLibrary] = useState(false);
  const [publishingToWordPress, setPublishingToWordPress] = useState(false);
  
  // Template Options for Bol.com Products
  const [templateOptions, setTemplateOptions] = useState<{
    includeBolcomProducts?: boolean;
    searchQuery?: string;
    templateId?: string;
  } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load messages when conversation changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!conversationId) return;
      
      setLoadingMessages(true);
      try {
        const response = await fetch(`/api/client/chat/messages?conversationId=${conversationId}`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [conversationId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  const extractCodeBlocks = (content: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const blocks: any[] = [];
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      blocks.push({
        language: match[1] || 'plaintext',
        code: match[2].trim(),
        title: `Code blok ${blocks.length + 1}`,
      });
    }

    return blocks;
  };

  // Image generation and editing handlers
  const handleGenerateImage = async (prompt: string): Promise<string> => {
    try {
      const response = await fetch('/api/client/chat/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, conversationId }),
      });

      if (!response.ok) throw new Error('Image generation failed');
      
      const data = await response.json();
      return data.imageUrl;
    } catch (error) {
      console.error('Image generation error:', error);
      toast.error('Afbeelding genereren mislukt');
      throw error;
    }
  };

  const handleEditImage = async (editPrompt: string): Promise<string> => {
    try {
      const response = await fetch('/api/client/chat/edit-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: currentImageUrl,
          prompt: editPrompt,
          conversationId,
        }),
      });

      if (!response.ok) throw new Error('Image edit failed');
      
      const data = await response.json();
      return data.imageUrl;
    } catch (error) {
      console.error('Image edit error:', error);
      toast.error('Afbeelding bewerken mislukt');
      throw error;
    }
  };

  // Canvas content refinement handler
  const handleRefineCanvas = async (content: string, instruction: string): Promise<string> => {
    try {
      const response = await fetch('/api/client/chat/refine-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          instruction,
          conversationId,
          settings: chatSettings,
        }),
      });

      if (!response.ok) throw new Error('Content refinement failed');
      
      const data = await response.json();
      return data.refinedContent;
    } catch (error) {
      console.error('Content refinement error:', error);
      toast.error('Content verfijnen mislukt');
      throw error;
    }
  };

  const handleSaveCanvas = (content: string) => {
    // Save to message history
    const assistantMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: content,
      createdAt: new Date(),
      model: selectedModel,
    };
    
    setMessages((prev) => [...prev, assistantMessage]);
    if (onNewMessage) onNewMessage(assistantMessage);
  };

  // Code refinement handler
  const handleRefineCode = async (code: string, instruction: string, language: string): Promise<string> => {
    try {
      const response = await fetch('/api/client/chat/refine-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          instruction,
          language,
          conversationId,
          settings: chatSettings,
        }),
      });

      if (!response.ok) throw new Error('Code refinement failed');
      
      const data = await response.json();
      return data.refinedCode;
    } catch (error) {
      console.error('Code refinement error:', error);
      toast.error('Code verfijnen mislukt');
      throw error;
    }
  };

  // Save code to message history
  const handleSaveCode = (html: string, css: string, js: string) => {
    const codeContent = `\`\`\`html\n${html}\n\`\`\`\n\n\`\`\`css\n${css}\n\`\`\`\n\n\`\`\`javascript\n${js}\n\`\`\``;
    
    const assistantMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: codeContent,
      codeBlocks: [
        { language: 'html', code: html, title: 'HTML' },
        { language: 'css', code: css, title: 'CSS' },
        { language: 'javascript', code: js, title: 'JavaScript' },
      ],
      createdAt: new Date(),
      model: selectedModel,
    };
    
    setMessages((prev) => [...prev, assistantMessage]);
    if (onNewMessage) onNewMessage(assistantMessage);
  };

  // Save message to content library
  const handleSaveToLibrary = async (content: string) => {
    try {
      setSavingToLibrary(true);
      
      // Extract title from content (first heading or first line)
      let title = 'AI Chat Content';
      const headingMatch = content.match(/^#\s+(.+)$/m);
      if (headingMatch && headingMatch[1]) {
        title = headingMatch[1].trim();
      } else {
        const firstLine = content.split('\n')[0].trim();
        if (firstLine && firstLine.length < 100) {
          title = firstLine.replace(/^[#*\s]+/, '').substring(0, 80);
        }
      }
      
      // Convert markdown to HTML for better storage
      const htmlContent = content
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/^(?!<[h|p])/gm, '<p>')
        .replace(/(?![>])$/gm, '</p>');
      
      const response = await fetch('/api/client/content-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          contentHtml: htmlContent,
          type: 'other',
          projectId: projectId || undefined,
          language: 'NL',
          generatorType: 'ai-chat',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Opslaan mislukt');
      }

      const data = await response.json();
      toast.success('✅ Opgeslagen in Content Bibliotheek!');
      return data.content?.id;
    } catch (error: any) {
      console.error('Save to library error:', error);
      toast.error(error.message || 'Opslaan naar bibliotheek mislukt');
      throw error;
    } finally {
      setSavingToLibrary(false);
    }
  };

  // Publish message to WordPress
  const handlePublishToWordPress = async (content: string) => {
    try {
      setPublishingToWordPress(true);
      
      // Extract title from content
      let title = 'AI Chat Content';
      const headingMatch = content.match(/^#\s+(.+)$/m);
      if (headingMatch && headingMatch[1]) {
        title = headingMatch[1].trim();
      } else {
        const firstLine = content.split('\n')[0].trim();
        if (firstLine && firstLine.length < 100) {
          title = firstLine.replace(/^[#*\s]+/, '').substring(0, 80);
        }
      }
      
      // Convert markdown to HTML for WordPress
      const htmlContent = content
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/^(?!<[h|p])/gm, '<p>')
        .replace(/(?![>])$/gm, '</p>');
      
      const response = await fetch('/api/client/wordpress/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content: htmlContent,
          projectId: projectId || undefined,
          status: 'draft', // Save as draft for review
          useGutenberg: false, // Use classic editor for chat content
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Publiceren mislukt');
      }

      const data = await response.json();
      toast.success('✅ Gepubliceerd naar WordPress als concept!');
      if (data.postUrl) {
        setTimeout(() => {
          toast((t) => (
            <div className="flex items-center gap-2">
              <span>🔗 WordPress post aangemaakt</span>
              <button
                onClick={() => {
                  window.open(data.postUrl, '_blank');
                  toast.dismiss(t.id);
                }}
                className="px-2 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90"
              >
                Bekijk
              </button>
            </div>
          ), { duration: 8000 });
        }, 1000);
      }
      return data;
    } catch (error: any) {
      console.error('Publish to WordPress error:', error);
      toast.error(error.message || 'Publiceren naar WordPress mislukt');
      throw error;
    } finally {
      setPublishingToWordPress(false);
    }
  };

  // Extract HTML/CSS/JS from code blocks
  const extractWebCode = (codeBlocks: any[]) => {
    let html = '';
    let css = '';
    let js = '';
    
    codeBlocks.forEach(block => {
      const lang = block.language.toLowerCase();
      const code = block.code || '';
      
      if (lang === 'html') {
        html = code;
        // Extract inline CSS if present
        const styleMatch = code.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
        if (styleMatch && styleMatch[1] && !css) {
          css = styleMatch[1].trim();
        }
        // Extract inline JS if present
        const scriptMatch = code.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
        if (scriptMatch && scriptMatch[1] && !js) {
          js = scriptMatch[1].trim();
        }
      } 
      else if (lang === 'css') {
        css = code;
      }
      else if (lang === 'javascript' || lang === 'js') {
        js = code;
      }
    });
    
    return { html, css, js };
  };

  // Check if code blocks contain web code (HTML/CSS/JS)
  const hasWebCode = (codeBlocks: any[]) => {
    if (!codeBlocks || codeBlocks.length === 0) return false;
    
    return codeBlocks.some((b: any) => {
      const lang = b.language?.toLowerCase() || '';
      return ['html', 'css', 'javascript', 'js', 'xml', 'svg'].includes(lang);
    });
  };

  const handleGenerateImageFromInput = async () => {
    if (!input.trim()) {
      toast.error('Voer een beschrijving in voor de afbeelding');
      return;
    }
    if (isLoading) return;

    // Prepend "Maak een afbeelding" if not already present
    let imagePrompt = input.trim();
    const imageKeywords = ['maak een afbeelding', 'genereer een afbeelding', 'create an image', 'generate an image'];
    const hasImageKeyword = imageKeywords.some(keyword => imagePrompt.toLowerCase().includes(keyword));
    
    if (!hasImageKeyword) {
      imagePrompt = `Maak een afbeelding van ${imagePrompt}`;
    }

    // Send the image generation request
    setInput('');
    setIsLoading(true);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: imagePrompt,
      createdAt: new Date(),
      model: selectedModel,
    };

    setMessages((prev) => [...prev, userMessage]);
    setStreamingContent('');

    try {
      const response = await fetch('/api/client/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          message: imagePrompt,
          model: selectedModel,
          chatSettings,
        }),
      });

      if (!response.ok) {
        throw new Error('Fout bij genereren afbeelding');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                const assistantMessage: Message = {
                  id: Date.now().toString(),
                  role: 'assistant',
                  content: fullContent,
                  createdAt: new Date(),
                  model: selectedModel,
                };
                setMessages((prev) => [...prev, assistantMessage]);
                setStreamingContent('');
                if (onNewMessage) {
                  onNewMessage(assistantMessage);
                }
              } else {
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.content) {
                    fullContent += parsed.content;
                    setStreamingContent(fullContent);
                  }
                } catch (e) {
                  // Ignore parse errors
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Er ging iets mis bij het genereren van de afbeelding');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanText = async () => {
    if (!input.trim()) {
      toast.error('Voer tekst in om te scannen');
      return;
    }
    if (scanningText || isLoading) return;

    setScanningText(true);

    try {
      const response = await fetch('/api/client/originality/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: input }),
      });

      if (!response.ok) {
        throw new Error('Fout bij scannen tekst');
      }

      const data = await response.json();
      
      // Create a formatted message with scan results
      // Note: Originality.AI returns scores as 0-100 percentages
      const aiScore = Math.round(data.score?.ai || 0);
      const originalityScore = Math.round(data.score?.original || 0);
      const readability = 'N/A'; // Readability not available from Originality.AI scan
      
      let resultMessage = `## 🔍 AI Detectie Scan Resultaten\n\n`;
      resultMessage += `**AI Score:** ${aiScore}% ${aiScore < 5 ? '✅ Uitstekend' : aiScore < 20 ? '⚠️ Gemiddeld' : '❌ Hoog'}\n`;
      resultMessage += `**Originaliteit:** ${originalityScore}%\n`;
      resultMessage += `**Leesbaarheid:** ${readability}%\n\n`;
      
      if (aiScore >= 5) {
        resultMessage += `⚠️ **Let op:** Deze tekst heeft een AI-score van ${aiScore}%. Dit is te hoog voor natuurlijke content.\n\n`;
        resultMessage += `💡 **Tip:** Klik op de "Humanize" button hieronder om de tekst te verbeteren en de AI-score te verlagen.\n`;
      } else {
        resultMessage += `✅ **Goed nieuws:** Deze tekst heeft een lage AI-score en lijkt natuurlijk geschreven!\n`;
      }
      
      if (data.shareUrl) {
        resultMessage += `\n🔗 [Bekijk gedetailleerd rapport op Originality.AI](${data.shareUrl})`;
      }

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: resultMessage,
        createdAt: new Date(),
        model: 'originality-ai',
      };

      setMessages((prev) => [...prev, assistantMessage]);
      toast.success('Scan compleet!');
    } catch (error) {
      console.error('Error scanning text:', error);
      toast.error('Er ging iets mis bij het scannen van de tekst');
    } finally {
      setScanningText(false);
    }
  };

  const handleHumanizeText = async () => {
    if (!input.trim()) {
      toast.error('Voer tekst in om te verbeteren');
      return;
    }
    if (humanizingText || isLoading) return;

    setHumanizingText(true);

    try {
      const response = await fetch('/api/client/originality/humanize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content: input,
          isHtml: false 
        }),
      });

      if (!response.ok) {
        throw new Error('Fout bij humanizen tekst');
      }

      const data = await response.json();
      
      // Create a message with humanized text
      let resultMessage = `## ✨ Gehumaniseerde Tekst\n\n`;
      resultMessage += `${data.humanizedText}\n\n`;
      resultMessage += `---\n\n`;
      resultMessage += `**Verbeteringen:**\n`;
      resultMessage += `- AI-patronen verwijderd\n`;
      resultMessage += `- Natuurlijker taalgebruik\n`;
      resultMessage += `- WritgoAI schrijfregels toegepast\n\n`;
      resultMessage += `💡 Je kunt deze tekst nu opnieuw scannen om de verbetering te zien!`;

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: resultMessage,
        createdAt: new Date(),
        model: 'originality-ai',
      };

      setMessages((prev) => [...prev, assistantMessage]);
      
      // Replace input with humanized text
      setInput(data.humanizedText);
      
      toast.success('Tekst verbeterd!');
    } catch (error) {
      console.error('Error humanizing text:', error);
      toast.error('Er ging iets mis bij het verbeteren van de tekst');
    } finally {
      setHumanizingText(false);
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    
    if (text && text.length > 10) {
      setSelectedText(text);
      
      // Get selection position
      const range = selection?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();
      
      if (rect) {
        setSelectionPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 10,
        });
        setShowSelectionMenu(true);
      }
    } else {
      setShowSelectionMenu(false);
    }
  };

  const handleHumanizeSelection = async () => {
    if (!selectedText || humanizingText) return;

    setShowSelectionMenu(false);
    setHumanizingText(true);

    try {
      const response = await fetch('/api/client/originality/humanize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content: selectedText,
          isHtml: false 
        }),
      });

      if (!response.ok) {
        throw new Error('Fout bij humanizen geselecteerde tekst');
      }

      const data = await response.json();
      
      // Create a message with the humanized selection
      let resultMessage = `## ✨ Geselecteerde Tekst Gehumaniseerd\n\n`;
      resultMessage += `**Origineel:**\n${selectedText}\n\n`;
      resultMessage += `---\n\n`;
      resultMessage += `**Verbeterd:**\n${data.humanizedText}\n\n`;
      resultMessage += `---\n\n`;
      resultMessage += `💡 **Tip:** Kopieer de verbeterde tekst en vervang het origineel in je document.`;

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: resultMessage,
        createdAt: new Date(),
        model: 'originality-ai',
      };

      setMessages((prev) => [...prev, assistantMessage]);
      
      toast.success('Selectie verbeterd!');
      setSelectedText('');
    } catch (error) {
      console.error('Error humanizing selection:', error);
      toast.error('Er ging iets mis bij het verbeteren van de selectie');
    } finally {
      setHumanizingText(false);
    }
  };

  // Blog Writing Handlers
  const handleAddImage = () => {
    setShowImageSelector(true);
  };

  const handleSelectImage = (imageUrl: string) => {
    const imageMarkdown = `\n\n![Blog afbeelding](${imageUrl})\n\n`;
    setInput(prev => prev + imageMarkdown);
    toast.success('Afbeelding toegevoegd!');
  };

  const handleAddProduct = () => {
    setShowProductSelector(true);
  };

  const handleSelectProduct = (product: any) => {
    const productMarkdown = `\n\n### 🛒 Aanbevolen Product: ${product.title}\n\n${product.summary || ''}\n\n**Prijs:** ${product.price}\n\n[Bekijk op Bol.com](${product.productUrl})\n\n`;
    setInput(prev => prev + productMarkdown);
  };

  const handleAddLink = () => {
    setShowLinkSelector(true);
  };

  const handleSelectLink = (link: any) => {
    const linkMarkdown = `[${link.title || 'Link'}](${link.url})`;
    setInput(prev => prev + linkMarkdown);
  };

  const handleInsertBlogTemplate = () => {
    const template = `# [Jouw Blog Titel Hier]

## Inleiding

Start met een boeiende opening die de lezer direct aanspreekt...

## Hoofdpunt 1

Verdiep je in het eerste belangrijke punt...

### Subpunt 1.1

Details en voorbeelden...

## Hoofdpunt 2

Behandel het volgende onderwerp...

## Conclusie

Sluit af met een krachtige conclusie en call-to-action...

---

*Geschreven met WritgoAI Chat - Blog Writing Mode*
`;
    setInput(template);
    toast.success('Blog template ingevoegd!');
  };

  const handleSend = async () => {
    if (!input.trim() && pendingAttachments.length === 0) return;
    if (isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      attachments: pendingAttachments.length > 0 ? pendingAttachments : undefined,
      createdAt: new Date(),
      model: selectedModel,
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    const currentTemplateOptions = templateOptions;
    setInput('');
    setPendingAttachments([]);
    setTemplateOptions(null); // Reset for next message
    setIsLoading(true);
    setStreamingContent('');

    try {
      const response = await fetch('/api/client/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          message: currentInput,
          model: selectedModel,
          attachments: pendingAttachments.length > 0 ? pendingAttachments : undefined,
          chatSettings, // GPT-5.1 settings
        }),
      });

      if (!response.ok) {
        throw new Error('Fout bij versturen bericht');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let streamComplete = false;

      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            // Process remaining data even if done is true
            if (value) {
              const chunk = decoder.decode(value, { stream: !done });
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (line.trim() === '') continue;
                
                if (line.startsWith('data: ')) {
                  const data = line.slice(6).trim();
                  
                  if (data === '[DONE]') {
                    streamComplete = true;
                  } else {
                    try {
                      const parsed = JSON.parse(data);
                      if (parsed.content) {
                        fullContent += parsed.content;
                        setStreamingContent(fullContent);
                      }
                    } catch (e) {
                      // Try to use data directly if not JSON
                      if (data && data !== '[DONE]') {
                        console.warn('Could not parse chunk:', data.substring(0, 50));
                      }
                    }
                  }
                }
              }
            }
            
            if (done) break;
          }
        } catch (streamError) {
          console.error('Stream reading error:', streamError);
          toast.error('Verbinding onderbroken, maar inhoud is opgeslagen');
        }
        
        // Always save the content we received, even if stream was interrupted
        if (fullContent.length > 0 || streamComplete) {
          const codeBlocks = extractCodeBlocks(fullContent);
          let finalContent = fullContent;
          
          // Add Bol.com products if requested
          if (currentTemplateOptions?.includeBolcomProducts && currentTemplateOptions?.searchQuery) {
            toast.loading('Producten ophalen...', { id: 'bolcom-products' });
            try {
              const productsResponse = await fetch('/api/client/chat/enrich-with-products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  content: fullContent,
                  searchQuery: currentTemplateOptions.searchQuery,
                  templateId: currentTemplateOptions.templateId,
                }),
              });
              
              if (productsResponse.ok) {
                const productsData = await productsResponse.json();
                finalContent = productsData.enrichedContent || fullContent;
                toast.success(`${productsData.productsAdded || 0} producten toegevoegd!`, { id: 'bolcom-products' });
              } else {
                toast.error('Kon producten niet toevoegen', { id: 'bolcom-products' });
              }
            } catch (error) {
              console.error('Error adding products:', error);
              toast.error('Fout bij toevoegen producten', { id: 'bolcom-products' });
            }
          }
          
          const assistantMessage: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: finalContent,
            codeBlocks: codeBlocks.length > 0 ? codeBlocks : undefined,
            createdAt: new Date(),
            model: selectedModel,
          };
          setMessages((prev) => [...prev, assistantMessage]);
          setStreamingContent('');
          if (onNewMessage) {
            onNewMessage(assistantMessage);
          }
        }
      }
    } catch (error: any) {
      console.error('Send error:', error);
      toast.error(error.message || 'Kon bericht niet versturen');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUploaded = (file: any) => {
    setPendingAttachments((prev) => [...prev, file]);
  };

  const handleRemoveAttachment = (index: number) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Estimate token count for context indicator
  const estimateTokens = () => {
    // Rough estimation: ~4 characters per token
    let total = 0;
    messages.forEach(msg => {
      total += Math.ceil(msg.content.length / 4);
    });
    return total;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Minimale Header - ChatGPT stijl, mobiel geoptimaliseerd */}
      <div className="border-b px-2 sm:px-4 py-2 flex items-center justify-between bg-background">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
          </div>
          <h2 className="font-semibold text-sm sm:text-base truncate">WritGo AI</h2>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Settings Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1 sm:gap-1.5 text-xs h-7 sm:h-8 px-2 sm:px-3">
                <Settings2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-xs">{selectedModel}</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="text-sm">AI Instellingen</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* Model Selection */}
              <div className="p-2">
                <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Model</label>
                <ModelSelector
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                />
              </div>
              
              <DropdownMenuSeparator />
              
              {/* Personality */}
              <div className="p-2">
                <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Persoonlijkheid</label>
                <PersonalitySelector
                  value={chatSettings.personality}
                  onChange={(personality) => setChatSettings(prev => ({ ...prev, personality }))}
                />
              </div>
              
              {/* Reasoning Mode */}
              <div className="p-2">
                <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Denkmodus</label>
                <ReasoningModeSelector
                  value={chatSettings.reasoningMode}
                  onChange={(reasoningMode) => setChatSettings(prev => ({ ...prev, reasoningMode }))}
                />
              </div>
              
              {/* Temperature */}
              <div className="p-2">
                <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Creativiteit</label>
                <TemperatureSlider
                  value={chatSettings.temperature}
                  onChange={(temperature) => setChatSettings(prev => ({ ...prev, temperature }))}
                />
              </div>
              
              <DropdownMenuSeparator />
              
              {/* Web Search */}
              <div className="p-2">
                <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Web Zoeken</label>
                <WebSearchToggle
                  enabled={chatSettings.webSearchEnabled}
                  onChange={(webSearchEnabled) => setChatSettings(prev => ({ ...prev, webSearchEnabled }))}
                />
              </div>
              
              {/* Canvas Mode */}
              <div className="p-2">
                <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Canvas Modus</label>
                <CanvasModeToggle
                  enabled={chatSettings.canvasModeEnabled}
                  onToggle={(canvasModeEnabled) => setChatSettings(prev => ({ ...prev, canvasModeEnabled }))}
                />
              </div>
              
              {/* Artifacts Mode - Only for Claude */}
              {supportsArtifacts(selectedModel) && (
                <div className="p-2">
                  <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Artifacts (Claude)</label>
                  <ArtifactsModeToggle
                    enabled={chatSettings.artifactsMode}
                    onChange={(artifactsMode) => setChatSettings(prev => ({ ...prev, artifactsMode }))}
                  />
                </div>
              )}
              
              <DropdownMenuSeparator />
              
              {/* Blog Writing Mode */}
              <div className="p-2">
                <label className="text-xs font-medium mb-1.5 block text-muted-foreground flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  Blog Writing Mode
                </label>
                <Button
                  variant={blogWritingMode ? "default" : "outline"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setBlogWritingMode(!blogWritingMode)}
                >
                  {blogWritingMode ? "Geactiveerd" : "Activeren"}
                </Button>
                {blogWritingMode && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Blog tools zijn nu beschikbaar
                  </p>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Context Indicator (always visible) */}
          <ContextIndicator
            messageCount={messages.length}
            estimatedTokens={estimateTokens()}
            modelId={selectedModel}
          />
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-2 sm:p-4">
        <div 
          className="space-y-4 sm:space-y-6 max-w-5xl mx-auto"
          onMouseUp={handleTextSelection}
        >
          {loadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Gesprek laden...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full px-4">
              <div className="text-center max-w-md">
                <div className="p-3 sm:p-4 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">Welkom bij WritGo AI Assistent</h3>
                <p className="text-sm text-muted-foreground mb-3 sm:mb-4">
                  Ik kan je helpen met:
                </p>
                <div className="text-left space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                  <p>✍️ <strong>Content schrijven</strong> - Blogs, artikelen, productbeschrijvingen</p>
                  <p>🔗 <strong>Affiliate marketing</strong> - Strategieën en content voor bol.com links</p>
                  <p>🌐 <strong>Website projecten</strong> - WordPress, WooCommerce, SEO advies</p>
                  <p>📊 <strong>Social media</strong> - Posts, planning en strategie</p>
                  <p>💬 <strong>Algemene vragen</strong> - Over WritGo diensten en functionaliteit</p>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-4">
                  Stel me gerust een vraag om te beginnen!
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-2 sm:gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0">
                  <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                    <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </div>
                </div>
              )}

              <Card
                className={`p-3 sm:p-4 max-w-full ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mb-3">
                    <FileAttachments files={message.attachments} />
                  </div>
                )}

                <div className="max-w-none">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={MarkdownComponents}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>

                {/* Action buttons for assistant messages - Mobiel geoptimaliseerd */}
                {message.role === 'assistant' && (
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-border/50">
                    {/* Save to Library Button */}
                    {message.content.length > 50 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSaveToLibrary(message.content)}
                        disabled={savingToLibrary}
                        className="text-[10px] sm:text-xs h-6 sm:h-7 px-2 bg-gradient-to-r from-green-500/10 to-green-600/10 hover:from-green-500/20 hover:to-green-600/20 border-green-500/30"
                      >
                        {savingToLibrary ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Save className="w-3 h-3 sm:mr-1" />
                        )}
                        <span className="hidden sm:inline">Opslaan</span>
                      </Button>
                    )}
                    
                    {/* Publish to WordPress Button */}
                    {message.content.length > 100 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePublishToWordPress(message.content)}
                        disabled={publishingToWordPress}
                        className="text-[10px] sm:text-xs h-6 sm:h-7 px-2 bg-gradient-to-r from-blue-500/10 to-blue-600/10 hover:from-blue-500/20 hover:to-blue-600/20 border-blue-500/30"
                      >
                        {publishingToWordPress ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Globe className="w-3 h-3 sm:mr-1" />
                        )}
                        <span className="hidden sm:inline">WordPress</span>
                      </Button>
                    )}
                    
                    {chatSettings.canvasModeEnabled && message.content.length > 100 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setCurrentCanvasContent(message.content);
                          setShowCanvasEditor(true);
                        }}
                        className="text-[10px] sm:text-xs h-6 sm:h-7 px-2"
                      >
                        <PenToolIcon className="w-3 h-3 sm:mr-1" />
                        <span className="hidden sm:inline">Bewerk in Canvas</span>
                      </Button>
                    )}
                    {message.content.includes('![') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // Extract image URL from markdown
                          const imgMatch = message.content.match(/!\[.*?\]\((.*?)\)/);
                          if (imgMatch && imgMatch[1]) {
                            setCurrentImageUrl(imgMatch[1]);
                            setShowImageEditor(true);
                          }
                        }}
                        className="text-[10px] sm:text-xs h-6 sm:h-7 px-2"
                      >
                        <ImageIcon className="w-3 h-3 sm:mr-1" />
                        <span className="hidden sm:inline">Bewerk afbeelding</span>
                      </Button>
                    )}
                  </div>
                )}

                {message.codeBlocks && message.codeBlocks.length > 0 && (
                  <div className="mt-3">
                    <CodeCanvas codeBlocks={message.codeBlocks} />
                    {/* Show live preview button for web code (HTML/CSS/JS) only */}
                    {hasWebCode(message.codeBlocks) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const { html, css, js } = extractWebCode(message.codeBlocks || []);
                          setCurrentCodeHtml(html);
                          setCurrentCodeCss(css);
                          setCurrentCodeJs(js);
                          setShowCodePreview(true);
                        }}
                        className="mt-2 text-xs bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 border-blue-500/30"
                      >
                        <svg className="w-3 h-3 mr-1.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Live Preview in Canvas
                      </Button>
                    )}
                  </div>
                )}
              </Card>

              {message.role === 'user' && (
                <div className="flex-shrink-0">
                  <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-primary flex items-center justify-center">
                    <User className="h-3 w-3 sm:h-4 sm:w-4 text-primary-foreground" />
                  </div>
                </div>
              )}
            </div>
              ))}
            </>
          )}

          {/* Streaming message */}
          {streamingContent && (
            <div className="flex gap-2 sm:gap-3 justify-start">
              <div className="flex-shrink-0">
                <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-white animate-pulse" />
                </div>
              </div>
              <Card className="p-3 sm:p-4 max-w-full bg-muted">
                <div className="max-w-none">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={MarkdownComponents}
                  >
                    {streamingContent}
                  </ReactMarkdown>
                </div>
              </Card>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="border-t p-2 sm:p-4 bg-background">
        <div className="max-w-5xl mx-auto">
          {/* Content Templates - Only show when no messages */}
          {messages.length === 0 && (
            <div className="mb-3">
              <ContentTemplates
                onSelectTemplate={(prompt, options) => {
                  setInput(prompt);
                  if (options) {
                    setTemplateOptions(options);
                    if (options.includeBolcomProducts) {
                      toast.success('Template geladen! Producten worden automatisch toegevoegd.');
                    } else {
                      toast.success('Template geladen! Klik op verstuur om te genereren.');
                    }
                  } else {
                    setTemplateOptions(null);
                    toast.success('Template geladen! Klik op verstuur om te genereren.');
                  }
                }}
              />
            </div>
          )}

          {pendingAttachments.length > 0 && (
            <div className="mb-3">
              <FileAttachments
                files={pendingAttachments}
                onRemove={handleRemoveAttachment}
                removable
              />
            </div>
          )}

          {/* Action buttons row above input - Responsive */}
          <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-2">
            <FileUploadButton
              conversationId={conversationId}
              onFileUploaded={handleFileUploaded}
              disabled={isLoading}
            />
            
            <Button
              onClick={handleGenerateImageFromInput}
              disabled={isLoading || !input.trim()}
              size="sm"
              variant="ghost"
              className="h-7 sm:h-8 px-1.5 sm:px-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/30"
              title="Genereer een afbeelding op basis van je beschrijving"
            >
              <ImageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1.5" />
              <span className="text-[10px] sm:text-xs font-medium hidden sm:inline">Afbeelding</span>
            </Button>
            
            <Button
              onClick={handleScanText}
              disabled={scanningText || isLoading || !input.trim()}
              size="sm"
              variant="ghost"
              className="h-7 sm:h-8 px-1.5 sm:px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30"
              title="Scan tekst op AI-detectie"
            >
              {scanningText ? (
                <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1.5 animate-spin" />
              ) : (
                <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1.5" />
              )}
              <span className="text-[10px] sm:text-xs font-medium hidden sm:inline">AI Check</span>
            </Button>
            
            <Button
              onClick={handleHumanizeText}
              disabled={humanizingText || isLoading || !input.trim()}
              size="sm"
              variant="ghost"
              className="h-7 sm:h-8 px-1.5 sm:px-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/30"
              title="Verbeter tekst en verlaag AI-score"
            >
              {humanizingText ? (
                <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1.5 animate-spin" />
              ) : (
                <Wand2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1.5" />
              )}
              <span className="text-[10px] sm:text-xs font-medium hidden sm:inline">Humanize</span>
            </Button>
            
            <div className="flex-1 min-w-[20px]" />
            
            <Button
              onClick={handleSend}
              disabled={isLoading || (!input.trim() && pendingAttachments.length === 0)}
              size="sm"
              className="h-7 sm:h-8 px-2 sm:px-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin sm:mr-1.5" />
              ) : (
                <Send className="h-3 w-3 sm:h-3.5 sm:w-3.5 sm:mr-1.5" />
              )}
              <span className="text-[10px] sm:text-xs font-medium hidden sm:inline">Verstuur</span>
            </Button>
          </div>

          {/* Blog Writing Toolbar */}
          {blogWritingMode && (
            <div className="mt-3 mb-2">
              <BlogToolbar
                onAddImage={handleAddImage}
                onAddProduct={handleAddProduct}
                onAddLink={handleAddLink}
                onInsertBlogTemplate={handleInsertBlogTemplate}
                disabled={isLoading}
              />
            </div>
          )}

          {/* Input textarea - borderless and clean, mobiel geoptimaliseerd */}
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Typ je bericht..."
            className="flex-1 min-h-[50px] sm:min-h-[60px] max-h-[150px] sm:max-h-[200px] resize-none border-none shadow-none focus-visible:ring-0 px-0 py-2 text-sm sm:text-base bg-transparent"
            disabled={isLoading}
            rows={2}
          />

          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2">
            De AI kan fouten maken. Controleer belangrijke informatie.
          </p>
        </div>
      </div>

      {/* Image Editor Modal */}
      {showImageEditor && (
        <ImageEditor
          imageUrl={currentImageUrl}
          onEdit={handleEditImage}
          onClose={() => setShowImageEditor(false)}
        />
      )}

      {/* Canvas Editor Modal */}
      {showCanvasEditor && (
        <CanvasEditor
          initialContent={currentCanvasContent}
          onSave={handleSaveCanvas}
          onRefine={handleRefineCanvas}
          onClose={() => setShowCanvasEditor(false)}
        />
      )}

      {/* Code Preview Canvas Modal */}
      {showCodePreview && (
        <CodePreviewCanvas
          initialHtml={currentCodeHtml}
          initialCss={currentCodeCss}
          initialJs={currentCodeJs}
          onSave={handleSaveCode}
          onRefine={handleRefineCode}
          onClose={() => setShowCodePreview(false)}
        />
      )}

      {/* Text Selection Menu */}
      {showSelectionMenu && selectionPosition && (
        <div
          className="fixed z-50 animate-in fade-in-0 zoom-in-95"
          style={{
            left: `${selectionPosition.x}px`,
            top: `${selectionPosition.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <Card className="p-2 shadow-lg border-2 border-purple-500 bg-background">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleHumanizeSelection}
                disabled={humanizingText}
                className="h-8 px-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
              >
                {humanizingText ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                ) : (
                  <Wand2 className="h-3 w-3 mr-1.5" />
                )}
                <span className="text-xs font-medium">Dit gedeelte is AI - Humanize</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowSelectionMenu(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Blog Writing Dialogs */}
      <BlogProductSelector
        open={showProductSelector}
        onClose={() => setShowProductSelector(false)}
        onSelectProduct={handleSelectProduct}
      />

      <BlogLinkSelector
        open={showLinkSelector}
        onClose={() => setShowLinkSelector(false)}
        onSelectLink={handleSelectLink}
        projectId={selectedProjectId}
      />

      <ImageSelectorModal
        open={showImageSelector}
        onClose={() => setShowImageSelector(false)}
        onSelect={handleSelectImage}
        projectId={selectedProjectId}
      />
    </div>
  );
}