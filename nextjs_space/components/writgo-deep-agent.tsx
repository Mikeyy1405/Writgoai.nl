'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sparkles,
  Send,
  Loader2,
  User,
  Bot,
  Settings,
  Plus,
  Pin,
  Trash2,
  Edit2,
  Edit3,
  Check,
  X,
  ChevronLeft,
  Menu,
  Download,
  ExternalLink,
  FileText,
  Share2,
  ChevronDown,
  Star,
  Image as ImageIcon,
  Video,
  MessageSquare,
  Smartphone,
  Globe,
  Linkedin,
  Facebook,
  Twitter,
  Play,
  LogOut,
  CreditCard,
  Calendar,
  Zap,
  Library,
  Search,
  Code,
} from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CreditDisplay from './credit-display';
import CreditPaywall from './credit-paywall';
import BlogCanvas from './blog-canvas';
import CodeCanvas from './code-canvas';

// WritgoAI brand colors - Dark Theme (Optie 2)
const BRAND_COLORS = {
  black: '#000000',
  orange: '#FF8C00', // WritgoAI oranje
  orangeLight: '#FFA500',
  white: '#FFFFFF',
  background: '#1a1a1a', // Donkergrijs (niet puur zwart)
  backgroundSoft: '#2d2d2d', // Iets lichter grijs
  cardBg: '#2d2d2d', // Donkergrijze cards
  border: '#404040', // Donkere borders
  textPrimary: '#FFFFFF', // Witte tekst op donkere achtergrond
  textSecondary: '#B0B0B0', // Lichtgrijs voor secondary text
  textMuted: '#808080', // Grijs voor muted text
  gray: {
    50: '#0F172A',
    100: '#1E293B',
    200: '#334155',
    300: '#475569',
    400: '#64748B',
    500: '#94A3B8',
    600: '#CBD5E1',
    700: '#E2E8F0',
    800: '#F1F5F9',
    900: '#F8FAFC',
  }
};

// 🔗 Linkify function - automatically detect and convert URLs to Markdown links
function linkifyText(text: string): string {
  if (!text || typeof text !== 'string') return text;
  
  // Pattern for Google Maps URLs (prioritize these)
  const mapsPattern = /(https?:\/\/(?:www\.)?google\.(?:com|nl)\/maps[^\s<>\)\]]*)/gi;
  
  // Pattern for regular URLs (avoid already linked ones)
  const urlPattern = /(https?:\/\/[^\s<>\)\]]+)/gi;
  
  // Pattern for email addresses
  const emailPattern = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
  
  let result = text;
  
  // First, linkify Google Maps URLs with special icon
  const mapsUrls = new Set<string>();
  result = result.replace(mapsPattern, (match) => {
    // Check if already in a Markdown link
    const beforeMatch = text.substring(0, text.indexOf(match));
    if (beforeMatch.endsWith('](') || beforeMatch.endsWith('[')) {
      return match;
    }
    mapsUrls.add(match);
    return `[📍 Route starten](${match})`;
  });
  
  // Then, linkify regular URLs (skip maps URLs we already handled)
  result = result.replace(urlPattern, (match) => {
    // Skip if already handled as maps URL
    if (mapsUrls.has(match)) return match;
    
    // Check if already in a Markdown link
    const beforeMatch = text.substring(0, text.indexOf(match));
    if (beforeMatch.endsWith('](') || beforeMatch.endsWith('[')) {
      return match;
    }
    
    // Extract domain for link text
    try {
      const url = new URL(match);
      const domain = url.hostname.replace('www.', '');
      return `[🌐 ${domain}](${match})`;
    } catch {
      return `[🌐 Website](${match})`;
    }
  });
  
  // Linkify email addresses
  result = result.replace(emailPattern, (match) => {
    // Check if already in a Markdown link
    const beforeMatch = text.substring(0, text.indexOf(match));
    if (beforeMatch.endsWith('](') || beforeMatch.endsWith('[') || beforeMatch.endsWith('mailto:')) {
      return match;
    }
    return `[📧 ${match}](mailto:${match})`;
  });
  
  return result;
}

// TYPOGRAPHY STYLES - Dark Theme (Optie 2)
const TYPOGRAPHY_STYLES = `
  /* 🔥 FIX: Gekopieerde tekst is ZWART, niet wit */
  * {
    -webkit-user-select: text !important;
    user-select: text !important;
  }
  
  *::selection {
    background-color: #FF8C00 !important;
    color: #000000 !important; /* Zwarte tekst bij selectie */
  }
  
  .prose-chat {
    font-size: 16px !important;
    line-height: 1.8 !important;
    color: #FFFFFF !important; /* Witte tekst op donkere achtergrond */
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  .prose-chat p {
    margin: 20px 0 !important;
    font-size: 16px !important;
    line-height: 1.8 !important;
    color: #FFFFFF !important;
  }
  
  /* Extra spacing after paragraphs before headers */
  .prose-chat p + h2,
  .prose-chat p + h3,
  .prose-chat ul + h2,
  .prose-chat ul + h3 {
    margin-top: 32px !important;
  }
  
  .prose-chat h1 {
    font-size: 28px !important;
    font-weight: 700 !important;
    margin: 24px 0 16px !important;
    color: #FFFFFF !important;
  }
  
  .prose-chat h2 {
    font-size: 24px !important;
    font-weight: 600 !important;
    margin: 20px 0 12px !important;
    color: #FFFFFF !important;
  }
  
  .prose-chat h3 {
    font-size: 20px !important;
    font-weight: 600 !important;
    margin: 16px 0 10px !important;
    color: #FFFFFF !important;
  }
  
  .prose-chat ul, .prose-chat ol {
    margin: 20px 0 !important;
    padding-left: 32px !important;
  }
  
  .prose-chat li {
    margin: 12px 0 !important;
    font-size: 16px !important;
    line-height: 1.8 !important;
    color: #FFFFFF !important;
  }
  
  .prose-chat li::marker {
    color: #FF8C00 !important;
    font-weight: 600 !important;
  }
  
  /* Nested lists */
  .prose-chat li > ul,
  .prose-chat li > ol {
    margin: 8px 0 !important;
  }
  
  /* Strong text in lists */
  .prose-chat li strong {
    color: #FF8C00 !important;
    font-weight: 600 !important;
  }
  
  .prose-chat strong {
    font-weight: 600 !important;
    color: #FF8C00 !important; /* Oranje voor emphasis */
  }
  
  .prose-chat code {
    background: #2d2d2d !important;
    color: #FF8C00 !important;
    padding: 3px 8px !important;
    border-radius: 6px !important;
    font-size: 14px !important;
    font-family: 'Monaco', 'Menlo', monospace !important;
    border: 1px solid #404040 !important;
  }
  
  .prose-chat pre {
    background: #2d2d2d !important;
    padding: 16px !important;
    border-radius: 12px !important;
    overflow-x: auto !important;
    border: 1px solid #404040 !important;
    margin: 16px 0 !important;
  }
  
  .prose-chat pre code {
    background: transparent !important;
    padding: 0 !important;
    border: none !important;
    color: #00FF00 !important; /* Groene code voor terminal look */
  }
  
  .prose-chat blockquote {
    border-left: 4px solid #FF8C00 !important;
    background: rgba(255, 140, 0, 0.05) !important;
    padding: 16px !important;
    padding-left: 20px !important;
    margin: 24px 0 !important;
    border-radius: 8px !important;
    font-style: italic !important;
    color: #E0E0E0 !important;
  }
  
  /* Citation/Source styling */
  .prose-chat blockquote footer,
  .prose-chat blockquote cite {
    display: block !important;
    margin-top: 8px !important;
    font-size: 14px !important;
    color: #B0B0B0 !important;
    font-style: normal !important;
  }
  
  .prose-chat blockquote footer::before {
    content: "— " !important;
  }
  
  .prose-chat table {
    width: 100% !important;
    margin: 16px 0 !important;
    border-collapse: collapse !important;
  }
  
  .prose-chat th, .prose-chat td {
    padding: 12px !important;
    border: 1px solid #404040 !important;
    text-align: left !important;
    color: #FFFFFF !important;
  }
  
  .prose-chat th {
    background: #2d2d2d !important;
    font-weight: 600 !important;
  }
  
  .prose-chat a {
    color: #FF8C00 !important;
    text-decoration: none !important;
    border-bottom: 1px solid #FF8C00 !important;
    transition: all 0.2s !important;
    padding: 2px 4px !important;
    border-radius: 4px !important;
  }
  
  .prose-chat a:hover {
    background: rgba(255, 140, 0, 0.1) !important;
    border-bottom-color: #FFA500 !important;
  }
  
  /* Special styling for external links with icons */
  .prose-chat a[href^="http"]::after {
    content: " ↗" !important;
    font-size: 0.8em !important;
    opacity: 0.6 !important;
  }
  
  .prose-chat a[href^="tel:"]::before {
    content: "📞 " !important;
  }
  
  .prose-chat a[href*="google.com/maps"]::before {
    content: "📍 " !important;
  }
  
  .prose-chat hr {
    border: none !important;
    border-top: 2px solid #404040 !important;
    margin: 32px 0 !important;
    opacity: 0.5 !important;
  }
  
  .prose-chat img {
    max-width: 100% !important;
    height: auto !important;
    border-radius: 12px !important;
    margin: 24px 0 !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
  }
  
  /* File upload cards - donker thema */
  .file-upload-card {
    background: #2d2d2d !important;
    border: 2px dashed #404040 !important;
    border-radius: 12px !important;
    padding: 16px !important;
    margin: 8px 0 !important;
    display: flex;
    align-items: center;
    gap: 12px;
    transition: all 0.2s !important;
  }
  
  .file-upload-card:hover {
    background: #3d3d3d !important;
    border-color: #FF8C00 !important;
  }
  
  .file-icon {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
  }
  
  .file-info {
    flex: 1;
  }
  
  .file-name {
    font-size: 15px;
    font-weight: 500;
    color: #FFFFFF;
    margin-bottom: 4px;
  }
  
  .file-meta {
    font-size: 13px;
    color: #B0B0B0;
  }
`;

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string | any[]; // Can be string or array for vision messages
  createdAt?: Date;
  toolsUsed?: Array<{ tool: string; args: any }>;
  iterations?: number;
  images?: string[];
  videos?: Array<{ 
    id: string; 
    url?: string; 
    status?: string;
    thumbnailUrl?: string;
    topic?: string;
    script?: string;
    duration?: string;
    language?: string;
    voice?: string;
    theme?: string;
  }>;
  model?: string;
  modelsUsed?: Array<{ model: string; purpose: string }>;
  youtubeVideos?: Array<{ videoId: string; title: string; url: string }>;
  suggestions?: QuickOption[];
  metadata?: {
    taskType?: 'blog' | 'video' | 'social' | 'general';
    selectedOptions?: Record<string, any>;
    modelTier?: 'premium' | 'balanced' | 'budget';
    modelReasoning?: string;
  };
}

interface QuickOption {
  id: string;
  label: string;
  value: any;
  category: string;
  icon?: string;
  description?: string;
}

interface Conversation {
  id: string;
  title: string;
  lastMessageAt: Date;
  isPinned: boolean;
  messages: Message[];
  _count?: { messages: number };
}

type ToolMode = 
  | 'home'           // Startscherm met alle tools
  | 'chat'           // Algemene chatbot
  | 'blog'           // Blog/artikel schrijven
  | 'social'         // Social media posts
  | 'video'          // Video generatie
  | 'keyword'        // Keyword research
  | 'research';      // Web research

interface Project {
  id: string;
  name: string;
  websiteUrl: string;
  description?: string;
  niche?: string;
  targetAudience?: string;
  brandVoice?: string;
  keywords: string[];
  contentPillars: string[];
  isPrimary: boolean;
  isActive: boolean;
  sitemapScannedAt?: string;
  createdAt: string;
}

interface AISettings {
  nickname?: string;
  customInstructions?: string;
  preferredModel: string;
  temperature: number;
  enableWebSearch: boolean;
  enableImageGen: boolean;
  enableVideoGen: boolean;
  toneOfVoice?: string;
  writingStyle?: string;
}

interface AgentStatus {
  thinking?: boolean;
  executing?: string;
  progress?: string;
  stage?: 'analyzing' | 'planning' | 'executing' | 'finalizing';
  progressPercent?: number;
  currentStep?: number;
  maxSteps?: number;
  modelInfo?: any;
}

interface StatusLogEntry {
  timestamp: Date;
  type: 'status' | 'tool_start' | 'tool_complete' | 'heartbeat' | 'error';
  message: string;
  icon: string;
  duration?: number;
}

// Chat/LLM models beschikbaar via AIML API
const CHAT_MODELS = [
  // 🔥 NIEUWSTE MODELLEN (2025)
  { value: 'anthropic/claude-sonnet-4.5', label: 'Claude Sonnet 4.5 🚀 (NIEUW)', recommended: true, description: 'Beste voor Nederlandse content - uitstekend voor alles' },
  { value: 'gpt-5-2025-08-07', label: 'GPT-5 🚀', recommended: true, description: 'Nieuwste OpenAI flagship - meest krachtig' },
  { value: 'gpt-5-mini-2025-08-07', label: 'GPT-5 Mini ⚡', recommended: true, description: 'Snelle GPT-5 variant - beste balans' },
  { value: 'gpt-5-nano-2025-08-07', label: 'GPT-5 Nano 💨', description: 'Ultra snelle GPT-5 - perfecte prijs/kwaliteit' },
  
  // 🔥 AANBEVOLEN (BESTAAND)
  { value: 'gpt-4o', label: 'GPT-4o ⭐', recommended: true, description: 'Beste balans: krachtig, snel, betrouwbaar' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash ⚡', recommended: true, description: 'Snelste model met uitstekende kwaliteit' },
  { value: 'google/gemini-3-pro-preview', label: 'Gemini 3 Pro Preview ⭐', recommended: true, description: '1M context - beste voor grote documenten' },
  
  // OpenAI GPT Models
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', description: 'Sneller dan GPT-4, lagere kosten' },
  { value: 'gpt-4', label: 'GPT-4', description: 'Zeer capabel, langzamer' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'Goedkope variant van GPT-4o' },
  { value: 'o1-preview', label: 'OpenAI o1 Preview', description: 'Nieuw reasoning model' },
  { value: 'o1-mini', label: 'OpenAI o1 Mini', description: 'Compact reasoning model' },
  
  // Google Gemini Models (NIEUWSTE)
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro 🆕', description: 'Nieuwste Gemini flagship - meest krachtig' },
  { value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash (Experimental)', description: 'Nieuwste Gemini, zeer snel' },
  { value: 'gemini-1.5-pro-latest', label: 'Gemini 1.5 Pro', description: 'Groot context window (2M tokens)' },
  { value: 'gemini-1.5-flash-latest', label: 'Gemini 1.5 Flash', description: 'Snel en goedkoop' },
  { value: 'gemini-exp-1206', label: 'Gemini Experimental 1206', description: 'Experimental release' },
  
  // Anthropic Claude Models
  { value: 'claude-sonnet-4-5', label: 'Claude 4.5 Sonnet ⭐ NIEUW', description: 'Nieuwste Claude release - beste voor content' },
  { value: 'anthropic/claude-opus-4.1', label: 'Claude Opus 4.1', description: 'Meest capabel Claude model' },
  { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku', description: 'Zeer snel en goedkoop' },
  { value: 'claude-3-7-sonnet-20250219', label: 'Claude 3.7 Sonnet (Legacy)', description: 'Vorige versie - Verouderd' },
  
  // Meta Llama Models
  { value: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B', description: 'Nieuwste open source model' },
  { value: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo', label: 'Llama 3.1 405B', description: 'Grootste open source model' },
  { value: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo', label: 'Llama 3.1 70B', description: 'Snel open source model' },
  
  // Mistral/European Models
  { value: 'mistralai/Mixtral-8x22B-Instruct-v0.1', label: 'Mixtral 8x22B', description: 'Krachtig Europees model' },
  { value: 'mistralai/Mistral-Large-2', label: 'Mistral Large 2', description: 'Mistral flagship model' },
  
  // Specialized Models
  { value: 'deepseek-chat', label: 'DeepSeek Chat', description: 'Excellent voor code en logica' },
  { value: 'deepseek-reasoner', label: 'DeepSeek Reasoner', description: 'Reasoning specialist' },
  { value: 'qwen/qwen-2.5-72b-instruct', label: 'Qwen 2.5 72B', description: 'Chinees top model' },
];

// Smart suggestion generator based on user input
function generateSmartSuggestions(userInput: string): QuickOption[] {
  const input = userInput.toLowerCase();
  const suggestions: QuickOption[] = [];
  
  // Detecteer taak type (specifieke volgorde: afbeelding eerst, dan video, dan blog)
  const isImage = input.includes('afbeelding') || input.includes('foto') || input.includes('image') || 
                  input.includes('picture') || input.includes('genereer een') || 
                  (input.includes('maak') && (input.includes('plaatje') || input.includes('visual')));
  const isVideo = input.includes('video') || input.includes('reel') || input.includes('tiktok') || 
                  input.includes('youtube') || input.includes('short');
  const isBlog = input.includes('blog') || input.includes('artikel') || input.includes('article') || 
                 (input.includes('schrijf') && !isVideo && !isImage);
  const isSocial = input.includes('social') || input.includes('post') || input.includes('instagram') || 
                   input.includes('linkedin') || input.includes('twitter') || input.includes('facebook');
  
  if (isImage) {
    // Afbeelding-specifieke suggesties (GEEN woordaantal, GEEN stem)
    suggestions.push(
      // Stijl
      { id: 'style_realistic', label: 'Realistisch', value: 'realistic', category: 'Stijl', icon: '📸', description: 'Fotorealistische beelden' },
      { id: 'style_cinematic', label: 'Cinematisch', value: 'cinematic', category: 'Stijl', icon: '🎬', description: 'Filmische look' },
      { id: 'style_animated', label: 'Geanimeerd', value: 'animated', category: 'Stijl', icon: '🎨', description: 'Cartoon animatie' },
      { id: 'style_cartoon', label: 'Cartoon', value: 'cartoon', category: 'Stijl', icon: '🎭', description: '2D cartoon stijl' },
      { id: 'style_fantasy', label: 'Fantasy', value: 'fantasy', category: 'Stijl', icon: '✨', description: 'Magische elementen' },
      { id: 'style_digital', label: 'Digital Art', value: 'digital-art', category: 'Stijl', icon: '🖼️', description: 'Moderne digitale kunst' },
      { id: 'style_3d', label: '3D Render', value: '3d', category: 'Stijl', icon: '🎲', description: 'Professionele 3D' },
      
      // Formaat
      { id: 'format_square', label: 'Vierkant 1:1', value: '1:1', category: 'Formaat', icon: '⬜', description: 'Social media' },
      { id: 'format_horizontal', label: 'Horizontaal 16:9', value: '16:9', category: 'Formaat', icon: '🖥️', description: 'Website/Desktop' },
      { id: 'format_vertical', label: 'Verticaal 9:16', value: '9:16', category: 'Formaat', icon: '📱', description: 'Stories/Mobiel' }
    );
  } else if (isVideo) {
    // Video-specifieke suggesties (GEEN woordaantal)
    suggestions.push(
      // Formaat
      { id: 'format_vertical', label: 'Verticaal 9:16', value: '9:16', category: 'Formaat', icon: '📱', description: 'TikTok, Reels, Shorts' },
      { id: 'format_horizontal', label: 'Horizontaal 16:9', value: '16:9', category: 'Formaat', icon: '🖥️', description: 'YouTube' },
      { id: 'format_square', label: 'Vierkant 1:1', value: '1:1', category: 'Formaat', icon: '⬜', description: 'Instagram Feed' },
      
      // Visuele stijl
      { id: 'style_realistic', label: 'Realistisch', value: 'realistic', category: 'Visuele Stijl', icon: '📸', description: 'Fotorealistische beelden' },
      { id: 'style_cinematic', label: 'Cinematisch', value: 'cinematic', category: 'Visuele Stijl', icon: '🎬', description: 'Filmische look' },
      { id: 'style_animated', label: 'Geanimeerd', value: 'animated', category: 'Visuele Stijl', icon: '🎨', description: 'Cartoon animatie' },
      { id: 'style_cartoon', label: 'Cartoon', value: 'cartoon', category: 'Visuele Stijl', icon: '🎭', description: '2D cartoon stijl' },
      { id: 'style_fantasy', label: 'Fantasy', value: 'fantasy', category: 'Visuele Stijl', icon: '✨', description: 'Magische elementen' },
      { id: 'style_digital', label: 'Digital Art', value: 'digital-art', category: 'Visuele Stijl', icon: '🖼️', description: 'Moderne digitale kunst' },
      { id: 'style_3d', label: '3D Render', value: '3d', category: 'Visuele Stijl', icon: '🎲', description: 'Professionele 3D' },
      
      // Voiceover
      { id: 'voice_dutch_male', label: 'Nederlands (Man)', value: 'CwhRBWXzGAHq8TQ4Fs17', category: 'Voiceover', icon: '🇳🇱', description: 'Roger - Casual Nederlands' },
      { id: 'voice_english_female', label: 'Engels (Vrouw)', value: 'EXAVITQu4vr4xnSDxMaL', category: 'Voiceover', icon: '🇬🇧', description: 'Sarah - Confident' },
      { id: 'voice_english_male', label: 'Engels (Man)', value: '2EiwWnXFnvU5JabPnv8n', category: 'Voiceover', icon: '🇺🇸', description: 'Clyde - Character voice' },
      
      // Afbeeldingen aantal
      { id: 'images_3', label: '3 afbeeldingen', value: '3', category: 'Visuele Variatie', icon: '🖼️', description: 'Minimale variatie' },
      { id: 'images_5', label: '5 afbeeldingen', value: '5', category: 'Visuele Variatie', icon: '🎞️', description: 'Standaard (aanbevolen)' },
      { id: 'images_7', label: '7 afbeeldingen', value: '7', category: 'Visuele Variatie', icon: '🎬', description: 'Veel variatie' },
      { id: 'images_10', label: '10 afbeeldingen', value: '10', category: 'Visuele Variatie', icon: '🎥', description: 'Maximale variatie' },
      
      // Muziek
      { id: 'music_yes', label: 'Met achtergrondmuziek', value: 'yes', category: 'Muziek', icon: '🎵', description: 'Voegt sfeer toe' },
      { id: 'music_no', label: 'Geen muziek', value: 'no', category: 'Muziek', icon: '🔇', description: 'Alleen voiceover' }
    );
  } else if (isBlog) {
    // Blog-specifieke suggesties (GEEN stem/voiceover)
    suggestions.push(
      // Woordaantal
      { id: 'words_500', label: '500 woorden', value: '500', category: 'Lengte', icon: '📝', description: 'Kort en bondig' },
      { id: 'words_1000', label: '1000 woorden', value: '1000', category: 'Lengte', icon: '📄', description: 'Standaard blog' },
      { id: 'words_1500', label: '1500 woorden', value: '1500', category: 'Lengte', icon: '📰', description: 'Uitgebreid' },
      { id: 'words_2000', label: '2000+ woorden', value: '2000', category: 'Lengte', icon: '📚', description: 'Diepgaand artikel' },
      
      // Toon
      { id: 'tone_professional', label: 'Professioneel', value: 'professional', category: 'Toon', icon: '💼', description: 'Zakelijk en formeel' },
      { id: 'tone_casual', label: 'Casual', value: 'casual', category: 'Toon', icon: '😊', description: 'Toegankelijk en vriendelijk' },
      { id: 'tone_expert', label: 'Expert', value: 'expert', category: 'Toon', icon: '🎓', description: 'Diepgaand en technisch' },
      
      // SEO
      { id: 'seo_yes', label: 'SEO Geoptimaliseerd', value: 'yes', category: 'SEO', icon: '🔍', description: 'Met keywords en meta' },
      { id: 'seo_no', label: 'Geen SEO', value: 'no', category: 'SEO', icon: '✍️', description: 'Focus op leesbaarheid' },
      
      // Afbeelding
      { id: 'image_yes', label: 'Met afbeelding', value: 'yes', category: 'Afbeelding', icon: '🖼️', description: 'Zoek passende afbeelding' },
      { id: 'image_no', label: 'Geen afbeelding', value: 'no', category: 'Afbeelding', icon: '📝', description: 'Alleen tekst' }
    );
  } else if (isSocial) {
    // Social media suggesties
    suggestions.push(
      // Platform
      { id: 'platform_instagram', label: 'Instagram', value: 'instagram', category: 'Platform', icon: '📸', description: 'Post naar Instagram' },
      { id: 'platform_linkedin', label: 'LinkedIn', value: 'linkedin', category: 'Platform', icon: '💼', description: 'Deel op LinkedIn' },
      { id: 'platform_twitter', label: 'X (Twitter)', value: 'twitter', category: 'Platform', icon: '🐦', description: 'Tweet het' },
      { id: 'platform_facebook', label: 'Facebook', value: 'facebook', category: 'Platform', icon: '👥', description: 'Post op Facebook' },
      
      // Lengte
      { id: 'length_short', label: 'Kort (50-100 woorden)', value: 'short', category: 'Lengte', icon: '💬', description: 'Snel en krachtig' },
      { id: 'length_medium', label: 'Medium (100-200 woorden)', value: 'medium', category: 'Lengte', icon: '📝', description: 'Gebalanceerd' },
      { id: 'length_long', label: 'Lang (200+ woorden)', value: 'long', category: 'Lengte', icon: '📄', description: 'Uitgebreid' },
      
      // Hashtags
      { id: 'hashtags_yes', label: 'Met hashtags', value: 'yes', category: 'Hashtags', icon: '#️⃣', description: 'Inclusief relevante tags' },
      { id: 'hashtags_no', label: 'Geen hashtags', value: 'no', category: 'Hashtags', icon: '✍️', description: 'Pure tekst' }
    );
  }
  
  // Algemene suggesties (alleen als geen specifiek type gedetecteerd)
  if (suggestions.length === 0 || input.length > 10) {
    suggestions.push(
      { id: 'lang_nl', label: 'Nederlands', value: 'nl', category: 'Taal', icon: '🇳🇱', description: 'Nederlandse taal' },
      { id: 'lang_en', label: 'Engels', value: 'en', category: 'Taal', icon: '🇬🇧', description: 'Engelse taal' }
    );
  }
  
  return suggestions;
}

// Helper function to detect if message contains a proposal/concept
function detectProposal(content: string): {
  isProposal: boolean;
  type: 'blog' | 'video' | 'social' | 'general' | null;
  concept?: string;
} {
  const lowerContent = content.toLowerCase();
  
  // Check for blog concepts
  if (lowerContent.includes('onderwerp:') || 
      lowerContent.includes('titel:') ||
      lowerContent.includes('blog concept') ||
      lowerContent.includes('samenvatting:') ||
      (lowerContent.includes('structuur:') && lowerContent.includes('##'))) {
    return { isProposal: true, type: 'blog', concept: content };
  }
  
  // Check for video concepts  
  if (lowerContent.includes('video concept') ||
      lowerContent.includes('script:') ||
      lowerContent.includes('scène') ||
      lowerContent.includes('voiceover:')) {
    return { isProposal: true, type: 'video', concept: content };
  }
  
  // Check for social media concepts
  if (lowerContent.includes('post concept') ||
      lowerContent.includes('social media post') ||
      (lowerContent.includes('caption:') || lowerContent.includes('bijschrift:'))) {
    return { isProposal: true, type: 'social', concept: content };
  }
  
  return { isProposal: false, type: null };
}

export default function WritgoDeepAgent() {
  // Router & Session
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession() || {};
  
  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    name: string;
    type: string;
    url: string;
    size: number;
  }>>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<AgentStatus>({});
  const [clientId, setClientId] = useState<string | null>(null);
  const [aiSettings, setAiSettings] = useState<AISettings | null>(null);
  const [skipAutoLoad, setSkipAutoLoad] = useState(false);
  
  // NEW: AbortController voor stop functionaliteit
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  
  // Status Log voor Canvas/Terminal
  const [statusLog, setStatusLog] = useState<StatusLogEntry[]>([]);
  const [showStatusCanvas, setShowStatusCanvas] = useState(false);
  const [toolStartTimes, setToolStartTimes] = useState<Record<string, number>>({});
  
  // Quick options state
  const [showQuickOptions, setShowQuickOptions] = useState(false);
  const [quickSuggestions, setQuickSuggestions] = useState<QuickOption[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, any>>({});
  
  // 🚀 OPTIMIZATION: Track if data has been loaded to prevent duplicate API calls
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(true); // Chatbot visibility (always open by default)
  
  // WordPress settings
  const [wordpressConfig, setWordpressConfig] = useState<{
    url: string;
    username: string;
    hasPassword: boolean;
  } | null>(null);
  
  // Blog Canvas state (zoals Gemini Artifacts)
  const [showBlogCanvas, setShowBlogCanvas] = useState(false);
  const [blogCanvasContent, setBlogCanvasContent] = useState('');
  const [blogCanvasTitle, setBlogCanvasTitle] = useState('Generated Content');
  const [canvasEditInput, setCanvasEditInput] = useState('');
  const [isEditingCanvas, setIsEditingCanvas] = useState(false);
  const [wpUrl, setWpUrl] = useState('');
  const [wpUsername, setWpUsername] = useState('');
  const [wpPassword, setWpPassword] = useState('');
  
  // Code Canvas state (zoals Gemini 2.5 Pro)
  const [showCodeCanvas, setShowCodeCanvas] = useState(false);
  const [codeCanvasHtml, setCodeCanvasHtml] = useState('');
  const [codeCanvasCss, setCodeCanvasCss] = useState('');
  const [codeCanvasJs, setCodeCanvasJs] = useState('');
  const [codeCanvasTitle, setCodeCanvasTitle] = useState('Code Preview');
  const [codeCanvasDescription, setCodeCanvasDescription] = useState('');
  
  // Late.dev (Social Media) settings
  const [lateDevConnected, setLateDevConnected] = useState(false);
  const [connectedSocialAccounts, setConnectedSocialAccounts] = useState<Array<{
    id: string;
    platform: string;
    name: string;
  }>>([]);
  const [lateDevProfileInfo, setLateDevProfileInfo] = useState<{
    email?: string;
    name?: string;
  } | null>(null);
  
  // Tool mode state
  const [toolMode, setToolMode] = useState<ToolMode>('chat');
  const [keywordResearchResults, setKeywordResearchResults] = useState<any>(null);
  
  // Sidebar volledig verborgen (ChatGPT-stijl: geen sidebar, alleen chat)
  const [showSidebar, setShowSidebar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  
  // Credit state
  const [credits, setCredits] = useState(0);
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [showCreditPaywall, setShowCreditPaywall] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  
  // NEW: Location tracking
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
  } | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  
  // NEW: User memory
  const [userMemory, setUserMemory] = useState<{
    name?: string;
    location?: string;
  }>({});
  
  // Projects state
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  // Clients state (for admin)
  const [clients, setClients] = useState<any[]>([]);
  
  // Smart auto-scroll state
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const lastScrollTop = useRef(0);
  
  // Quick actions
  const [showWordPressDialog, setShowWordPressDialog] = useState(false);
  const [showSocialDialog, setShowSocialDialog] = useState(false);
  const [wpTitle, setWpTitle] = useState('');
  const [wpContent, setWpContent] = useState('');
  const [wpExcerpt, setWpExcerpt] = useState('');
  const [wpFeaturedImage, setWpFeaturedImage] = useState(''); // Featured image URL
  const [wpStatus, setWpStatus] = useState<'publish' | 'draft'>('draft');
  const [socialContent, setSocialContent] = useState('');
  const [socialPlatforms, setSocialPlatforms] = useState<string[]>([]);
  const [socialPublishNow, setSocialPublishNow] = useState(false);
  const [publishingWP, setPublishingWP] = useState(false);
  const [publishingSocial, setPublishingSocial] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Helper: Detect if content should be shown in canvas (like Gemini Artifacts)
  function shouldShowInCanvas(content: string): boolean {
    // DISABLED: Altijd gewoon in chat tonen, nooit in Canvas
    return false;
  }
  
  // Get client ID from NextAuth session
  useEffect(() => {
    if (sessionStatus === 'authenticated' && session?.user?.id) {
      const userId = session.user.id;
      setClientId(userId);
      
      // 🚀 OPTIMIZATION: Only load credits initially (lightweight check)
      // Other data will be lazy-loaded when chatbot is opened
      loadCredits();
    }
  }, [sessionStatus, session]);
  
  // 🚀 LAZY LOADING: Load data only when chatbot is opened
  useEffect(() => {
    if (isOpen && clientId && !dataLoaded) {
      loadConversations(clientId);
      loadSettings(clientId);
      loadWordPressConfig();
      loadLateDevConfig();
      loadProjects();
      loadUserMemory();
      
      // Load clients for admin
      if (session?.user?.email === 'info@WritgoAI.nl' || session?.user?.role === 'admin') {
        loadClients();
      }
      
      setDataLoaded(true);
    }
  }, [isOpen, clientId]);
  
  // ChatGPT-stijl: Bij elke reload start een nieuwe chat (geen auto-load van oude conversaties)
  useEffect(() => {
    // Altijd beginnen met een lege chat bij reload
    // Gebruiker kan handmatig oude chats bekijken via geschiedenis dropdown
    if (clientId && !currentConversation && messages.length === 0) {
      // Start met een welkomstbericht
      const welcomeMessage: Message = {
        id: 'welcome-' + Date.now(),
        role: 'assistant',
        content: 'Hey! Hoe kan ik je vandaag helpen?',
        createdAt: new Date(),
      };
      setMessages([welcomeMessage]);
      setSkipAutoLoad(true);
      localStorage.removeItem('writgo_last_conversation_id');
    }
  }, [clientId, currentConversation, messages.length]);
  
  // Auto-open terminal wanneer AI bezig is
  useEffect(() => {
    if (isGenerating && !showStatusCanvas) {
      // Open terminal automatisch wanneer AI start met genereren
      setShowStatusCanvas(true);
    }
  }, [isGenerating]);
  
  // Load credits
  async function loadCredits() {
    try {
      const res = await fetch('/api/credits/balance');
      if (res.ok) {
        const data = await res.json();
        setCredits(data.totalCredits || 0);
        setIsUnlimited(data.isUnlimited || false);
        // Check of er een actief abonnement is
        setHasActiveSubscription(data.subscriptionPlan ? true : false);
      }
    } catch (e) {
      console.error('Failed to load credits:', e);
    }
  }
  
  // NEW: Request location permission
  async function requestLocation() {
    if (!navigator.geolocation) {
      toast.error('Je browser ondersteunt geen locatie detectie');
      return;
    }
    
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      setLocationPermission(permission.state);
      
      if (permission.state === 'granted' || permission.state === 'prompt') {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation({ latitude, longitude });
            setLocationPermission('granted');
            
            // Reverse geocode to get city name
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
              );
              const data = await response.json();
              
              if (data.address) {
                const city = data.address.city || data.address.town || data.address.village;
                const country = data.address.country;
                
                setUserLocation(prev => ({
                  ...prev!,
                  city,
                  country,
                }));
                
                // Save to memory
                if (clientId && city) {
                  await fetch('/api/client/memory', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      clientId,
                      updates: { location: city, city, country },
                    }),
                  });
                  
                  setUserMemory(prev => ({ ...prev, location: city }));
                  toast.success(`Locatie ingesteld: ${city}, ${country}`);
                }
              }
            } catch (e) {
              console.error('Reverse geocode failed:', e);
            }
          },
          (error) => {
            console.error('Location error:', error);
            setLocationPermission('denied');
            toast.error('Kon locatie niet ophalen. Sta locatietoegang toe in je browser.');
          }
        );
      } else {
        toast.error('Locatietoegang geweigerd. Wijzig dit in je browser instellingen.');
      }
    } catch (e) {
      console.error('Location permission error:', e);
    }
  }
  
  // NEW: Load user memory
  async function loadUserMemory() {
    if (!clientId) return;
    
    try {
      const res = await fetch(`/api/client/memory?clientId=${clientId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.memory) {
          setUserMemory({
            name: data.memory.name,
            location: data.memory.location,
          });
        }
      }
    } catch (e) {
      console.error('Failed to load user memory:', e);
    }
  }
  
  // NEW: Save user name
  async function saveUserName(name: string) {
    if (!clientId) return;
    
    try {
      await fetch('/api/client/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          updates: { name },
        }),
      });
      
      setUserMemory(prev => ({ ...prev, name }));
      toast.success(`Opgeslagen! Ik zal je voortaan ${name} noemen.`);
    } catch (e) {
      console.error('Failed to save name:', e);
      toast.error('Kon naam niet opslaan');
    }
  }
  
  // Load projects
  async function loadProjects() {
    try {
      // Clear any localStorage cache that might interfere
      try {
        localStorage.removeItem('cached_projects');
        localStorage.removeItem('projects_cache');
      } catch (e) {
        console.warn('Could not clear localStorage:', e);
      }
      
      console.log('[WritgoDeepAgent] Loading projects...');
      
      // Ultra-aggressive cache busting
      const cacheBuster = `${Date.now()}-${Math.random()}`;
      const res = await fetch(`/api/client/projects?_t=${cacheBuster}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
      
      if (res.ok) {
        const data = await res.json();
        const projectsList = data.projects || [];
        console.log(`[WritgoDeepAgent] Loaded ${projectsList.length} projects`);
        setProjects(projectsList);
        
        // Auto-select primary project or first project
        const primary = projectsList.find((p: Project) => p.isPrimary && p.isActive);
        const firstActive = projectsList.find((p: Project) => p.isActive);
        
        if (primary || firstActive) {
          console.log(`[WritgoDeepAgent] Auto-selecting project: ${(primary || firstActive).name}`);
          setSelectedProject(primary || firstActive);
        }
      } else {
        console.error('[WritgoDeepAgent] Failed to fetch projects:', res.status);
      }
    } catch (e) {
      console.error('[WritgoDeepAgent] Failed to load projects:', e);
    }
  }
  
  // Load clients (admin only)
  async function loadClients() {
    try {
      const res = await fetch('/api/admin/clients');
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
      }
    } catch (e) {
      console.error('Failed to load clients:', e);
    }
  }
  
  // Load conversations
  async function loadConversations(cId: string) {
    try {
      const res = await fetch(`/api/client/conversations?clientId=${cId}`);
      if (res.ok) {
        const data = await res.json();
        const convos = data.conversations || [];
        setConversations(convos);
      }
    } catch (e) {
      console.error('Failed to load conversations:', e);
    }
  }
  
  // Load AI settings
  async function loadSettings(cId: string) {
    try {
      const res = await fetch(`/api/client/settings?clientId=${cId}`);
      if (res.ok) {
        const data = await res.json();
        setAiSettings(data.settings);
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  }
  
  // Save settings
  async function saveSettings(newSettings: Partial<AISettings>) {
    if (!clientId) return;
    
    try {
      const res = await fetch('/api/client/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          ...newSettings,
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setAiSettings(data.settings);
        toast.success('Instellingen opgeslagen');
      }
    } catch (e) {
      console.error('Failed to save settings:', e);
      toast.error('Kon instellingen niet opslaan');
    }
  }
  
  // Load WordPress config
  async function loadWordPressConfig() {
    try {
      const res = await fetch('/api/client/wordpress-config');
      if (res.ok) {
        const data = await res.json();
        setWordpressConfig(data.config);
        setWpUrl(data.config.url);
        setWpUsername(data.config.username);
      }
    } catch (e) {
      console.error('Failed to load WordPress config:', e);
    }
  }
  
  // Save WordPress config
  async function saveWordPressConfig() {
    if (!wpUrl || !wpUsername) {
      toast.error('URL en username zijn verplicht');
      return;
    }
    
    try {
      const res = await fetch('/api/client/wordpress-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: wpUrl,
          username: wpUsername,
          password: wpPassword || undefined,
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setWordpressConfig(data.config);
        toast.success('WordPress configuratie opgeslagen');
        setWpPassword('');
        loadWordPressConfig();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Kon configuratie niet opslaan');
      }
    } catch (e) {
      console.error('Failed to save WordPress config:', e);
      toast.error('Kon WordPress configuratie niet opslaan');
    }
  }
  
  // Delete WordPress config
  async function deleteWordPressConfig() {
    if (!confirm('Weet je zeker dat je de WordPress configuratie wilt verwijderen?')) {
      return;
    }
    
    try {
      const res = await fetch('/api/client/wordpress-config', {
        method: 'DELETE',
      });
      
      if (res.ok) {
        setWordpressConfig(null);
        setWpUrl('');
        setWpUsername('');
        setWpPassword('');
        toast.success('WordPress configuratie verwijderd');
      }
    } catch (e) {
      console.error('Failed to delete WordPress config:', e);
      toast.error('Kon WordPress configuratie niet verwijderen');
    }
  }
  
  // Load Late.dev config
  async function loadLateDevConfig() {
    try {
      const res = await fetch('/api/client/latedev-config');
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setLateDevConnected(data.config.connected || false);
          setConnectedSocialAccounts(data.config.accounts || []);
          setLateDevProfileInfo(data.config.profileInfo || null);
        }
      }
    } catch (e) {
      console.error('Failed to load Late.dev config:', e);
    }
  }
  
  // Connect to Late.dev - open OAuth flow
  async function connectLateDevAccount() {
    try {
      // Request een invite link van de API
      const res = await fetch('/api/client/latedev/invite', {
        method: 'POST',
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.inviteUrl) {
          // Open de Late.dev OAuth in een nieuw venster
          window.open(data.inviteUrl, '_blank', 'width=600,height=700');
          toast.success('Social media verbinding wordt geopend...');
          
          // Poll voor updates
          const interval = setInterval(async () => {
            const checkRes = await fetch('/api/client/latedev-config');
            if (checkRes.ok) {
              const checkData = await checkRes.json();
              if (checkData.config && checkData.config.accounts?.length > 0) {
                clearInterval(interval);
                loadLateDevConfig();
                toast.success('Social media accounts verbonden!');
              }
            }
          }, 3000);
          
          // Stop met pollen na 5 minuten
          setTimeout(() => clearInterval(interval), 300000);
        }
      } else {
        const error = await res.json();
        toast.error(error.error || 'Kon verbinding niet starten');
      }
    } catch (e) {
      console.error('Failed to connect Late.dev:', e);
      toast.error('Kon Late.dev verbinding niet starten');
    }
  }
  
  // Delete Late.dev config
  async function deleteLateDevConfig() {
    if (!confirm('Weet je zeker dat je de Late.dev configuratie wilt verwijderen?')) {
      return;
    }
    
    try {
      const res = await fetch('/api/client/latedev-config', {
        method: 'DELETE',
      });
      
      if (res.ok) {
        setLateDevConnected(false);
        setConnectedSocialAccounts([]);
        setLateDevProfileInfo(null);
        toast.success('Late.dev configuratie verwijderd');
      }
    } catch (e) {
      console.error('Failed to delete Late.dev config:', e);
      toast.error('Kon Late.dev configuratie niet verwijderen');
    }
  }
  
  // Clear all chat history
  async function clearAllHistory() {
    if (!confirm('Weet je zeker dat je ALLE chat geschiedenis wilt wissen? Dit kan niet ongedaan gemaakt worden.')) {
      return;
    }
    
    try {
      const res = await fetch('/api/client/clear-history', {
        method: 'POST',
      });
      
      if (res.ok) {
        setConversations([]);
        setCurrentConversation(null);
        setMessages([]);
        toast.success('Chat geschiedenis gewist');
      } else {
        toast.error('Kon geschiedenis niet wissen');
      }
    } catch (e) {
      console.error('Failed to clear history:', e);
      toast.error('Kon chat geschiedenis niet wissen');
    }
  }

  // Publish to WordPress
  async function publishToWordPress() {
    if (!wpTitle || !wpContent) {
      toast.error('Titel en content zijn verplicht');
      return;
    }

    if (!wordpressConfig || !wordpressConfig.url) {
      toast.error('WordPress is nog niet geconfigureerd. Ga naar instellingen om dit in te stellen.');
      return;
    }

    setPublishingWP(true);
    try {
      const res = await fetch('/api/client/wordpress-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'publish',
          title: wpTitle,
          content: wpContent,
          excerpt: wpExcerpt,
          status: wpStatus,
          featuredImageUrl: wpFeaturedImage || undefined, // Include featured image
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`Blog succesvol gepubliceerd! Status: ${wpStatus}`);
        setShowWordPressDialog(false);
        setWpTitle('');
        setWpContent('');
        setWpExcerpt('');
        setWpFeaturedImage(''); // Reset featured image
        setWpStatus('draft');
        
        // Open de WordPress post in een nieuw tabblad als de link beschikbaar is
        if (data.link) {
          window.open(data.link, '_blank');
        }
      } else {
        const error = await res.json();
        toast.error(error.error || 'Kon niet publiceren naar WordPress');
      }
    } catch (e) {
      console.error('Failed to publish to WordPress:', e);
      toast.error('Kon niet publiceren naar WordPress');
    } finally {
      setPublishingWP(false);
    }
  }

  // Post to social media
  async function postToSocial() {
    if (!socialContent) {
      toast.error('Content is verplicht');
      return;
    }

    if (socialPlatforms.length === 0) {
      toast.error('Selecteer minimaal één platform');
      return;
    }

    setPublishingSocial(true);
    try {
      const res = await fetch('/api/client/latedev/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: socialContent,
          platforms: socialPlatforms,
          publishNow: socialPublishNow,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || 'Post succesvol aangemaakt!');
        setShowSocialDialog(false);
        setSocialContent('');
        setSocialPlatforms([]);
        setSocialPublishNow(false);
      } else {
        const error = await res.json();
        toast.error(error.error || 'Kon niet posten naar social media');
      }
    } catch (e) {
      console.error('Failed to post to social:', e);
      toast.error('Kon niet posten naar social media');
    } finally {
      setPublishingSocial(false);
    }
  }
  
  // Start new conversation
  async function startNewConversation() {
    if (!clientId) return null;
    
    try {
      const res = await fetch('/api/client/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          title: 'Nieuw gesprek',
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setCurrentConversation(data.conversation);
        // Verwijderd: setMessages([]) - dit wiste het gebruikersbericht dat net was toegevoegd!
        loadConversations(clientId);
        return data.conversation;
      }
    } catch (e) {
      console.error('Failed to create conversation:', e);
      toast.error('Kon nieuw gesprek niet starten');
    }
    return null;
  }
  
  // Quick action helper - Start nieuwe chat met vooringevulde tekst
  function handleQuickAction(promptText: string) {
    // Reset naar nieuwe chat
    setCurrentConversation(null);
    setMessages([]);
    setSkipAutoLoad(true);
    localStorage.removeItem('writgo_last_conversation_id');
    
    // Zet de tekst in het input veld
    setInput(promptText);
    
    // Sluit de sidebar
    setShowSidebar(false);
    
    // Focus op het input veld (kleine delay om te zorgen dat het veld beschikbaar is)
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }
  
  // Load conversation
  async function loadConversation(conversation: Conversation) {
    setCurrentConversation(conversation);
    setMessages(conversation.messages || []);
    setSkipAutoLoad(false); // Reset skip flag wanneer conversatie wordt geladen
    
    // Sla conversatie ID op in localStorage voor auto-restore bij refresh
    localStorage.setItem('writgo_last_conversation_id', conversation.id);
    
    // Sluit sidebar op mobiel na selecteren
    if (window.innerWidth < 768) {
      setShowSidebar(false);
    }
  }
  
  // Update conversation title
  async function updateConversationTitle(conversationId: string, title: string) {
    try {
      const res = await fetch('/api/client/conversations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          title,
        }),
      });
      
      if (res.ok) {
        loadConversations(clientId!);
        setEditingTitle(null);
      }
    } catch (e) {
      console.error('Failed to update title:', e);
    }
  }
  
  // Delete conversation
  async function deleteConversation(conversationId: string) {
    if (!confirm('Weet je zeker dat je dit gesprek wilt verwijderen?')) return;
    
    try {
      const res = await fetch(`/api/client/conversations?id=${conversationId}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        setConversations(prev => prev.filter(c => c.id !== conversationId));
        if (currentConversation?.id === conversationId) {
          setCurrentConversation(null);
          setMessages([]);
        }
        if (clientId) {
          loadConversations(clientId);
        }
        toast.success('Gesprek verwijderd');
      } else {
        throw new Error('Delete failed');
      }
    } catch (e) {
      console.error('Failed to delete conversation:', e);
      toast.error('Kon gesprek niet verwijderen');
    }
  }
  
  // Pin/unpin conversation
  async function togglePin(conversationId: string, isPinned: boolean) {
    try {
      await fetch('/api/client/conversations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          isPinned: !isPinned,
        }),
      });
      loadConversations(clientId!);
    } catch (e) {
      console.error('Failed to toggle pin:', e);
    }
  }
  
  // Detect manual scrolling
  useEffect(() => {
    const viewport = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!viewport) return;
    
    let scrollTimeout: NodeJS.Timeout;
    
    const handleScroll = () => {
      const currentScrollTop = viewport.scrollTop;
      const scrollHeight = viewport.scrollHeight;
      const clientHeight = viewport.clientHeight;
      
      // Check if user scrolled up (away from bottom)
      const isAtBottom = scrollHeight - currentScrollTop - clientHeight < 100;
      
      if (currentScrollTop < lastScrollTop.current && !isAtBottom) {
        // User scrolled up
        setIsUserScrolling(true);
        setShouldAutoScroll(false);
      } else if (isAtBottom) {
        // User scrolled to bottom
        setIsUserScrolling(false);
        setShouldAutoScroll(true);
      }
      
      lastScrollTop.current = currentScrollTop;
      
      // Reset user scrolling after 3 seconds of no scroll
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if (isAtBottom) {
          setIsUserScrolling(false);
          setShouldAutoScroll(true);
        }
      }, 3000);
    };
    
    viewport.addEventListener('scroll', handleScroll);
    return () => {
      viewport.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);
  
  // Auto-scroll naar nieuwe berichten (alleen als shouldAutoScroll)
  useEffect(() => {
    if (shouldAutoScroll && !isUserScrolling) {
      scrollToBottom();
    }
  }, [messages, shouldAutoScroll, isUserScrolling]);
  
  // Scroll ook tijdens het laden (streaming) - alleen als shouldAutoScroll
  useEffect(() => {
    if (loading && shouldAutoScroll && !isUserScrolling) {
      const scrollInterval = setInterval(() => {
        scrollToBottom();
      }, 100); // Check elke 100ms tijdens het laden
      
      return () => clearInterval(scrollInterval);
    }
  }, [loading, shouldAutoScroll, isUserScrolling]);
  
  // Reset auto-scroll bij nieuw bericht
  useEffect(() => {
    // Als er een nieuw AI bericht komt, heractiveer auto-scroll
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant' && !lastMessage.content?.includes('...')) {
      setShouldAutoScroll(true);
      setIsUserScrolling(false);
    }
  }, [messages]);
  
  function scrollToBottom() {
    if (scrollRef.current) {
      // Find the actual scrollable viewport inside the ScrollArea component
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  }
  
  // Save message to database
  async function saveMessage(message: Omit<Message, 'id' | 'createdAt'>, model?: string, conversation?: Conversation | null) {
    const conv = conversation || currentConversation;
    if (!conv) return;
    
    try {
      await fetch('/api/client/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conv.id,
          ...message,
          model,
        }),
      });
      
      if (clientId) {
        loadConversations(clientId);
      }
    } catch (e) {
      console.error('Failed to save message:', e);
    }
  }
  
  // Handle input change - generate suggestions
  function handleInputChange(value: string) {
    setInput(value);
    
    // Genereer suggesties als de input lang genoeg is
    if (value.trim().length > 5) {
      const suggestions = generateSmartSuggestions(value);
      setQuickSuggestions(suggestions);
      setShowQuickOptions(suggestions.length > 0);
    } else {
      setShowQuickOptions(false);
      setQuickSuggestions([]);
    }
  }
  
  // Handle option selection
  function handleOptionSelect(option: QuickOption) {
    // Voeg optie toe aan geselecteerde opties
    const newSelected = { ...selectedOptions };
    newSelected[option.category] = option.value;
    setSelectedOptions(newSelected);
    
    // Verwijder deze optie uit suggesties (zodat je niet dezelfde categorie dubbel selecteert)
    setQuickSuggestions(prev => prev.filter(s => s.category !== option.category));
    
    toast.success(`${option.category}: ${option.label} geselecteerd`);
  }
  
  // Remove selected option
  function removeSelectedOption(category: string) {
    const newSelected = { ...selectedOptions };
    delete newSelected[category];
    setSelectedOptions(newSelected);
    
    // Regenereer suggesties
    if (input.trim().length > 5) {
      const suggestions = generateSmartSuggestions(input);
      setQuickSuggestions(suggestions);
    }
  }
  
  // Build enhanced message with selected options
  function buildEnhancedMessage(): string {
    let enhancedMessage = input.trim();
    
    // Voeg geselecteerde opties toe aan het bericht
    if (Object.keys(selectedOptions).length > 0) {
      enhancedMessage += '\n\n📋 Specificaties:\n';
      
      for (const [category, value] of Object.entries(selectedOptions)) {
        enhancedMessage += `- ${category}: ${value}\n`;
      }
    }
    
    return enhancedMessage;
  }
  
  // Helper: Add status log entry
  function addStatusLog(type: StatusLogEntry['type'], message: string, icon: string) {
    const entry: StatusLogEntry = {
      timestamp: new Date(),
      type,
      message,
      icon,
    };
    
    setStatusLog(prev => [...prev, entry]);
    
    // Auto-open canvas bij eerste status update
    if (!showStatusCanvas) {
      setShowStatusCanvas(true);
    }
  }
  
  // Helper: Complete tool with duration
  function completeToolLog(toolName: string) {
    const startTime = toolStartTimes[toolName];
    if (startTime) {
      const duration = Date.now() - startTime;
      const entry: StatusLogEntry = {
        timestamp: new Date(),
        type: 'tool_complete',
        message: `${toolName} voltooid`,
        icon: '✅',
        duration,
      };
      
      setStatusLog(prev => [...prev, entry]);
      
      // Remove from start times
      setToolStartTimes(prev => {
        const updated = { ...prev };
        delete updated[toolName];
        return updated;
      });
    }
  }
  
  // NEW: Stop generation functie
  function stopGeneration() {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsGenerating(false);
      setLoading(false);
      setCurrentStep('');
      setStatus({});
      
      addStatusLog('error', 'Generatie geannuleerd door gebruiker', '⚠️');
      toast.info('Generatie geannuleerd');
      
      // Update het laatste (temp) bericht met cancelled status
      setMessages(prev => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
          lastMsg.content = '⚠️ Generatie geannuleerd door gebruiker.';
        }
        return updated;
      });
    }
  }
  
  // Clear status log
  function clearStatusLog() {
    setStatusLog([]);
  }

  // Handle file upload
  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Upload failed');
        }

        const data = await response.json();
        return data.file;
      });

      const uploaded = await Promise.all(uploadPromises);
      setUploadedFiles(prev => [...prev, ...uploaded]);
      toast.success(`${uploaded.length} bestand(en) geüpload`);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Upload mislukt');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  // Remove uploaded file
  function removeUploadedFile(index: number) {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;
    
    // Check credits eerst (behalve voor unlimited accounts)
    if (!isUnlimited && credits < 0.1) {
      toast.error('Je hebt niet genoeg credits. Koop nieuwe credits om door te gaan.');
      setShowCreditPaywall(true);
      return;
    }
    
    // Build enhanced message with selected options
    let enhancedInput = buildEnhancedMessage();
    
    // Add uploaded files context to the message
    if (uploadedFiles.length > 0) {
      const filesContext = uploadedFiles.map(file => {
        const isImage = file.type.startsWith('image/');
        return `\n\n📎 ${isImage ? 'Afbeelding' : 'Bestand'}: ${file.name} (${(file.size / 1024).toFixed(1)}KB)\n${isImage ? `![${file.name}](${file.url})` : `🔗 ${file.url}`}`;
      }).join('');
      
      enhancedInput += filesContext;
    }
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: enhancedInput,
      metadata: {
        selectedOptions: { ...selectedOptions },
      },
      images: uploadedFiles.filter(f => f.type.startsWith('image/')).map(f => f.url),
    };
    
    // ALTIJD direct weergeven en verzenden
    setMessages(prev => [...prev, userMessage]);
    const userInput = enhancedInput;
    setInput('');
    setUploadedFiles([]); // Clear uploaded files
    setSelectedOptions({}); // Clear selected options
    setShowQuickOptions(false); // Hide options panel
    setQuickSuggestions([]); // Clear suggestions
    setLoading(true);
    setIsGenerating(true); // NEW: Track generation state
    setCurrentStep('Voorbereiden...'); // NEW: Initial step
    
    // NEW: Create AbortController
    const controller = new AbortController();
    setAbortController(controller);
    
    try {
      // Gesprek opslaan in achtergrond
      if (!currentConversation && clientId) {
        const conv = await startNewConversation();
        if (conv) {
          await saveMessage(userMessage, undefined, conv);
        }
      } else if (currentConversation) {
        await saveMessage(userMessage, undefined, currentConversation);
      }
      
      // PURE AI - beslist zelf wat te doen
      // Retry logic voor network errors
      const maxRetries = 2;
      let lastError: any;
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          if (attempt > 0) {
            console.log(`🔄 Retry attempt ${attempt}/${maxRetries} na network error`);
            toast.info(`Opnieuw proberen... (poging ${attempt}/${maxRetries})`);
            // Wacht 2 seconden voor retry
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
          await handleAIChat(userInput);
          loadCredits();
          return; // Success! Exit de functie
        } catch (error: any) {
          lastError = error;
          
          // Check if it was an abort - geen retry
          if (error.name === 'AbortError') {
            console.log('✅ Generation was cancelled by user');
            return;
          }
          
          // Check if it's a network error that we can retry
          const isNetworkError = error.message?.includes('network') || 
                                error.message?.includes('fetch') ||
                                error.message?.includes('connection') ||
                                error.name === 'TypeError';
          
          if (isNetworkError && attempt < maxRetries) {
            console.log(`⚠️ Network error, will retry (attempt ${attempt + 1}/${maxRetries})`);
            continue; // Probeer opnieuw
          }
          
          // Als het geen network error is of we hebben alle retries geprobeerd, gooi de error
          throw error;
        }
      }
      
      // Als we hier komen, zijn alle retries mislukt
      throw lastError;
    } catch (error: any) {
      // Check if it was an abort
      if (error.name === 'AbortError') {
        console.log('✅ Generation was cancelled by user');
        return;
      }
      
      console.error('❌ Chat error:', error);
      
      // Show toast with error
      toast.error(error.message || 'Er ging iets fout');
      
      // Show error in chat with the friendly message
      const errorContent = `❌ ${error.message || 'Er ging iets fout. Probeer het opnieuw.'}`;
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorContent,
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      if (currentConversation) {
        await saveMessage(errorMessage, undefined, currentConversation);
      }
    } finally {
      setLoading(false);
      setIsGenerating(false); // NEW: Reset generation state
      setCurrentStep(''); // NEW: Clear step
      setAbortController(null); // NEW: Clear controller
      setStatus({});
    }
  }
  
  async function handleAIChat(userInput: string) {
    const tempAssistantId = (Date.now() + 1).toString();
    
    // Build conversation history - filter out invalid messages
    const conversationHistory = messages
      .slice(-10)
      .filter(m => {
        if (!m || !m.role || !m.content) return false;
        // Accept both string and array content
        if (typeof m.content === 'string') {
          return m.content.trim() !== '';
        } else if (Array.isArray(m.content)) {
          return m.content.length > 0;
        }
        return false;
      })
      .map(m => ({
        role: m.role,
        content: typeof m.content === 'string' ? m.content.trim() : m.content,
      }));

    // Create a temporary assistant message to show progress
    const tempAssistantMessage: Message = {
      id: tempAssistantId,
      role: 'assistant',
      content: '🚀 Voorbereiden...',
    };
    setMessages(prev => [...prev, tempAssistantMessage]);
    setCurrentStep('🚀 Voorbereiden...');

    // Roep de DeepAgent API aan met STREAMING
    const res = await fetch('/api/client/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userInput,
        clientId,
        conversationHistory,
        stream: true,
        userLocation: userLocation || null, // NEW: Send user location
        userName: userMemory.name || null, // NEW: Send user name
        projectContext: selectedProject ? {
          name: selectedProject.name,
          websiteUrl: selectedProject.websiteUrl,
          description: selectedProject.description,
          niche: selectedProject.niche,
          keywords: selectedProject.keywords,
          contentPillars: selectedProject.contentPillars,
        } : undefined,
      }),
      signal: abortController?.signal,
    });
      
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('❌ DeepAgent API error:', res.status, errorData);
      
      // Check for credit error
      if (res.status === 402) {
        toast.error('Je hebt niet genoeg credits. Koop nieuwe credits om door te gaan.');
        setShowCreditPaywall(true);
        return;
      }
      
      // Gebruik de vriendelijke message van de API als die beschikbaar is
      throw new Error(errorData.message || errorData.details || errorData.error || 'DeepAgent response failed');
    }

    // Process streaming response
    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalContent = '';
    let toolsUsed: any[] = [];
    let modelUsed = '';
    let modelReasoning = '';

    if (reader) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            
            const data = JSON.parse(line.slice(6));
            
            switch (data.type) {
              case 'status':
                // Verbeterde progress indicator met emoji EN educatieve uitleg
                const statusIcon = data.message.includes('Analyzing') || data.message.includes('nalyser') ? '🔍' :
                                  data.message.includes('Planning') || data.message.includes('lann') ? '📋' :
                                  data.message.includes('Research') || data.message.includes('zoek') ? '🔬' :
                                  data.message.includes('Generating') || data.message.includes('enerer') ? '✨' :
                                  data.message.includes('Writing') || data.message.includes('chrij') ? '✍️' : '⏳';
                
                // Korte status berichten - geen educatieve context meer
                const statusMessage = `${statusIcon} ${data.message}`;
                
                // Add to status log
                addStatusLog('status', data.message, statusIcon);
                
                setStatus({
                  stage: 'analyzing',
                  progress: data.message,
                  thinking: true,
                  progressPercent: data.progress || undefined,
                  currentStep: data.step || undefined,
                  maxSteps: data.maxSteps || undefined,
                });
                
                setCurrentStep(statusMessage); // NEW: Update current step
                
                setMessages(prev => prev.map(m => 
                  m.id === tempAssistantId 
                    ? { ...m, content: statusMessage }
                    : m
                ));
                
                // Scroll naar beneden na status update
                setTimeout(() => scrollToBottom(), 50);
                break;

              case 'tool_start':
                // Verbeterde tool indicator met specifieke emoji's per tool
                const toolIcon = data.tool === 'web_search' ? '🌐' :
                                data.tool === 'generate_blog' ? '📝' :
                                data.tool === 'generate_image' ? '🖼️' :
                                data.tool === 'generate_video' ? '🎬' :
                                data.tool === 'browse_website' ? '🔗' :
                                data.tool === 'scan_website' ? '🔍' :
                                data.tool === 'wordpress_publish' ? '📤' :
                                data.tool === 'bash_command' ? '💻' :
                                data.tool === 'python_execute' ? '🐍' : '🛠️';
                
                const toolMessage = `${toolIcon} ${data.message}`;
                
                // Track tool start time for duration calculation
                setToolStartTimes(prev => ({
                  ...prev,
                  [data.tool]: Date.now()
                }));
                
                // Add to status log
                addStatusLog('tool_start', data.message, toolIcon);
                
                setStatus({
                  stage: 'executing',
                  progress: data.message,
                  thinking: true,
                });
                
                setCurrentStep(toolMessage); // NEW: Update current step
                
                setMessages(prev => prev.map(m => 
                  m.id === tempAssistantId 
                    ? { ...m, content: toolMessage }
                    : m
                ));
                
                // Scroll naar beneden na tool start
                setTimeout(() => scrollToBottom(), 50);
                break;

              case 'heartbeat':
                // 🔥 HEARTBEAT - update tijdens lange tool executions
                // Voorkomt dat de UI vastloopt tijdens bijv. video generatie
                const heartbeatMessage = data.message || `⏳ ${data.tool} bezig... (${data.elapsed}s)`;
                
                setStatus({
                  stage: 'executing',
                  progress: heartbeatMessage,
                  thinking: true,
                });
                
                setCurrentStep(heartbeatMessage);
                
                setMessages(prev => prev.map(m => 
                  m.id === tempAssistantId 
                    ? { ...m, content: heartbeatMessage }
                    : m
                ));
                
                // Scroll naar beneden om heartbeat zichtbaar te houden
                setTimeout(() => scrollToBottom(), 50);
                break;

              case 'tool_complete':
                console.log('✅ Tool complete:', data.tool);
                // Complete tool with duration tracking
                if (data.tool) {
                  completeToolLog(data.tool);
                }
                break;

              case 'tool_error':
                console.warn('⚠️ Tool error:', data.message);
                toast.warning(data.message);
                break;

              case 'streaming_start':
                // Word-by-word streaming begint
                setCurrentStep('💬 Antwoord genereren...');
                setMessages(prev => prev.map(m => 
                  m.id === tempAssistantId 
                    ? { ...m, content: '' }
                    : m
                ));
                break;

              case 'word':
                // Update het bericht met het nieuwe woord (word-by-word)
                setMessages(prev => prev.map(m => 
                  m.id === tempAssistantId 
                    ? { ...m, content: data.content }
                    : m
                ));
                
                // Scroll naar beneden tijdens streaming
                setTimeout(() => scrollToBottom(), 10);
                break;

              case 'complete':
                finalContent = data.message;
                toolsUsed = data.toolsUsed || [];
                modelUsed = data.model || '';
                modelReasoning = data.modelReasoning || '';
                
                // Store model info for display
                if (data.modelInfo) {
                  setStatus({
                    ...status,
                    modelInfo: data.modelInfo
                  });
                }
                
                // Check for embedded code data
                const codeDataMatch = finalContent.match(/\[CODE_DATA_START\](.*?)\[CODE_DATA_END\]/s);
                if (codeDataMatch) {
                  try {
                    const codeData = JSON.parse(codeDataMatch[1]);
                    // Remove code data from visible content
                    finalContent = finalContent.replace(/\[CODE_DATA_START\].*?\[CODE_DATA_END\]/s, '');
                    // Open code canvas automatically
                    setCodeCanvasHtml(codeData.html || '');
                    setCodeCanvasCss(codeData.css || '');
                    setCodeCanvasJs(codeData.js || '');
                    setCodeCanvasTitle(codeData.title || 'Generated Code');
                    setCodeCanvasDescription(codeData.description || '');
                    setTimeout(() => setShowCodeCanvas(true), 500);
                    toast.success('Code canvas geopend!');
                  } catch (error) {
                    console.error('Failed to parse code data:', error);
                  }
                }
                
                const modelName = modelUsed.includes('gemini') ? 'Gemini Flash' :
                                modelUsed.includes('gpt-4o') ? 'GPT-4o' : 
                                modelUsed || 'AI';
                
                if (toolsUsed.length > 0) {
                  const toolList = toolsUsed.map((t: any) => {
                    const toolName = t.tool || t;
                    let icon = '🔧';
                    if (toolName.includes('bash')) icon = '💻';
                    if (toolName.includes('file') || toolName.includes('read') || toolName.includes('write')) icon = '📄';
                    if (toolName.includes('web') || toolName.includes('search')) icon = '🔍';
                    if (toolName.includes('website') || toolName.includes('scan')) icon = '🌐';
                    if (toolName.includes('blog') || toolName.includes('generate')) icon = '✍️';
                    return `${icon} ${toolName}`;
                  }).join(', ');
                  
                  setStatus({
                    stage: 'finalizing',
                    progress: `✅ Gereed! Model: ${modelName} | Tools: ${toolList}`,
                    thinking: true,
                  });
                } else {
                  setStatus({
                    stage: 'finalizing',
                    progress: `✅ Gereed! Model: ${modelName}`,
                    thinking: true,
                  });
                }
                
                // Toon notificatie bij completion (als de tab niet actief is)
                if (document.hidden) {
                  // Browser notificatie logic removed (admin email notifications active)
                }
                
                // Scroll naar beneden na completion
                setTimeout(() => scrollToBottom(), 50);
                break;

              case 'error':
                throw new Error(data.message || 'Er ging iets fout');
            }
          }
        }
      } catch (error) {
        console.error('Streaming error:', error);
        throw error;
      }
    }

    if (!finalContent) {
      throw new Error('Geen response ontvangen van DeepAgent');
    }
    
    // Determine model tier for badge display
    let modelTier: 'premium' | 'balanced' | 'budget' = 'balanced';
    if (modelUsed.includes('gpt-4o') || modelUsed.includes('claude-3-5') || modelUsed.includes('gemini-2.5')) {
      modelTier = 'premium';
    } else if (modelUsed.includes('gpt-4o-mini') || modelUsed.includes('gemini-2.0') || modelUsed.includes('deepseek')) {
      modelTier = 'balanced';
    } else if (modelUsed.includes('gpt-3.5') || modelUsed.includes('gemini-1.5-flash')) {
      modelTier = 'budget';
    }
    
    // Update the temporary message with real response
    setMessages(prev => prev.map(msg => 
      msg.id === tempAssistantId ? {
        ...msg,
        content: finalContent,
        toolsUsed: toolsUsed,
        model: modelUsed,
        metadata: {
          ...msg.metadata,
          modelTier,
          modelReasoning,
        }
      } : msg
    ));
    
    // Save the final message
    if (currentConversation) {
      const finalMessage: Message = {
        id: tempAssistantId,
        role: 'assistant',
        content: finalContent,
        toolsUsed: toolsUsed,
        model: modelUsed,
      };
      await saveMessage(finalMessage, modelUsed, currentConversation);
    }
    
    // Clear status after a short delay
    setTimeout(() => setStatus({}), 2000);
  }
  
  // Handle Canvas Edit with AI
  async function handleCanvasEdit() {
    if (!canvasEditInput.trim() || isEditingCanvas) return;
    
    setIsEditingCanvas(true);
    const editRequest = canvasEditInput;
    setCanvasEditInput('');
    
    try {
      const response = await fetch('/api/client/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'Je bent een professionele content editor. Je krijgt een artikel en een wijzigingsverzoek. Pas het artikel aan volgens het verzoek en retourneer alleen de volledige aangepaste versie in Markdown formaat. Geen uitleg, alleen de nieuwe content.'
            },
            {
              role: 'user',
              content: `Huidige artikel:\n\n${blogCanvasContent}\n\nWijzigingsverzoek: ${editRequest}`
            }
          ],
          conversationId: currentConversation?.id,
          clientId: clientId,
          projectId: selectedProject?.id
        })
      });
      
      if (!response.ok) {
        throw new Error('AI aanpassing mislukt');
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let updatedContent = '';
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'content') {
                updatedContent += data.content;
                setBlogCanvasContent(updatedContent);
              }
            }
          }
        }
      }
      
      toast.success('Content succesvol aangepast!');
    } catch (error) {
      console.error('Canvas edit error:', error);
      toast.error('Fout bij het aanpassen van content');
    } finally {
      setIsEditingCanvas(false);
    }
  }
  
  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }
  
  // Render settings dialog
  const SettingsDialog = () => (
    <Dialog open={showSettings} onOpenChange={setShowSettings}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 border-orange-500 text-orange-500 hover:bg-zinc-900"
        >
          <Settings className="w-4 h-4" />
          Instellingen
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-orange-500" />
            AI Instellingen
          </DialogTitle>
          <DialogDescription>
            Configureer je AI assistent en WordPress website
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Voorkeur Model */}
          <div className="space-y-2">
            <Label>Voorkeur AI Model</Label>
            <Select
              value={aiSettings?.preferredModel || 'gpt-4o'}
              onValueChange={(value) => saveSettings({ preferredModel: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHAT_MODELS.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                    {model.recommended && ' ⭐'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">
              {CHAT_MODELS.find(m => m.value === (aiSettings?.preferredModel || 'gpt-4o'))?.description}
            </p>
          </div>

          {/* Custom Instructions */}
          <div className="space-y-2">
            <Label>Custom Instructions (optioneel)</Label>
            <Textarea
              placeholder="Bijvoorbeeld: Schrijf altijd in een vriendelijke, informele toon"
              value={aiSettings?.customInstructions || ''}
              onChange={(e) => saveSettings({ customInstructions: e.target.value })}
              rows={3}
            />
          </div>

          {/* NEW: User Profile (Name & Location) */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold text-lg">Gebruikersprofiel</h3>
            <p className="text-sm text-gray-500">
              Help de AI je beter te begrijpen door je naam en locatie te delen
            </p>
            
            {/* Name */}
            <div className="space-y-2">
              <Label>Jouw Naam</Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Hoe moet ik je noemen?"
                  value={userMemory.name || ''}
                  onChange={(e) => setUserMemory(prev => ({ ...prev, name: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && userMemory.name) {
                      saveUserName(userMemory.name);
                    }
                  }}
                />
                <Button
                  onClick={() => userMemory.name && saveUserName(userMemory.name)}
                  disabled={!userMemory.name}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <Check className="w-4 h-4" />
                </Button>
              </div>
              {userMemory.name && (
                <p className="text-xs text-green-600">
                  ✅ De AI zal je voortaan {userMemory.name} noemen
                </p>
              )}
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label>Jouw Locatie</Label>
              {userLocation ? (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-900">
                        📍 {userLocation.city}, {userLocation.country}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        De AI kan nu locatie-specifieke aanbevelingen doen
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setUserLocation(null);
                        setLocationPermission('prompt');
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={requestLocation}
                  className="w-full bg-orange-500 hover:bg-orange-600 gap-2"
                  disabled={locationPermission === 'denied'}
                >
                  <Globe className="w-4 h-4" />
                  {locationPermission === 'denied' 
                    ? 'Locatietoegang geweigerd' 
                    : 'Deel mijn locatie'}
                </Button>
              )}
              {locationPermission === 'denied' && (
                <p className="text-xs text-red-600">
                  Locatietoegang is geweigerd. Wijzig dit in je browser instellingen.
                </p>
              )}
            </div>
          </div>

          {/* Late.dev (Social Media) Configuration */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold text-lg">Social Media (Late.dev)</h3>
            <p className="text-sm text-gray-500">
              Verbind je social media accounts om direct vanuit de chat te posten
            </p>
            
            {lateDevConnected && connectedSocialAccounts.length > 0 ? (
              <div className="space-y-3">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-green-900">✅ Late.dev Verbonden</p>
                      {lateDevProfileInfo?.email && (
                        <p className="text-xs text-green-700 mt-1">
                          Ingelogd als: <span className="font-medium">{lateDevProfileInfo.email}</span>
                        </p>
                      )}
                      <p className="text-xs text-green-600 mt-0.5">
                        {connectedSocialAccounts.length} account(s) verbonden
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={deleteLateDevConfig}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-1 mt-2">
                    {connectedSocialAccounts.map((account) => (
                      <div key={account.id} className="text-xs text-green-700 flex items-center gap-2">
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {account.platform}
                        </Badge>
                        <span>{account.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-700">
                    WritgoAI gebruikt een gedeelde Late.dev integratie. Je hoeft geen API key in te vullen.
                  </p>
                </div>
                
                <Button 
                  onClick={connectLateDevAccount}
                  className="w-full bg-zinc-9000 hover:bg-orange-600"
                >
                  Social Media Verbinden
                </Button>
              </div>
            )}
          </div>

          {/* WordPress Configuration */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold text-lg">WordPress Website</h3>
            
            {wordpressConfig && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-900">✅ WordPress Geconfigureerd</p>
                    <p className="text-sm text-green-700 mt-1">
                      {wordpressConfig.url}
                    </p>
                    <p className="text-xs text-green-600 mt-0.5">
                      Gebruiker: {wordpressConfig.username}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={deleteWordPressConfig}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>WordPress URL</Label>
                <Input
                  type="url"
                  placeholder="https://jouwwebsite.nl"
                  value={wpUrl}
                  onChange={(e) => setWpUrl(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>WordPress Gebruikersnaam</Label>
                <Input
                  type="text"
                  placeholder="admin"
                  value={wpUsername}
                  onChange={(e) => setWpUsername(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>WordPress Application Password</Label>
                <Input
                  type="password"
                  placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                  value={wpPassword}
                  onChange={(e) => setWpPassword(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Maak een Application Password aan in je WordPress dashboard
                </p>
              </div>
              
              <Button 
                onClick={saveWordPressConfig}
                className="w-full bg-zinc-9000 hover:bg-orange-600"
              >
                WordPress Opslaan
              </Button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="space-y-4 border-t border-red-200 pt-4">
            <h3 className="font-semibold text-lg text-red-600">Danger Zone</h3>
            <Button
              variant="destructive"
              onClick={clearAllHistory}
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Wis Alle Chat Geschiedenis
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
  
  if (sessionStatus === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" style={{ color: BRAND_COLORS.orange }} />
          <p style={{ color: BRAND_COLORS.white }}>Laden...</p>
        </div>
      </div>
    );
  }

  if (sessionStatus === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: '#0a0a0a' }}>
        <Card className="p-6 max-w-md" style={{ backgroundColor: '#1a1a1a', border: 'none' }}>
          <h2 className="text-2xl font-bold mb-4" style={{ color: BRAND_COLORS.white }}>Login Vereist</h2>
          <p className="mb-4" style={{ color: '#8a8a8a' }}>
            Je moet ingelogd zijn om WritgoAI DeepAgent te gebruiken.
          </p>
          <Button
            onClick={() => window.location.href = '/client-login'}
            className="w-full"
            style={{ backgroundColor: BRAND_COLORS.orange }}
          >
            Naar Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Inject typography styles */}
      <style dangerouslySetInnerHTML={{ __html: TYPOGRAPHY_STYLES }} />
      
      {/* Credit Paywall */}
      <CreditPaywall 
        isOpen={showCreditPaywall}
        onClose={() => setShowCreditPaywall(false)}
        currentCredits={credits}
        onPurchaseComplete={loadCredits}
        hasActiveSubscription={hasActiveSubscription || isUnlimited}
      />
      
      {/* Project Management Dialog */}
      <Dialog open={showProjectDialog} onOpenChange={setShowProjectDialog}>
        <DialogContent 
          className="sm:max-w-[500px]"
          style={{
            backgroundColor: BRAND_COLORS.black,
            borderColor: BRAND_COLORS.orange
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: BRAND_COLORS.white }}>
              {editingProject ? 'Project Bewerken' : 'Nieuw Project Toevoegen'}
            </DialogTitle>
            <DialogDescription style={{ color: '#8a8a8a' }}>
              Voeg een website of project toe waar je content voor wilt genereren.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="project-name" style={{ color: BRAND_COLORS.white }}>
                Project Naam *
              </Label>
              <Input
                id="project-name"
                placeholder="bijv. Mijn Blog, E-commerce Site"
                className="mt-1"
                style={{
                  backgroundColor: '#1a1a1a',
                  borderColor: '#2a2a2a',
                  color: BRAND_COLORS.white
                }}
              />
            </div>
            
            <div>
              <Label htmlFor="project-url" style={{ color: BRAND_COLORS.white }}>
                Website URL *
              </Label>
              <Input
                id="project-url"
                placeholder="https://example.com"
                className="mt-1"
                style={{
                  backgroundColor: '#1a1a1a',
                  borderColor: '#2a2a2a',
                  color: BRAND_COLORS.white
                }}
              />
            </div>
            
            <div>
              <Label htmlFor="project-description" style={{ color: BRAND_COLORS.white }}>
                Beschrijving (optioneel)
              </Label>
              <Textarea
                id="project-description"
                placeholder="Beschrijf waar je website over gaat..."
                className="mt-1"
                style={{
                  backgroundColor: '#1a1a1a',
                  borderColor: '#2a2a2a',
                  color: BRAND_COLORS.white
                }}
              />
            </div>
            
            <div>
              <Label htmlFor="project-niche" style={{ color: BRAND_COLORS.white }}>
                Niche/Sector (optioneel)
              </Label>
              <Input
                id="project-niche"
                placeholder="bijv. Lifestyle, Tech, Finance"
                className="mt-1"
                style={{
                  backgroundColor: '#1a1a1a',
                  borderColor: '#2a2a2a',
                  color: BRAND_COLORS.white
                }}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowProjectDialog(false);
                setEditingProject(null);
              }}
              style={{
                borderColor: '#2a2a2a',
                color: BRAND_COLORS.white
              }}
            >
              Annuleren
            </Button>
            <Button
              style={{ backgroundColor: BRAND_COLORS.orange }}
              onClick={async () => {
                const name = (document.getElementById('project-name') as HTMLInputElement)?.value;
                const url = (document.getElementById('project-url') as HTMLInputElement)?.value;
                const description = (document.getElementById('project-description') as HTMLTextAreaElement)?.value;
                const niche = (document.getElementById('project-niche') as HTMLInputElement)?.value;
                
                if (!name || !url) {
                  toast.error('Vul minimaal een naam en URL in');
                  return;
                }
                
                try {
                  const res = await fetch('/api/client/projects', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      name,
                      websiteUrl: url,
                      description: description || undefined,
                      niche: niche || undefined
                    })
                  });
                  
                  const data = await res.json();
                  
                  if (data.success) {
                    toast.success('Project toegevoegd!');
                    loadProjects();
                    setShowProjectDialog(false);
                    setEditingProject(null);
                  } else {
                    toast.error(data.error || 'Kon project niet toevoegen');
                  }
                } catch (error) {
                  console.error('Error adding project:', error);
                  toast.error('Er ging iets mis');
                }
              }}
            >
              {editingProject ? 'Opslaan' : 'Toevoegen'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex max-h-[600px] overflow-hidden relative rounded-xl border shadow-lg" style={{ backgroundColor: BRAND_COLORS.background, borderColor: '#e5e7eb' }}>
        {/* Sidebar - VERBORGEN (ChatGPT-stijl: Geen sidebar, alleen chat + geschiedenis dropdown) */}
        {false && showSidebar && (
          <>
            {/* Backdrop voor mobiel */}
            <div 
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setShowSidebar(false)}
            />
            
            <div 
              className="w-80 flex-shrink-0 flex flex-col border-r fixed md:relative inset-y-0 left-0 z-50"
              style={{ 
                backgroundColor: '#0a0a0a',
                borderColor: '#2a2a2a'
              }}
            >
            {/* Sidebar Header */}
            <div className="p-4 border-b" style={{ borderColor: '#2a2a2a' }}>
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: BRAND_COLORS.orange }}
                >
                  <Sparkles className="w-6 h-6" style={{ color: BRAND_COLORS.white }} />
                </div>
                <div className="flex-1">
                  <h2 className="font-bold text-lg" style={{ color: BRAND_COLORS.white }}>
                    WritgoAI DeepAgent
                  </h2>
                  <p className="text-sm" style={{ color: '#8a8a8a' }}>
                    Universele AI Assistent
                  </p>
                </div>
              </div>
              
              <Button
                onClick={() => {
                  setCurrentConversation(null);
                  setMessages([]);
                  setSkipAutoLoad(true);
                  localStorage.removeItem('writgo_last_conversation_id');
                  setShowSidebar(false); // Sluit sidebar
                }}
                className="w-full mb-3"
                style={{ backgroundColor: BRAND_COLORS.orange }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nieuw Gesprek
              </Button>
              
              {/* Project Selector */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold px-2" style={{ color: '#8a8a8a' }}>
                    🌐 PROJECT
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2"
                    style={{ color: BRAND_COLORS.orange }}
                    onClick={() => setShowProjectDialog(true)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Nieuw
                  </Button>
                </div>
                
                {projects.length > 0 ? (
                  <Select
                    value={selectedProject?.id || 'none'}
                    onValueChange={(value) => {
                      if (value === 'none') {
                        setSelectedProject(null);
                      } else {
                        const project = projects.find(p => p.id === value);
                        setSelectedProject(project || null);
                      }
                    }}
                  >
                    <SelectTrigger 
                      className="w-full"
                      style={{ 
                        backgroundColor: '#1a1a1a',
                        borderColor: '#2a2a2a',
                        color: BRAND_COLORS.white
                      }}
                    >
                      <Globe className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Kies een project">
                        {selectedProject?.name || 'Geen project'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent
                      className="bg-[#000814] border-[#FFA500]"
                      style={{
                        backgroundColor: BRAND_COLORS.black,
                        borderColor: BRAND_COLORS.orange,
                        color: BRAND_COLORS.white
                      }}
                    >
                      <SelectItem 
                        value="none"
                        className="text-white hover:bg-[#1a1a1a] focus:bg-[#1a1a1a]"
                        style={{ color: BRAND_COLORS.white }}
                      >
                        <div className="flex items-center gap-2">
                          <span>Geen project</span>
                        </div>
                      </SelectItem>
                      {projects.map((project) => (
                        <SelectItem 
                          key={project.id} 
                          value={project.id}
                          className="text-white hover:bg-[#1a1a1a] focus:bg-[#1a1a1a]"
                          style={{ color: BRAND_COLORS.white }}
                        >
                          <div className="flex items-center gap-2">
                            <span>{project.name}</span>
                            {project.isPrimary && (
                              <Badge className="bg-zinc-9000 text-white text-xs">Primair</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    style={{ 
                      borderColor: '#2a2a2a',
                      color: BRAND_COLORS.white
                    }}
                    onClick={() => setShowProjectDialog(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Project Toevoegen
                  </Button>
                )}
              </div>

              {/* Quick Actions als Dropdown */}
              <div className="space-y-2">
                <div className="text-xs font-semibold mb-2 px-2" style={{ color: '#8a8a8a' }}>
                  ⚡ QUICK ACTIONS
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-between"
                      style={{ 
                        borderColor: '#2a2a2a',
                        color: BRAND_COLORS.white,
                        backgroundColor: '#1a1a1a'
                      }}
                    >
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4" style={{ color: BRAND_COLORS.orange }} />
                        Kies een actie
                      </span>
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    className="w-56"
                    style={{
                      backgroundColor: '#1a1a1a',
                      borderColor: '#2a2a2a',
                      color: BRAND_COLORS.white
                    }}
                  >
                    <DropdownMenuLabel style={{ color: BRAND_COLORS.orange }}>
                      📝 Schrijven
                    </DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => handleQuickAction('Schrijf een SEO blog over ')}
                      style={{ color: BRAND_COLORS.white }}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      SEO Blog Schrijven
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleQuickAction('Schrijf een review artikel volgens de SOP - Review Artikel Schrijven over ')}
                      style={{ color: BRAND_COLORS.white }}
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Review Artikel
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleQuickAction('Schrijf een social media post voor ')}
                      style={{ color: BRAND_COLORS.white }}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Social Media Post
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleQuickAction('Schrijf een nieuwsbrief over ')}
                      style={{ color: BRAND_COLORS.white }}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Nieuwsbrief
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleQuickAction('Herschrijf en optimaliseer dit artikel tot een SEO-geoptimaliseerde blog: ')}
                      style={{ color: BRAND_COLORS.white }}
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Artikel Herschrijven
                    </DropdownMenuItem>
                    
                    {/* Linkbuilding Generator - alleen voor mikeschonewille@gmail.com */}
                    {session?.user?.email === 'mikeschonewille@gmail.com' && (
                      <DropdownMenuItem
                        onClick={() => {
                          const example = `Schrijf een linkbuilding artikel van 500 woorden voor lifeandyou.nl met anchors:
- "operational lease" → https://dutchlease.nl/operational-lease
- "zakelijk leasen" → https://dutchlease.nl/zakelijk`;
                          handleQuickAction(example);
                        }}
                        style={{ color: BRAND_COLORS.white }}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Linkbuilding Artikel
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuSeparator style={{ backgroundColor: '#2a2a2a' }} />
                    
                    <DropdownMenuLabel style={{ color: BRAND_COLORS.orange }}>
                      🎨 Visueel
                    </DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => handleQuickAction('Maak een afbeelding van ')}
                      style={{ color: BRAND_COLORS.white }}
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Afbeelding Maken
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleQuickAction('Maak een video over ')}
                      style={{ color: BRAND_COLORS.white }}
                    >
                      <Video className="w-4 h-4 mr-2" />
                      Video Maken
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleQuickAction('Maak een Instagram/TikTok Reel video over ')}
                      style={{ color: BRAND_COLORS.white }}
                    >
                      <Smartphone className="w-4 h-4 mr-2" />
                      Reel Video Maken
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator style={{ backgroundColor: '#2a2a2a' }} />
                    
                    <DropdownMenuLabel style={{ color: BRAND_COLORS.orange }}>
                      🌐 Research & Analyse
                    </DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => handleQuickAction('Doe onderzoek naar ')}
                      style={{ color: BRAND_COLORS.white }}
                    >
                      <Globe className="w-4 h-4 mr-2" />
                      Web Research
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleQuickAction('Analyseer de concurrentie voor ')}
                      style={{ color: BRAND_COLORS.white }}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Concurrentie Analyse
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleQuickAction('Genereer 10 SEO keywords voor ')}
                      style={{ color: BRAND_COLORS.white }}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Keyword Research
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Admin: Klanten Overzicht */}
              {(session?.user?.email === 'info@WritgoAI.nl' || session?.user?.role === 'admin') && (
                <div className="mt-4 pt-4 border-t" style={{ borderColor: '#2a2a2a' }}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm" style={{ color: BRAND_COLORS.white }}>
                      👥 Klanten ({clients.length})
                    </h3>
                  </div>
                  
                  <ScrollArea className="h-48 pr-2">
                    <div className="space-y-2">
                      {clients.map((client: any) => (
                        <Card 
                          key={client.id}
                          className="p-3 cursor-pointer hover:bg-gray-900 transition-colors"
                          style={{
                            backgroundColor: '#1a1a1a',
                            borderColor: '#2a2a2a'
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate" style={{ color: BRAND_COLORS.white }}>
                                {client.name}
                              </p>
                              <p className="text-xs truncate" style={{ color: '#8a8a8a' }}>
                                {client.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-2 text-xs" style={{ color: '#8a8a8a' }}>
                            <span>📝 {client._count?.contentPieces || 0}</span>
                            <span>•</span>
                            <span>{new Date(client.createdAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}</span>
                          </div>
                        </Card>
                      ))}
                      
                      {clients.length === 0 && (
                        <p className="text-center text-sm py-4" style={{ color: '#8a8a8a' }}>
                          Geen klanten gevonden
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}

              <div className="flex flex-col gap-2 mt-4">
                <div className="flex gap-2">
                  <SettingsDialog />
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setShowSidebar(false)}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Verberg
                  </Button>
                </div>
                <Link href="/client-portal/account" className="w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 border-orange-500 text-orange-500 hover:bg-zinc-900"
                  >
                    <CreditCard className="w-4 h-4" />
                    Account & Abonnement
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  style={{
                    borderColor: '#dc2626',
                    color: '#dc2626',
                    backgroundColor: 'transparent'
                  }}
                  onClick={() => {
                    if (confirm('Weet je zeker dat je wilt uitloggen?')) {
                      signOut({ callbackUrl: '/client-login' });
                    }
                  }}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Uitloggen
                </Button>
              </div>
            </div>

            {/* Conversations List */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-2">
                {conversations.length === 0 && (
                  <div className="text-center py-8" style={{ color: '#8a8a8a' }}>
                    <p className="text-sm">Nog geen gesprekken</p>
                    <p className="text-xs mt-1">Start een nieuw gesprek</p>
                  </div>
                )}
                
                {conversations
                  .sort((a, b) => {
                    if (a.isPinned && !b.isPinned) return -1;
                    if (!a.isPinned && b.isPinned) return 1;
                    return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
                  })
                  .map((conv) => (
                    <div
                      key={conv.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors border`}
                      style={{
                        backgroundColor: currentConversation?.id === conv.id 
                          ? '#2a2a2a' 
                          : 'transparent',
                        borderColor: currentConversation?.id === conv.id 
                          ? BRAND_COLORS.orange 
                          : 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        if (currentConversation?.id !== conv.id) {
                          e.currentTarget.style.backgroundColor = '#1a1a1a';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (currentConversation?.id !== conv.id) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                      onClick={() => loadConversation(conv)}
                    >
                      <div className="flex items-start justify-between mb-1">
                        {editingTitle === conv.id ? (
                          <div className="flex-1 flex gap-1">
                            <Input
                              value={editTitleValue}
                              onChange={(e) => setEditTitleValue(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  updateConversationTitle(conv.id, editTitleValue);
                                }
                              }}
                              className="h-7 text-sm"
                              style={{
                                backgroundColor: '#1a1a1a',
                                borderColor: '#2a2a2a',
                                color: BRAND_COLORS.white
                              }}
                              autoFocus
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              style={{ color: BRAND_COLORS.white }}
                              onClick={(e) => {
                                e.stopPropagation();
                                updateConversationTitle(conv.id, editTitleValue);
                              }}
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              style={{ color: BRAND_COLORS.white }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTitle(null);
                              }}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {conv.isPinned && (
                                  <Pin className="w-3 h-3" style={{ color: BRAND_COLORS.orange }} />
                                )}
                                <p 
                                  className="text-sm font-medium truncate"
                                  style={{ color: BRAND_COLORS.white }}
                                >
                                  {conv.title}
                                </p>
                              </div>
                              <p className="text-xs mt-1" style={{ color: '#8a8a8a' }}>
                                {new Date(conv.lastMessageAt).toLocaleDateString('nl-NL')}
                                {' • '}
                                {conv._count?.messages || 0} berichten
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePin(conv.id, conv.isPinned);
                                }}
                              >
                                <Pin 
                                  className={`w-3 h-3 ${conv.isPinned ? 'fill-current' : ''}`}
                                  style={{ color: conv.isPinned ? BRAND_COLORS.orange : '#8a8a8a' }}
                                />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingTitle(conv.id);
                                  setEditTitleValue(conv.title);
                                }}
                              >
                                <Edit2 className="w-3 h-3" style={{ color: '#8a8a8a' }} />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteConversation(conv.id);
                                }}
                              >
                                <Trash2 className="w-3 h-3 text-red-400" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </ScrollArea>

            {/* Credit Display in Sidebar */}
            <div className="p-4 border-t" style={{ borderColor: '#2a2a2a' }}>
              <CreditDisplay
                clientId={clientId || undefined}
                showButton={true}
                size="md"
              />
            </div>
          </div>
          </>
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col relative">
          {/* Tool Mode Header - Show when in a tool and chatting */}
          
          {/* AI Status Terminal - Altijd bovenaan */}
          {(showStatusCanvas || statusLog.length > 0 || isGenerating) && (
            <div 
              className="border-b"
              style={{ 
                backgroundColor: '#0a0a0a',
                borderColor: '#2a2a2a'
              }}
            >
              <div className="max-w-4xl mx-auto p-3">
                {/* Terminal Header */}
                <button
                  onClick={() => setShowStatusCanvas(!showStatusCanvas)}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: isGenerating ? BRAND_COLORS.orange : '#1a1a1a' }}
                    >
                      {isGenerating ? (
                        <Loader2 className="w-4 h-4 animate-spin" style={{ color: BRAND_COLORS.white }} />
                      ) : (
                        <Bot className="w-4 h-4" style={{ color: BRAND_COLORS.orange }} />
                      )}
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold" style={{ color: BRAND_COLORS.white }}>
                        {isGenerating ? '⚙️ AI Agent is bezig...' : '✅ Klaar'}
                      </div>
                      <div className="text-xs truncate max-w-[250px] sm:max-w-none" style={{ color: '#8a8a8a' }}>
                        {isGenerating && statusLog.length > 0 
                          ? statusLog[statusLog.length - 1].message 
                          : statusLog.length > 0 
                            ? `${statusLog.length} stappen voltooid` 
                            : 'Geen activiteit'}
                      </div>
                    </div>
                  </div>
                  <ChevronDown 
                    className={`w-4 h-4 transition-transform ${showStatusCanvas ? 'rotate-180' : ''}`}
                    style={{ color: '#8a8a8a' }}
                  />
                </button>

                {/* Terminal Body - Expandable - Toon laatste 5 items */}
                {showStatusCanvas && (
                  <div className="mt-2 space-y-2 max-h-[40vh] overflow-y-auto">
                    {statusLog.length === 0 && !isGenerating && (
                      <div className="text-center py-4">
                        <p className="text-sm" style={{ color: '#8a8a8a' }}>
                          Geen activiteit te tonen
                        </p>
                      </div>
                    )}
                    
                    {statusLog.slice(-5).map((entry, idx) => {
                      const timeStr = entry.timestamp.toLocaleTimeString('nl-NL', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      });
                      
                      return (
                        <div 
                          key={idx}
                          className="flex items-center gap-2 p-1.5 rounded text-xs"
                          style={{ 
                            backgroundColor: entry.type === 'error' ? '#2a1a1a' : 
                                            entry.type === 'tool_complete' ? '#1a2a1a' : 
                                            '#1a1a1a'
                          }}
                        >
                          <span className="text-[10px]" style={{ color: '#666' }}>{timeStr.slice(0, 5)}</span>
                          <span className="flex-1 truncate" style={{ 
                            color: entry.type === 'error' ? '#ff8888' : BRAND_COLORS.white 
                          }}>
                            {entry.icon} {entry.message}
                          </span>
                          {entry.duration !== undefined && (
                            <span className="text-[10px]" style={{ color: '#44ff44' }}>
                              {(entry.duration / 1000).toFixed(1)}s
                            </span>
                          )}
                        </div>
                      );
                    })}
                    
                    {isGenerating && (
                      <div 
                        className="flex items-center gap-2 p-2 rounded text-xs"
                        style={{ backgroundColor: '#1a1a1a' }}
                      >
                        <Loader2 
                          className="w-3 h-3 animate-spin"
                          style={{ color: BRAND_COLORS.orange }}
                        />
                        <span style={{ color: '#8a8a8a' }}>
                          Wacht op volgende stap...
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Status Canvas - Floating overlay rechts - VERWIJDERD, nu geïntegreerd in chat */}
          {false && showStatusCanvas && statusLog.length > 0 && (
            <div 
              className="absolute right-4 top-4 w-96 max-h-[80vh] rounded-lg shadow-2xl border overflow-hidden z-50"
              style={{ 
                backgroundColor: '#0a0a0a',
                borderColor: BRAND_COLORS.orange,
                borderWidth: '2px'
              }}
            >
              {/* Canvas Header */}
              <div 
                className="px-4 py-3 border-b flex items-center justify-between"
                style={{ 
                  backgroundColor: '#1a1a1a',
                  borderColor: '#2a2a2a'
                }}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: BRAND_COLORS.orange }}
                  >
                    <Bot className="w-4 h-4" style={{ color: BRAND_COLORS.white }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm" style={{ color: BRAND_COLORS.white }}>
                      AI Agent Status
                    </h3>
                    <p className="text-xs" style={{ color: '#8a8a8a' }}>
                      {statusLog.length} stappen voltooid
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {isGenerating && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded text-xs"
                      style={{ 
                        backgroundColor: '#1a1a1a',
                        color: BRAND_COLORS.orange
                      }}
                    >
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Actief</span>
                    </div>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowStatusCanvas(false)}
                    className="h-7 w-7 p-0"
                    style={{ color: '#8a8a8a' }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Canvas Body - Scrollable Log */}
              <ScrollArea className="h-[calc(80vh-80px)]">
                <div className="p-4 space-y-2">
                  {statusLog.map((entry, idx) => {
                    const timeStr = entry.timestamp.toLocaleTimeString('nl-NL', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    });
                    
                    return (
                      <div 
                        key={idx}
                        className="flex items-start gap-3 p-2 rounded transition-all hover:bg-opacity-80"
                        style={{ 
                          backgroundColor: entry.type === 'error' ? '#2a1a1a' : 
                                          entry.type === 'tool_complete' ? '#1a2a1a' : 
                                          '#1a1a1a'
                        }}
                      >
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ 
                            backgroundColor: entry.type === 'error' ? '#ff4444' :
                                           entry.type === 'tool_complete' ? '#44ff44' :
                                           BRAND_COLORS.orange + '40'
                          }}
                        >
                          <span className="text-base">{entry.icon}</span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge 
                              className="text-xs px-1.5 py-0"
                              style={{ 
                                backgroundColor: entry.type === 'error' ? '#ff4444' :
                                               entry.type === 'tool_complete' ? '#44ff44' :
                                               entry.type === 'tool_start' ? BRAND_COLORS.orange :
                                               '#666',
                                color: BRAND_COLORS.white
                              }}
                            >
                              {entry.type === 'status' ? 'STATUS' :
                               entry.type === 'tool_start' ? 'TOOL' :
                               entry.type === 'tool_complete' ? 'DONE' :
                               entry.type === 'heartbeat' ? 'PROGRESS' :
                               'ERROR'}
                            </Badge>
                            <span className="text-xs font-mono" style={{ color: '#666' }}>
                              {timeStr}
                            </span>
                            {entry.duration !== undefined && (
                              <span 
                                className="text-xs font-mono px-1.5 py-0.5 rounded"
                                style={{ 
                                  backgroundColor: '#1a2a1a',
                                  color: '#44ff44'
                                }}
                              >
                                {(entry.duration / 1000).toFixed(1)}s
                              </span>
                            )}
                          </div>
                          
                          <p 
                            className="text-sm leading-tight break-words"
                            style={{ color: entry.type === 'error' ? '#ff8888' : BRAND_COLORS.white }}
                          >
                            {entry.message}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  
                  {isGenerating && (
                    <div 
                      className="flex items-center gap-2 p-3 rounded"
                      style={{ backgroundColor: '#1a1a1a' }}
                    >
                      <Loader2 
                        className="w-4 h-4 animate-spin"
                        style={{ color: BRAND_COLORS.orange }}
                      />
                      <span className="text-sm" style={{ color: '#8a8a8a' }}>
                        Bezig met genereren...
                      </span>
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              {/* Canvas Footer */}
              <div 
                className="px-4 py-2 border-t flex items-center justify-between"
                style={{ 
                  backgroundColor: '#1a1a1a',
                  borderColor: '#2a2a2a'
                }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearStatusLog}
                  className="text-xs h-7"
                  style={{ color: '#8a8a8a' }}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Wis Log
                </Button>
                
                {isGenerating && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={stopGeneration}
                    className="text-xs h-7"
                    style={{ 
                      backgroundColor: '#ff4444',
                      color: BRAND_COLORS.white
                    }}
                  >
                    <X className="w-3 h-3 mr-1" />
                    Stop
                  </Button>
                )}
              </div>
            </div>
          )}
          
          {/* Blog Canvas - Floating overlay (Gemini style) */}
          {showBlogCanvas && (
            <div 
              className="fixed top-0 left-0 w-full h-full z-50 flex items-center justify-center p-4"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                backdropFilter: 'blur(4px)'
              }}
              onClick={() => setShowBlogCanvas(false)}
            >
              <div 
                className="w-full max-w-4xl h-[90vh] flex flex-col rounded-lg overflow-hidden"
                style={{
                  backgroundColor: '#0a0a0a',
                  border: `1px solid ${BRAND_COLORS.orange}`
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Canvas Header */}
                <div 
                  className="p-4 border-b flex items-center justify-between"
                  style={{
                    backgroundColor: '#1a1a1a',
                    borderColor: '#2a2a2a'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: BRAND_COLORS.orange }}
                    >
                      <FileText className="w-5 h-5" style={{ color: BRAND_COLORS.white }} />
                    </div>
                    <div>
                      <h3 className="font-semibold" style={{ color: BRAND_COLORS.white }}>
                        {blogCanvasTitle}
                      </h3>
                      <p className="text-xs" style={{ color: '#8a8a8a' }}>
                        Blog Content Canvas
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(blogCanvasContent);
                        toast.success('Content gekopieerd naar klembord');
                      }}
                      style={{
                        backgroundColor: '#1a1a1a',
                        borderColor: '#2a2a2a',
                        color: BRAND_COLORS.white
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Kopieer
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowBlogCanvas(false)}
                      style={{
                        backgroundColor: '#1a1a1a',
                        color: BRAND_COLORS.white
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Canvas Body - Scrollable Content */}
                <ScrollArea className="flex-1 p-8">
                  <div 
                    className="prose prose-lg max-w-none"
                    style={{ 
                      color: BRAND_COLORS.white,
                      maxWidth: '100%'
                    }}
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ node, ...props }) => (
                          <h1 
                            {...props} 
                            style={{ 
                              color: BRAND_COLORS.white,
                              fontSize: '2.5em',
                              fontWeight: 'bold',
                              marginBottom: '0.6em',
                              marginTop: '0.4em',
                              lineHeight: '1.2',
                              borderBottom: `3px solid ${BRAND_COLORS.orange}`,
                              paddingBottom: '0.3em'
                            }} 
                          />
                        ),
                        h2: ({ node, ...props }) => (
                          <h2 
                            {...props} 
                            style={{ 
                              color: BRAND_COLORS.orange,
                              fontSize: '2em',
                              fontWeight: 'bold',
                              marginTop: '1.5em',
                              marginBottom: '0.6em',
                              lineHeight: '1.3'
                            }} 
                          />
                        ),
                        h3: ({ node, ...props }) => (
                          <h3 
                            {...props} 
                            style={{ 
                              color: BRAND_COLORS.white,
                              fontSize: '1.5em',
                              fontWeight: '600',
                              marginTop: '1.2em',
                              marginBottom: '0.5em',
                              lineHeight: '1.4'
                            }} 
                          />
                        ),
                        h4: ({ node, ...props }) => (
                          <h4 
                            {...props} 
                            style={{ 
                              color: BRAND_COLORS.white,
                              fontSize: '1.25em',
                              fontWeight: '600',
                              marginTop: '1em',
                              marginBottom: '0.5em',
                              lineHeight: '1.4'
                            }} 
                          />
                        ),
                        p: ({ node, ...props }) => (
                          <p 
                            {...props} 
                            style={{ 
                              color: BRAND_COLORS.gray[200],
                              fontSize: '1.05em',
                              lineHeight: '1.8',
                              marginBottom: '1.2em',
                              textAlign: 'justify'
                            }} 
                          />
                        ),
                        a: ({ node, ...props }) => (
                          <a 
                            {...props} 
                            style={{ 
                              color: BRAND_COLORS.orange,
                              textDecoration: 'underline'
                            }} 
                            target="_blank"
                            rel="noopener noreferrer"
                          />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul 
                            {...props} 
                            style={{ 
                              color: BRAND_COLORS.gray[200],
                              marginLeft: '2em',
                              marginBottom: '1.2em',
                              listStyleType: 'disc',
                              paddingLeft: '0.5em'
                            }} 
                          />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol 
                            {...props} 
                            style={{ 
                              color: BRAND_COLORS.gray[200],
                              marginLeft: '2em',
                              marginBottom: '1.2em',
                              listStyleType: 'decimal',
                              paddingLeft: '0.5em'
                            }} 
                          />
                        ),
                        li: ({ node, ...props }) => (
                          <li 
                            {...props} 
                            style={{ 
                              color: BRAND_COLORS.gray[200],
                              marginBottom: '0.6em',
                              lineHeight: '1.7',
                              paddingLeft: '0.3em'
                            }} 
                          />
                        ),
                        strong: ({ node, ...props }) => (
                          <strong 
                            {...props} 
                            style={{ 
                              color: BRAND_COLORS.white,
                              fontWeight: 'bold'
                            }} 
                          />
                        ),
                        em: ({ node, ...props }) => (
                          <em 
                            {...props} 
                            style={{ 
                              color: BRAND_COLORS.white,
                              fontStyle: 'italic'
                            }} 
                          />
                        ),
                        blockquote: ({ node, ...props }) => (
                          <blockquote 
                            {...props} 
                            style={{ 
                              borderLeft: `4px solid ${BRAND_COLORS.orange}`,
                              paddingLeft: '1em',
                              marginLeft: 0,
                              marginBottom: '1em',
                              color: BRAND_COLORS.gray[300],
                              fontStyle: 'italic'
                            }} 
                          />
                        ),
                      }}
                    >
                      {blogCanvasContent}
                    </ReactMarkdown>
                  </div>
                </ScrollArea>
                
                {/* Canvas Footer - Actions & Edit */}
                <div 
                  className="border-t"
                  style={{
                    backgroundColor: '#1a1a1a',
                    borderColor: '#2a2a2a'
                  }}
                >
                  {/* Edit Section */}
                  <div className="p-3 border-b" style={{ borderColor: '#2a2a2a' }}>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Vraag om aanpassingen... (bijv. 'Maak de intro korter' of 'Voeg een conclusie toe')"
                        value={canvasEditInput}
                        onChange={(e) => setCanvasEditInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey && canvasEditInput.trim() && !isEditingCanvas) {
                            e.preventDefault();
                            handleCanvasEdit();
                          }
                        }}
                        disabled={isEditingCanvas}
                        style={{
                          backgroundColor: '#0a0a0a',
                          borderColor: '#2a2a2a',
                          color: BRAND_COLORS.white
                        }}
                      />
                      <Button
                        onClick={handleCanvasEdit}
                        disabled={!canvasEditInput.trim() || isEditingCanvas}
                        style={{
                          backgroundColor: BRAND_COLORS.orange,
                          color: BRAND_COLORS.white
                        }}
                      >
                        {isEditingCanvas ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Bezig...
                          </>
                        ) : (
                          <>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Wijzig met AI
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="p-4 flex items-center justify-between">
                    <p className="text-sm" style={{ color: '#8a8a8a' }}>
                      {blogCanvasContent.split(' ').length} woorden • {blogCanvasContent.length} karakters
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setWpContent(blogCanvasContent);
                          setShowWordPressDialog(true);
                        }}
                        style={{
                          backgroundColor: '#1a1a1a',
                          borderColor: '#2a2a2a',
                          color: BRAND_COLORS.white
                        }}
                      >
                        WordPress Publiceren
                      </Button>
                      <Button
                        onClick={() => {
                          const blob = new Blob([blogCanvasContent], { type: 'text/markdown' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${blogCanvasTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
                          a.click();
                          URL.revokeObjectURL(url);
                          toast.success('Blog gedownload als Markdown');
                        }}
                        style={{
                          backgroundColor: BRAND_COLORS.orange,
                          color: BRAND_COLORS.white
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Chat Header - ChatGPT-stijl: Simpel met New Chat + Historie */}
          <div 
            className="p-3 sm:p-4 border-b shadow-sm"
            style={{ 
              backgroundColor: BRAND_COLORS.background,
              borderColor: BRAND_COLORS.border
            }}
          >
            <div className="flex items-center justify-between gap-2 px-1 sm:px-0">
              {/* Left - New Chat + History Dropdown */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {/* New Chat Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Reset naar nieuwe chat (zoals ChatGPT)
                    setCurrentConversation(null);
                    setMessages([]);
                    setSkipAutoLoad(true);
                    localStorage.removeItem('writgo_last_conversation_id');
                    toast.success('Nieuwe chat gestart');
                  }}
                  className="flex-shrink-0 hover:bg-gray-100"
                  style={{
                    backgroundColor: BRAND_COLORS.background,
                    borderColor: BRAND_COLORS.border,
                    color: BRAND_COLORS.textPrimary
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Nieuwe Chat</span>
                </Button>
                
                {/* History Dropdown - ChatGPT-stijl */}
                <DropdownMenu open={showHistoryDropdown} onOpenChange={setShowHistoryDropdown}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-shrink-0 hover:bg-gray-100"
                      style={{
                        backgroundColor: BRAND_COLORS.background,
                        borderColor: BRAND_COLORS.border,
                        color: BRAND_COLORS.textPrimary
                      }}
                    >
                      <MessageSquare className="w-4 h-4 mr-1" />
                      <span className="hidden sm:inline">Geschiedenis</span>
                      <ChevronDown className="w-3 h-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    className="w-[300px] max-h-[400px] overflow-y-auto"
                    style={{
                      backgroundColor: BRAND_COLORS.cardBg,
                      borderColor: BRAND_COLORS.border,
                      color: BRAND_COLORS.textPrimary
                    }}
                  >
                    <DropdownMenuLabel style={{ color: BRAND_COLORS.orange }}>
                      Chat Geschiedenis
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator style={{ backgroundColor: BRAND_COLORS.border }} />
                    
                    {conversations.length === 0 ? (
                      <div className="text-center py-4 px-2" style={{ color: BRAND_COLORS.textMuted }}>
                        <p className="text-sm">Nog geen gesprekken</p>
                      </div>
                    ) : (
                      conversations
                        .sort((a, b) => {
                          if (a.isPinned && !b.isPinned) return -1;
                          if (!a.isPinned && b.isPinned) return 1;
                          return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
                        })
                        .slice(0, 10) // Toon max 10 meest recente
                        .map((conv) => (
                          <DropdownMenuItem
                            key={conv.id}
                            onClick={() => {
                              loadConversation(conv);
                              setShowHistoryDropdown(false);
                            }}
                            className="cursor-pointer hover:bg-gray-50"
                            style={{ 
                              color: currentConversation?.id === conv.id ? BRAND_COLORS.orange : BRAND_COLORS.textPrimary,
                              backgroundColor: currentConversation?.id === conv.id ? BRAND_COLORS.backgroundSoft : 'transparent'
                            }}
                          >
                            <div className="flex flex-col gap-1 w-full">
                              <div className="flex items-center gap-2">
                                {conv.isPinned && (
                                  <Pin className="w-3 h-3 flex-shrink-0" style={{ color: BRAND_COLORS.orange }} />
                                )}
                                <span className="text-sm font-medium truncate flex-1">
                                  {conv.title}
                                </span>
                              </div>
                              <span className="text-xs" style={{ color: BRAND_COLORS.textMuted }}>
                                {new Date(conv.lastMessageAt).toLocaleDateString('nl-NL')}
                                {' • '}
                                {conv._count?.messages || 0} berichten
                              </span>
                            </div>
                          </DropdownMenuItem>
                        ))
                    )}
                    
                    {conversations.length > 0 && (
                      <>
                        <DropdownMenuSeparator style={{ backgroundColor: BRAND_COLORS.border }} />
                        <DropdownMenuItem
                          onClick={() => {
                            setShowSettings(true);
                            setShowHistoryDropdown(false);
                          }}
                          className="hover:bg-gray-50"
                          style={{ color: BRAND_COLORS.textPrimary }}
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Alle chats beheren
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <div className="min-w-0">
                  <h2 className="font-semibold text-sm md:text-base truncate" style={{ color: BRAND_COLORS.textPrimary }}>
                    {currentConversation?.title || 'WritgoAI Chat'}
                  </h2>
                  <p className="text-xs hidden md:block" style={{ color: BRAND_COLORS.textSecondary }}>
                    Typ gewoon wat je wilt - ik beslis zelf wat te doen
                  </p>
                </div>
              </div>

              {/* Right - Credits */}
              <div className="flex-shrink-0">
                <CreditDisplay
                  clientId={clientId || undefined}
                  showButton={true}
                  size="sm"
                />
              </div>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4 sm:p-6 md:p-8" ref={scrollRef} style={{ backgroundColor: BRAND_COLORS.backgroundSoft, overflowX: 'hidden' }}>
            <div className="max-w-full sm:max-w-6xl mx-auto space-y-4 px-2 sm:px-4 md:px-0" style={{ overflowX: 'hidden' }}>


              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 sm:gap-3 px-2 sm:px-0 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                  style={{ 
                    maxWidth: '100%',
                    overflowX: 'hidden'
                  }}
                >
                  {message.role === 'assistant' && (
                    <div 
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: BRAND_COLORS.orange }}
                    >
                      <Bot className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: BRAND_COLORS.white }} />
                    </div>
                  )}
                  
                  <div className={`flex-1 max-w-full sm:max-w-3xl min-w-0`} style={{ maxWidth: '100%', overflowX: 'hidden' }}>
                    <Card 
                      className="p-3 sm:p-4 overflow-hidden shadow-sm"
                      style={{
                        backgroundColor: message.role === 'user' 
                          ? BRAND_COLORS.orange
                          : BRAND_COLORS.cardBg,
                        border: `1px solid ${BRAND_COLORS.border}`,
                        color: message.role === 'user' ? '#fff' : BRAND_COLORS.textPrimary
                      }}
                    >
                      {/* Check if content should be shown in canvas */}
                      {message.role === 'assistant' && typeof message.content === 'string' && shouldShowInCanvas(message.content) ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5" style={{ color: BRAND_COLORS.orange }} />
                            <span className="font-medium">Blog Content Gegenereerd</span>
                          </div>
                          <p className="text-sm" style={{ color: '#8a8a8a' }}>
                            {typeof message.content === 'string' ? message.content.substring(0, 200) + '...' : '[Content preview niet beschikbaar]'}
                          </p>
                          <Button
                            onClick={() => {
                              const content = typeof message.content === 'string' ? message.content : '';
                              const title = content.match(/^#\s+(.+)/m)?.[1] || 'Generated Content';
                              setBlogCanvasTitle(title);
                              setBlogCanvasContent(content);
                              setShowBlogCanvas(true);
                            }}
                            className="w-full"
                            style={{
                              backgroundColor: BRAND_COLORS.orange,
                              color: BRAND_COLORS.white
                            }}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Open in Canvas
                          </Button>
                        </div>
                      ) : (
                        <div 
                          className="prose prose-chat max-w-none break-words"
                          style={{ 
                            color: message.role === 'user' ? '#fff' : BRAND_COLORS.textPrimary,
                            overflowWrap: 'anywhere',
                            wordBreak: 'break-word',
                            maxWidth: '100%',
                            width: '100%',
                            overflowX: 'hidden'
                          }}
                        >
                          {/* Show uploaded files if present */}
                          {message.images && message.images.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {message.images.map((img, idx) => (
                                <div key={idx} className="file-upload-card" style={{ marginBottom: '12px', width: '100%' }}>
                                  <div className="file-icon" style={{ background: 'linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%)' }}>
                                    🖼️
                                  </div>
                                  <div className="file-info">
                                    <div className="file-name">Afbeelding {idx + 1}</div>
                                    <div className="file-meta">Toegevoegd aan bericht</div>
                                  </div>
                                  <img src={img} alt={`Upload ${idx + 1}`} style={{ maxWidth: '200px', borderRadius: '8px', marginLeft: 'auto' }} />
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {typeof message.content === 'string' ? (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                            // Headers met mooie styling (responsive)
                            h1: ({ node, ...props }) => (
                              <h1 
                                {...props} 
                                className="break-words"
                                style={{ 
                                  color: message.role === 'user' ? '#fff' : BRAND_COLORS.textPrimary,
                                  fontSize: 'clamp(1.5em, 5vw, 2em)',
                                  fontWeight: 'bold',
                                  marginTop: '0.67em',
                                  marginBottom: '0.67em',
                                  lineHeight: '1.2',
                                  wordBreak: 'break-word',
                                  overflowWrap: 'anywhere'
                                }} 
                              />
                            ),
                            h2: ({ node, ...props }) => (
                              <h2 
                                {...props} 
                                className="break-words"
                                style={{ 
                                  color: message.role === 'user' ? '#fff' : BRAND_COLORS.orange,
                                  fontSize: 'clamp(1.25em, 4vw, 1.5em)',
                                  fontWeight: 'bold',
                                  marginTop: '2em',
                                  marginBottom: '1em',
                                  lineHeight: '1.3',
                                  wordBreak: 'break-word',
                                  overflowWrap: 'anywhere',
                                  borderBottom: `2px solid ${BRAND_COLORS.orange}`,
                                  paddingBottom: '0.5em'
                                }} 
                              />
                            ),
                            h3: ({ node, ...props }) => (
                              <h3 
                                {...props} 
                                className="break-words"
                                style={{ 
                                  color: message.role === 'user' ? '#fff' : BRAND_COLORS.textPrimary,
                                  fontSize: 'clamp(1.1em, 3.5vw, 1.25em)',
                                  fontWeight: 'bold',
                                  marginTop: '1.8em',
                                  marginBottom: '0.8em',
                                  lineHeight: '1.4',
                                  wordBreak: 'break-word',
                                  overflowWrap: 'anywhere'
                                }} 
                              />
                            ),
                            h4: ({ node, ...props }) => (
                              <h4 
                                {...props} 
                                style={{ 
                                  color: message.role === 'user' ? '#fff' : BRAND_COLORS.textPrimary,
                                  fontSize: '1.1em',
                                  fontWeight: 'bold',
                                  marginTop: '1.5em',
                                  marginBottom: '0.7em',
                                  lineHeight: '1.4'
                                }} 
                              />
                            ),
                            // Paragrafen met VEEL witruimte en goede line-height
                            p: ({ node, ...props }) => (
                              <p 
                                {...props} 
                                style={{ 
                                  color: BRAND_COLORS.white,
                                  marginBottom: '1.5em',
                                  marginTop: '0.5em',
                                  lineHeight: '1.9',
                                  fontSize: '1rem'
                                }} 
                              />
                            ),
                            // Lijsten met ruime spacing
                            ul: ({ node, ...props }) => (
                              <ul 
                                {...props} 
                                style={{ 
                                  color: BRAND_COLORS.white,
                                  marginTop: '1em',
                                  marginBottom: '1.5em',
                                  paddingLeft: '1.8em',
                                  lineHeight: '1.8'
                                }} 
                              />
                            ),
                            ol: ({ node, ...props }) => (
                              <ol 
                                {...props} 
                                style={{ 
                                  color: BRAND_COLORS.white,
                                  marginTop: '1em',
                                  marginBottom: '1.5em',
                                  paddingLeft: '1.8em',
                                  lineHeight: '1.8'
                                }} 
                              />
                            ),
                            li: ({ node, ...props }) => (
                              <li 
                                {...props} 
                                style={{ 
                                  color: BRAND_COLORS.white,
                                  marginBottom: '0.8em',
                                  lineHeight: '1.8',
                                  paddingLeft: '0.3em'
                                }} 
                              />
                            ),
                            // Vetgedrukte tekst
                            strong: ({ node, ...props }) => (
                              <strong 
                                {...props} 
                                style={{ 
                                  color: BRAND_COLORS.white,
                                  fontWeight: 'bold'
                                }} 
                              />
                            ),
                            em: ({ node, ...props }) => (
                              <em 
                                {...props} 
                                style={{ 
                                  color: BRAND_COLORS.white,
                                  fontStyle: 'italic'
                                }} 
                              />
                            ),
                            // Links - with hover effect and proper styling
                            a: ({ node, ...props }) => {
                              const href = props.href || '';
                              const isMapLink = href.includes('google.com/maps') || href.includes('google.nl/maps');
                              const isMailLink = href.startsWith('mailto:');
                              const isTelLink = href.startsWith('tel:');
                              
                              return (
                                <a
                                  {...props}
                                  target={isMailLink || isTelLink ? '_self' : '_blank'}
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 hover:gap-2 transition-all duration-200"
                                  style={{ 
                                    color: BRAND_COLORS.orange,
                                    textDecoration: 'none',
                                    fontWeight: '500',
                                    borderBottom: `1px solid ${BRAND_COLORS.orange}`,
                                    paddingBottom: '2px',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.color = BRAND_COLORS.orangeLight;
                                    e.currentTarget.style.borderBottomColor = BRAND_COLORS.orangeLight;
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.color = BRAND_COLORS.orange;
                                    e.currentTarget.style.borderBottomColor = BRAND_COLORS.orange;
                                  }}
                                />
                              );
                            },
                            // Code met betere spacing + YouTube & Model Tracking
                            code: ({ node, ...props }: any) => {
                              const isInline = !props.className;
                              const language = props.className?.replace('language-', '') || '';
                              const codeContent = props.children?.[0] || '';
                              
                              // 🎥 YouTube Video Embedding
                              if (language === 'youtube') {
                                const videoId = typeof codeContent === 'string' ? codeContent.trim() : '';
                                return (
                                  <div style={{ 
                                    marginTop: '2em', 
                                    marginBottom: '2em',
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    border: `2px solid ${BRAND_COLORS.orange}`
                                  }}>
                                    <iframe
                                      width="100%"
                                      height="400"
                                      src={`https://www.youtube.com/embed/${videoId}`}
                                      title="YouTube video player"
                                      frameBorder="0"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                      allowFullScreen
                                      style={{ 
                                        display: 'block',
                                        maxWidth: '100%'
                                      }}
                                    />
                                  </div>
                                );
                              }
                              
                              // 🤖 Model Tracking Display
                              if (language === 'models') {
                                const modelsText = typeof codeContent === 'string' ? codeContent : '';
                                const modelLines = modelsText.split('\n').filter((line: string) => line.trim());
                                
                                return (
                                  <div style={{ 
                                    marginTop: '2em', 
                                    marginBottom: '1em',
                                    padding: '1em',
                                    background: 'rgba(255, 140, 0, 0.1)',
                                    border: `1px solid ${BRAND_COLORS.orange}`,
                                    borderRadius: '8px'
                                  }}>
                                    <div style={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: '0.5em',
                                      marginBottom: '0.8em',
                                      fontSize: '0.9em',
                                      fontWeight: '600',
                                      color: BRAND_COLORS.orange
                                    }}>
                                      <span>🤖</span>
                                      <span>AI Modellen Gebruikt</span>
                                    </div>
                                    {modelLines.map((line: string, idx: number) => {
                                      const [model, purpose] = line.split(':').map((s: string) => s.trim());
                                      return (
                                        <div 
                                          key={idx}
                                          style={{ 
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: '0.5em',
                                            marginBottom: '0.5em',
                                            fontSize: '0.85em'
                                          }}
                                        >
                                          <span style={{ color: BRAND_COLORS.white, fontWeight: '500' }}>•</span>
                                          <div>
                                            <span style={{ color: BRAND_COLORS.white, fontWeight: '600' }}>{model}</span>
                                            {purpose && <span style={{ color: BRAND_COLORS.gray[400] }}> - {purpose}</span>}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              }
                              
                              // Regular code blocks
                              return isInline ? (
                                <code 
                                  {...props} 
                                  style={{ 
                                    backgroundColor: '#2a2a2a', 
                                    color: BRAND_COLORS.orange,
                                    padding: '0.3em 0.6em',
                                    borderRadius: '4px',
                                    fontSize: '0.9em',
                                    fontWeight: '500',
                                    border: `1px solid ${BRAND_COLORS.gray[700]}`
                                  }} 
                                />
                              ) : (
                                <code 
                                  {...props} 
                                  style={{ 
                                    backgroundColor: '#0a0a0a', 
                                    color: BRAND_COLORS.orange,
                                    display: 'block',
                                    padding: '1.2em',
                                    borderRadius: '8px',
                                    overflowX: 'auto',
                                    lineHeight: '1.6',
                                    fontSize: '0.95em'
                                  }} 
                                />
                              );
                            },
                            // Blockquotes met ruime spacing
                            blockquote: ({ node, ...props }) => (
                              <blockquote 
                                {...props} 
                                style={{ 
                                  borderLeft: `4px solid ${BRAND_COLORS.orange}`,
                                  paddingLeft: '1.5em',
                                  paddingTop: '0.8em',
                                  paddingBottom: '0.8em',
                                  marginLeft: 0,
                                  marginTop: '1.5em',
                                  marginBottom: '1.5em',
                                  color: BRAND_COLORS.gray[300],
                                  fontStyle: 'italic',
                                  lineHeight: '1.8',
                                  backgroundColor: 'rgba(255, 140, 0, 0.05)',
                                  borderRadius: '0 8px 8px 0'
                                }} 
                              />
                            ),
                            // Pre wrapper for code blocks met meer spacing
                            pre: ({ node, ...props }) => (
                              <pre 
                                {...props} 
                                style={{ 
                                  backgroundColor: '#0a0a0a',
                                  borderRadius: '8px',
                                  overflowX: 'auto',
                                  maxWidth: '100%',
                                  marginTop: '1.5em',
                                  marginBottom: '1.5em',
                                  padding: '1.2em',
                                  border: `1px solid ${BRAND_COLORS.gray[700]}`
                                }} 
                              />
                            ),
                            // Horizontal rules met veel spacing
                            hr: ({ node, ...props }) => (
                              <hr 
                                {...props} 
                                style={{ 
                                  border: 'none',
                                  borderTop: `2px solid ${BRAND_COLORS.gray[700]}`,
                                  marginTop: '2.5em',
                                  marginBottom: '2.5em',
                                  opacity: 0.5
                                }} 
                              />
                            ),
                            // Images - Embedded in de chat met ruime spacing
                            img: ({ node, ...props }: any) => (
                              <div style={{ marginBottom: '2em', marginTop: '2em' }}>
                                <div className="relative rounded-lg overflow-hidden" style={{ maxWidth: '100%', backgroundColor: '#0a0a0a' }}>
                                  <Image
                                    src={props.src || ''}
                                    alt={props.alt || 'Generated image'}
                                    width={800}
                                    height={600}
                                    style={{ 
                                      width: '100%', 
                                      height: 'auto',
                                      borderRadius: '8px'
                                    }}
                                    onError={(e: any) => {
                                      // Fallback als image niet laadt
                                      e.target.style.display = 'none';
                                      e.target.parentElement.innerHTML = `
                                        <div style="padding: 2em; text-align: center; background: #1a1a1a; border-radius: 8px;">
                                          <p style="color: ${BRAND_COLORS.textMuted}">🖼️ Afbeelding kon niet worden geladen</p>
                                          <a href="${props.src}" target="_blank" style="color: ${BRAND_COLORS.orange}; text-decoration: underline;">
                                            Link naar afbeelding
                                          </a>
                                        </div>
                                      `;
                                    }}
                                  />
                                </div>
                                {props.alt && props.alt !== 'image' && (
                                  <p style={{ 
                                    fontSize: '0.875em', 
                                    color: BRAND_COLORS.textMuted, 
                                    textAlign: 'center', 
                                    marginTop: '0.5em',
                                    fontStyle: 'italic'
                                  }}>
                                    {props.alt}
                                  </p>
                                )}
                              </div>
                            ),
                            // Tables met ruimere spacing
                            table: ({ node, ...props }) => (
                              <div style={{ overflowX: 'auto', maxWidth: '100%', marginTop: '1.5em', marginBottom: '1.5em' }}>
                                <table 
                                  {...props} 
                                  style={{ 
                                    borderCollapse: 'collapse',
                                    width: '100%',
                                    color: BRAND_COLORS.white,
                                    border: `1px solid ${BRAND_COLORS.gray[700]}`
                                  }} 
                                />
                              </div>
                            ),
                            th: ({ node, ...props }) => (
                              <th 
                                {...props} 
                                style={{ 
                                  border: `1px solid ${BRAND_COLORS.gray[700]}`,
                                  padding: '0.8em 1em',
                                  backgroundColor: '#1a1a1a',
                                  color: BRAND_COLORS.white,
                                  textAlign: 'left',
                                  fontWeight: '600',
                                  fontSize: '0.95em'
                                }} 
                              />
                            ),
                            td: ({ node, ...props }) => (
                              <td 
                                {...props} 
                                style={{ 
                                  border: `1px solid ${BRAND_COLORS.gray[700]}`,
                                  padding: '0.8em 1em',
                                  color: BRAND_COLORS.white,
                                  lineHeight: '1.6'
                                }} 
                              />
                            ),
                          }}
                        >
                          {linkifyText(message.content)}
                        </ReactMarkdown>
                          ) : (
                            <div className="text-sm" style={{ color: BRAND_COLORS.textMuted }}>
                              [Vision content - zie geüploade afbeeldingen]
                            </div>
                          )}
                        
                        {/* Model Info Badge - Toon welk AI model gebruikt is */}
                        {message.role === 'assistant' && message.model && (
                          <div className="mt-4 pt-3 border-t" style={{ borderColor: BRAND_COLORS.border }}>
                            <div className="flex items-center gap-2 text-xs" style={{ color: BRAND_COLORS.textMuted }}>
                              <Sparkles className="w-3 h-3" />
                              <span>Gegenereerd met: <strong style={{ color: BRAND_COLORS.orange }}>{message.model}</strong></span>
                              {message.metadata?.modelTier && (
                                <Badge 
                                  variant="outline" 
                                  className="text-xs"
                                  style={{ 
                                    borderColor: message.metadata.modelTier === 'premium' ? '#FFD700' : 
                                                message.metadata.modelTier === 'balanced' ? BRAND_COLORS.orange : '#888',
                                    color: message.metadata.modelTier === 'premium' ? '#FFD700' : 
                                           message.metadata.modelTier === 'balanced' ? BRAND_COLORS.orange : '#888'
                                  }}
                                >
                                  {message.metadata.modelTier === 'premium' ? '💎 Premium' : 
                                   message.metadata.modelTier === 'balanced' ? '⚖️ Balanced' : '💰 Budget'}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        </div>
                      )}

                      {/* Images */}
                      {message.images && message.images.length > 0 && (
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          {message.images.map((img, idx) => (
                            <div key={idx} className="relative aspect-square rounded-lg overflow-hidden">
                              <Image
                                src={img}
                                alt={`Generated ${idx + 1}`}
                                fill
                                className="object-cover"
                              />
                              <a
                                href={img}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute top-2 right-2 p-2 rounded-full hover:bg-black/80 transition-colors"
                                style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
                              >
                                <Download className="w-4 h-4" style={{ color: BRAND_COLORS.white }} />
                              </a>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Videos */}
                      {message.videos && message.videos.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {message.videos.map((video) => (
                            <div key={video.id} className="border rounded-lg p-4" style={{ borderColor: '#2a2a2a', backgroundColor: '#0a0a0a' }}>
                              {video.status === 'completed' && video.url ? (
                                <div>
                                  <video
                                    src={video.url}
                                    controls
                                    className="w-full rounded-lg"
                                    poster={video.thumbnailUrl}
                                  />
                                  <div className="mt-2 flex gap-2">
                                    <a
                                      href={video.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex-1"
                                    >
                                      <Button className="w-full" style={{ backgroundColor: BRAND_COLORS.orange }}>
                                        <Download className="w-4 h-4 mr-2" />
                                        Download Video
                                      </Button>
                                    </a>
                                    <a
                                      href={video.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <Button variant="outline" style={{ borderColor: '#2a2a2a', color: BRAND_COLORS.white, backgroundColor: '#1a1a1a' }}>
                                        <ExternalLink className="w-4 h-4" />
                                      </Button>
                                    </a>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-4">
                                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" style={{ color: BRAND_COLORS.orange }} />
                                  <p className="text-sm" style={{ color: '#8a8a8a' }}>
                                    {video.status === 'processing' ? 'Video wordt gegenereerd...' : 'Video status: ' + video.status}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Metadata - Verborgen voor cleaner interface */}
                      
                      {/* Action Buttons - Alleen voor assistant berichten */}
                      {message.role === 'assistant' && (
                        <div className="mt-3 flex flex-wrap gap-2 border-t pt-3" style={{ borderColor: '#2a2a2a' }}>
                          {/* Proposal Action Buttons - "Nu Starten" en "Aanpassen" */}
                          {(() => {
                            if (typeof message.content !== 'string') return null;
                            const proposal = detectProposal(message.content);
                            if (proposal.isProposal) {
                              return (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      if (proposal.type === 'blog') {
                                        setInput('Schrijf nu de volledige blog met de volgende details:\\n' + message.content);
                                        setTimeout(() => sendMessage(), 100);
                                      } else if (proposal.type === 'video') {
                                        setInput('Genereer nu de video met het volgende script:\\n' + message.content);
                                        setTimeout(() => sendMessage(), 100);
                                      } else if (proposal.type === 'social') {
                                        const content = typeof message.content === 'string' ? message.content : '';
                                        setSocialContent(content);
                                        setShowSocialDialog(true);
                                      }
                                    }}
                                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:opacity-90 text-white font-semibold"
                                  >
                                    <Play className="w-3 h-3 mr-1" />
                                    Nu Starten
                                  </Button>
                                  
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setInput('Pas het volgende aan: ' + message.content);
                                    }}
                                    style={{ 
                                      borderColor: BRAND_COLORS.orange, 
                                      color: BRAND_COLORS.orange,
                                      backgroundColor: 'transparent'
                                    }}
                                    className="hover:bg-gray-800 font-semibold"
                                  >
                                    <Edit3 className="w-3 h-3 mr-1" />
                                    Aanpassen
                                  </Button>
                                  
                                  <div className="w-full md:hidden" />
                                </>
                              );
                            }
                            return null;
                          })()}
                          
                          {/* Copy Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const content = typeof message.content === 'string' ? message.content : JSON.stringify(message.content);
                              navigator.clipboard.writeText(content);
                              toast.success('Content gekopieerd naar klembord');
                            }}
                            style={{ 
                              borderColor: '#2a2a2a', 
                              color: BRAND_COLORS.white,
                              backgroundColor: 'transparent'
                            }}
                            className="hover:bg-gray-800"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Kopiëren
                          </Button>
                          
                          {/* WordPress Export Button - alleen als WordPress is geconfigureerd */}
                          {wordpressConfig && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const content = typeof message.content === 'string' ? message.content : '';
                                setWpContent(content);
                                setWpTitle('');
                                setWpExcerpt('');
                                setWpStatus('draft');
                                setShowWordPressDialog(true);
                              }}
                              style={{ 
                                borderColor: '#2a2a2a', 
                                color: BRAND_COLORS.orange,
                                backgroundColor: 'transparent'
                              }}
                              className="hover:bg-gray-800"
                            >
                              <FileText className="w-3 h-3 mr-1" />
                              WordPress
                            </Button>
                          )}
                          
                          {/* Social Media Post Button - alleen als Late.dev is verbonden */}
                          {lateDevConnected && connectedSocialAccounts.length > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const content = typeof message.content === 'string' ? message.content : '';
                                setSocialContent(content);
                                setSocialPlatforms([]);
                                setSocialPublishNow(false);
                                setShowSocialDialog(true);
                              }}
                              style={{ 
                                borderColor: '#2a2a2a', 
                                color: BRAND_COLORS.orange,
                                backgroundColor: 'transparent'
                              }}
                              className="hover:bg-gray-800"
                            >
                              <Share2 className="w-3 h-3 mr-1" />
                              Social Media
                            </Button>
                          )}
                        </div>
                      )}
                    </Card>
                  </div>

                  {message.role === 'user' && (
                    <div 
                      className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: '#2a2a2a' }}
                    >
                      <User className="w-5 h-5" style={{ color: BRAND_COLORS.white }} />
                    </div>
                  )}
                </div>
              ))}

              {/* Loading State verwijderd - wordt al bovenin Status Terminal getoond */}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div 
            className="p-4 sm:p-6 border-t"
            style={{ 
              backgroundColor: BRAND_COLORS.backgroundSoft,
              borderColor: BRAND_COLORS.border
            }}
          >
            <div className="max-w-full sm:max-w-4xl mx-auto space-y-3 px-2 sm:px-0">
              {/* Selected Options Display */}
              {Object.keys(selectedOptions).length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 rounded-lg" style={{ backgroundColor: BRAND_COLORS.backgroundSoft }}>
                  <span className="text-xs font-semibold" style={{ color: BRAND_COLORS.textSecondary }}>
                    Geselecteerde opties:
                  </span>
                  {Object.entries(selectedOptions).map(([category, value]) => (
                    <Badge 
                      key={category}
                      variant="secondary"
                      className="flex items-center gap-1 cursor-pointer hover:opacity-80"
                      style={{ 
                        backgroundColor: BRAND_COLORS.orange,
                        color: BRAND_COLORS.white 
                      }}
                      onClick={() => removeSelectedOption(category)}
                    >
                      <span>{category}: {value}</span>
                      <X className="w-3 h-3" />
                    </Badge>
                  ))}
                </div>
              )}
              
              {/* Uploaded Files Preview - IMPROVED UI */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2 p-3 rounded-lg border" style={{ backgroundColor: BRAND_COLORS.backgroundSoft, borderColor: BRAND_COLORS.border }}>
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="file-upload-card">
                      <div className="file-icon" style={{ 
                        background: file.type.startsWith('image/') 
                          ? 'linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%)' 
                          : 'linear-gradient(135deg, #64748B 0%, #94A3B8 100%)'
                      }}>
                        {file.type.startsWith('image/') ? '🖼️' : '📄'}
                      </div>
                      <div className="file-info">
                        <div className="file-name">{file.name}</div>
                        <div className="file-meta">
                          {file.type.startsWith('image/') ? 'Afbeelding' : 'Document'} • {(file.size / 1024).toFixed(1)}KB
                        </div>
                      </div>
                      {file.type.startsWith('image/') && (
                        <img 
                          src={file.url} 
                          alt={file.name} 
                          style={{ 
                            maxWidth: '80px', 
                            maxHeight: '80px', 
                            borderRadius: '8px', 
                            objectFit: 'cover',
                            marginLeft: 'auto'
                          }} 
                        />
                      )}
                      <button
                        onClick={() => removeUploadedFile(index)}
                        className="ml-2 p-2 rounded-full transition-all hover:bg-red-100 hover:scale-110"
                        title="Verwijder bestand"
                      >
                        <X className="w-4 h-4" style={{ color: '#ef4444' }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Input Field */}
              <div className="flex gap-3 items-end">
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  accept="image/*,.pdf,.doc,.docx,.txt,.csv"
                  multiple
                  className="hidden"
                />
                
                {/* File upload button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading || uploading}
                  className="shrink-0 w-10 h-10 rounded-lg hover:bg-gray-100"
                  style={{ 
                    color: BRAND_COLORS.textSecondary
                  }}
                  title="Upload bestand"
                >
                  {uploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ImageIcon className="w-5 h-5" />
                  )}
                </Button>
                
                <div className="flex-1 flex flex-col gap-2 min-w-0">
                  <div className="relative flex items-center gap-2 rounded-2xl border shadow-sm bg-white" style={{ borderColor: BRAND_COLORS.border }}>
                    <Textarea
                      id="message-input"
                      ref={inputRef}
                      value={input}
                      onChange={(e) => handleInputChange(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Typ je vraag... (bijvoorbeeld: 'Schrijf een blog over AI')"
                      className="flex-1 min-h-[56px] max-h-[200px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-4 py-4 rounded-2xl bg-transparent"
                      style={{
                        color: BRAND_COLORS.textPrimary
                      }}
                      disabled={loading}
                      rows={1}
                    />
                    
                    {/* Send / Stop Button - Inside the textarea */}
                    {isGenerating ? (
                      <Button
                        onClick={stopGeneration}
                        size="icon"
                        className="shrink-0 mr-2 w-9 h-9 rounded-lg"
                        variant="destructive"
                        style={{ backgroundColor: '#ef4444' }}
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    ) : (
                      <Button
                        onClick={sendMessage}
                        disabled={loading || !input.trim()}
                        size="icon"
                        className="shrink-0 mr-2 w-9 h-9 rounded-lg"
                        style={{ 
                          backgroundColor: input.trim() ? BRAND_COLORS.orange : BRAND_COLORS.gray[300],
                          opacity: input.trim() ? 1 : 0.5
                        }}
                      >
                        {loading ? (
                          <Loader2 className="w-5 h-5 animate-spin text-white" />
                        ) : (
                          <Send className="w-5 h-5 text-white" />
                        )}
                      </Button>
                    )}
                  </div>
                  
                  {/* Progress indicator - alleen tonen tijdens generatie */}
                  {isGenerating && currentStep && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-zinc-9000/10 border border-orange-500/20">
                      <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                      <span className="text-sm text-orange-500 font-medium">
                        {currentStep}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <p className="text-xs text-center mt-2 px-4" style={{ color: BRAND_COLORS.gray[500] }}>
                WritgoAI DeepAgent kan fouten maken. Controleer belangrijke informatie.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* WordPress Dialog */}
      <Dialog open={showWordPressDialog} onOpenChange={setShowWordPressDialog}>
        <DialogContent className="max-w-2xl" style={{ backgroundColor: '#0a0a0a', borderColor: '#2a2a2a' }}>
          <DialogHeader>
            <DialogTitle style={{ color: BRAND_COLORS.white }}>
              <FileText className="w-5 h-5 inline mr-2" style={{ color: BRAND_COLORS.orange }} />
              Post naar WordPress
            </DialogTitle>
            <DialogDescription style={{ color: '#8a8a8a' }}>
              Publiceer je blog direct naar WordPress
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="wp-title" style={{ color: BRAND_COLORS.white }}>Titel</Label>
              <Input
                id="wp-title"
                value={wpTitle}
                onChange={(e) => setWpTitle(e.target.value)}
                placeholder="Blog titel..."
                style={{
                  backgroundColor: '#1a1a1a',
                  borderColor: '#2a2a2a',
                  color: BRAND_COLORS.white
                }}
              />
            </div>

            <div>
              <Label htmlFor="wp-excerpt" style={{ color: BRAND_COLORS.white }}>Excerpt (optioneel)</Label>
              <Textarea
                id="wp-excerpt"
                value={wpExcerpt}
                onChange={(e) => setWpExcerpt(e.target.value)}
                placeholder="Korte samenvatting..."
                rows={2}
                style={{
                  backgroundColor: '#1a1a1a',
                  borderColor: '#2a2a2a',
                  color: BRAND_COLORS.white
                }}
              />
            </div>

            <div>
              <Label htmlFor="wp-featured-image" style={{ color: BRAND_COLORS.white }}>
                <ImageIcon className="w-4 h-4 inline mr-1" style={{ color: BRAND_COLORS.orange }} />
                Uitgelichte afbeelding URL (optioneel)
              </Label>
              <Input
                id="wp-featured-image"
                value={wpFeaturedImage}
                onChange={(e) => setWpFeaturedImage(e.target.value)}
                placeholder="https://voorbeeld.nl/afbeelding.jpg"
                type="url"
                style={{
                  backgroundColor: '#1a1a1a',
                  borderColor: '#2a2a2a',
                  color: BRAND_COLORS.white
                }}
              />
              {wpFeaturedImage && (
                <div className="mt-2">
                  <img 
                    src={wpFeaturedImage} 
                    alt="Preview" 
                    className="w-full h-32 object-cover rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="wp-content" style={{ color: BRAND_COLORS.white }}>Content</Label>
              <Textarea
                id="wp-content"
                value={wpContent}
                onChange={(e) => setWpContent(e.target.value)}
                placeholder="Blog content in HTML of Markdown..."
                rows={10}
                style={{
                  backgroundColor: '#1a1a1a',
                  borderColor: '#2a2a2a',
                  color: BRAND_COLORS.white
                }}
              />
            </div>

            <div>
              <Label htmlFor="wp-status" style={{ color: BRAND_COLORS.white }}>Status</Label>
              <Select value={wpStatus} onValueChange={(value: 'publish' | 'draft') => setWpStatus(value)}>
                <SelectTrigger 
                  id="wp-status"
                  style={{
                    backgroundColor: '#1a1a1a',
                    borderColor: '#2a2a2a',
                    color: BRAND_COLORS.white
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: '#1a1a1a', borderColor: '#2a2a2a' }}>
                  <SelectItem value="draft" style={{ color: BRAND_COLORS.white }}>
                    Concept (draft)
                  </SelectItem>
                  <SelectItem value="publish" style={{ color: BRAND_COLORS.white }}>
                    Direct publiceren
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowWordPressDialog(false)}
                style={{ borderColor: '#2a2a2a', color: BRAND_COLORS.white }}
              >
                Annuleer
              </Button>
              <Button
                onClick={publishToWordPress}
                disabled={publishingWP || !wpTitle || !wpContent}
                style={{ backgroundColor: BRAND_COLORS.orange }}
              >
                {publishingWP ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Bezig met publiceren...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Publiceer
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Social Media Dialog */}
      <Dialog open={showSocialDialog} onOpenChange={setShowSocialDialog}>
        <DialogContent className="max-w-2xl" style={{ backgroundColor: '#0a0a0a', borderColor: '#2a2a2a' }}>
          <DialogHeader>
            <DialogTitle style={{ color: BRAND_COLORS.white }}>
              <Share2 className="w-5 h-5 inline mr-2" style={{ color: BRAND_COLORS.orange }} />
              Social Media Post
            </DialogTitle>
            <DialogDescription style={{ color: '#8a8a8a' }}>
              Post direct naar je social media kanalen via Late.dev
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="social-content" style={{ color: BRAND_COLORS.white }}>Content</Label>
              <Textarea
                id="social-content"
                value={socialContent}
                onChange={(e) => setSocialContent(e.target.value)}
                placeholder="Wat wil je delen?..."
                rows={6}
                style={{
                  backgroundColor: '#1a1a1a',
                  borderColor: '#2a2a2a',
                  color: BRAND_COLORS.white
                }}
              />
              <p className="text-xs mt-1" style={{ color: '#8a8a8a' }}>
                {socialContent.length} karakters
              </p>
            </div>

            <div>
              <Label style={{ color: BRAND_COLORS.white }}>Platforms</Label>
              <div className="space-y-2 mt-2">
                {['instagram', 'tiktok', 'youtube', 'facebook', 'linkedin'].map((platform) => (
                  <div key={platform} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`platform-${platform}`}
                      checked={socialPlatforms.includes(platform)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSocialPlatforms([...socialPlatforms, platform]);
                        } else {
                          setSocialPlatforms(socialPlatforms.filter(p => p !== platform));
                        }
                      }}
                      className="mr-2"
                    />
                    <Label 
                      htmlFor={`platform-${platform}`} 
                      className="capitalize cursor-pointer"
                      style={{ color: BRAND_COLORS.white }}
                    >
                      {platform}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="publish-now"
                checked={socialPublishNow}
                onChange={(e) => setSocialPublishNow(e.target.checked)}
              />
              <Label 
                htmlFor="publish-now" 
                className="cursor-pointer"
                style={{ color: BRAND_COLORS.white }}
              >
                Direct publiceren (anders als concept opslaan)
              </Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowSocialDialog(false)}
                style={{ borderColor: '#2a2a2a', color: BRAND_COLORS.white }}
              >
                Annuleer
              </Button>
              <Button
                onClick={postToSocial}
                disabled={publishingSocial || !socialContent || socialPlatforms.length === 0}
                style={{ backgroundColor: BRAND_COLORS.orange }}
              >
                {publishingSocial ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Bezig met posten...
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 mr-2" />
                    Post
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Code Canvas - Full screen overlay */}
      {showCodeCanvas && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowCodeCanvas(false)}
        >
          <div 
            className="w-full max-w-7xl h-[95vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <CodeCanvas
              initialHtml={codeCanvasHtml}
              initialCss={codeCanvasCss}
              initialJs={codeCanvasJs}
              title={codeCanvasTitle}
              description={codeCanvasDescription}
            />
          </div>
        </div>
      )}
    </>
  );
}
