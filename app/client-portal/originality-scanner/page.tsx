
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import CharacterCount from '@tiptap/extension-character-count';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Loader2,
  Shield,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Info,
  Undo,
  Redo,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Highlighter,
  RotateCcw,
  Save,
  Trash2,
  FileText,
  Download,
  ArrowLeft,
  Send,
  MessageSquare,
  History,
  X,
  Wand2,
  Zap,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface OriginalityScore {
  ai: number;
  original: number;
  score: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export default function OriginalityScannerPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [scanning, setScanning] = useState(false);
  const [humanizing, setHumanizing] = useState(false);
  const [score, setScore] = useState<OriginalityScore | null>(null);
  const [level, setLevel] = useState<'safe' | 'warning' | 'danger' | null>(null);
  const [message, setMessage] = useState<string>('');
  const [showDetails, setShowDetails] = useState(false);
  const [improvements, setImprovements] = useState<string[]>([]);
  const [beforeScore, setBeforeScore] = useState<OriginalityScore | null>(null);
  const [afterScore, setAfterScore] = useState<OriginalityScore | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [localStorageKey] = useState('originality-scanner-draft');
  const [provider, setProvider] = useState<'originality' | 'zerogpt'>('zerogpt'); // Always use ZeroGPT
  const [currentProvider, setCurrentProvider] = useState<string>('zerogpt'); // Always ZeroGPT
  const [fullReport, setFullReport] = useState<any>(null);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [sentenceData, setSentenceData] = useState<Array<{ text: string; ai_score: number }>>([]);
  const [rewritingAIParts, setRewritingAIParts] = useState(false);
  const [selectedSentences, setSelectedSentences] = useState<Set<number>>(new Set());
  const [iterativeHumanizing, setIterativeHumanizing] = useState(false);
  const [iterationProgress, setIterationProgress] = useState<{
    currentIteration: number;
    totalIterations: number;
    currentScore: number;
    message: string;
    scansPerformed: number;
    scansSaved: number;
  } | null>(null);
  
  // Chat state
  const [chatInstruction, setChatInstruction] = useState('');
  const [isImproving, setIsImproving] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Rewrite state
  const [activeTab, setActiveTab] = useState<'rewrite' | 'scan'>('rewrite');
  const [rewriteStyle, setRewriteStyle] = useState<'human' | 'professional' | 'friendly' | 'simple' | 'engaging' | 'academic'>('human');
  const [isRewriting, setIsRewriting] = useState(false);

  // Editor setup
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Plak of typ hier je tekst om te scannen op AI-detectie...',
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Color,
      TextStyle,
      CharacterCount,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-orange-500 underline cursor-pointer hover:text-orange-600',
        },
      }),
      Highlight.configure({
        multicolor: true,
      }),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[500px] px-6 py-4 [color:white] [&_*]:[color:white] [&_p]:[color:white] [&_h1]:[color:white] [&_h2]:[color:white] [&_h3]:[color:white] [&_li]:[color:white] [&_strong]:[color:white] [&_em]:[color:white]',
        style: 'color: black; -webkit-text-fill-color: white;',
      },
      handlePaste: (view, event) => {
        // Allow default paste behavior - will paste as black text internally
        return false;
      },
    },
    onUpdate: () => {
      setSaved(false);
      // Reset score when content changes
      setScore(null);
      setLevel(null);
      setMessage('');
      setShareUrl('');
      setSentenceData([]);
      setSelectedSentences(new Set());
    },
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (isMounted && status === 'unauthenticated') {
      router.push('/client-login');
    }
  }, [status, router, isMounted]);

  // Load draft from localStorage
  useEffect(() => {
    if (editor && isMounted) {
      const draft = localStorage.getItem(localStorageKey);
      if (draft) {
        try {
          editor.commands.setContent(JSON.parse(draft));
        } catch (e) {
          console.error('Failed to load draft:', e);
        }
      }
    }
  }, [editor, localStorageKey, isMounted]);

  // Save draft to localStorage
  const saveDraft = () => {
    if (editor) {
      const content = editor.getJSON();
      localStorage.setItem(localStorageKey, JSON.stringify(content));
      setSaved(true);
      toast.success('Concept opgeslagen');
      setTimeout(() => setSaved(false), 2000);
    }
  };

  // Clear editor
  const clearEditor = () => {
    if (editor && confirm('Weet je zeker dat je alles wilt wissen?')) {
      editor.commands.clearContent();
      localStorage.removeItem(localStorageKey);
      setScore(null);
      setLevel(null);
      setMessage('');
      toast.success('Editor gewist');
    }
  };

  const scanContent = async () => {
    if (!editor) return;

    const content = editor.getText();
    
    if (!content || content.trim().length < 50) {
      toast.error('Content te kort voor scanning (minimaal 50 karakters)');
      return;
    }

    setScanning(true);
    try {
      // Always use ZeroGPT for scanning
      const response = await fetch('/api/client/zerogpt/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Scan mislukt');
      }

      setScore(data.score);
      setLevel(data.level);
      setMessage(data.message);
      setCurrentProvider(data.provider || provider);
      setFullReport(data); // Store full report for download
      
      // Store sentence-level data
      if (data.sentences && data.sentences.length > 0) {
        setSentenceData(data.sentences);
        console.log('[Scan] Received', data.sentences.length, 'sentences with AI scores');
        
        // ZeroGPT marks AI sentences with isHighlighted flag
        const highlightedSentences = data.sentences.filter((s: any) => s.isHighlighted || s.ai_score > 50);
        if (highlightedSentences.length > 0) {
          console.log('[Scan] 🎯 ZeroGPT detected', highlightedSentences.length, 'AI sentences (highlighted in yellow)');
          console.log('[Scan] Preview of AI-detected sentences:');
          highlightedSentences.slice(0, 3).forEach((s: any, i: number) => {
            const preview = s.text.substring(0, 80) + (s.text.length > 80 ? '...' : '');
            console.log(`  [${i+1}] ${preview}`);
          });
        }
      } else {
        setSentenceData([]);
        console.log('[Scan] No sentence-level data available');
      }
      
      // Store share URL if available (Originality.AI)
      if (data.shareUrl) {
        setShareUrl(data.shareUrl);
        console.log('[Scan] Share URL received:', data.shareUrl);
      }

      // Show toast based on level
      if (data.level === 'safe') {
        toast.success('✅ Content lijkt menselijk geschreven!');
      } else if (data.level === 'warning') {
        toast.warning('⚠️ Matige AI-detectie - overweeg humanization');
      } else {
        toast.error('🚨 Hoge AI-detectie - humanization aanbevolen');
      }
    } catch (error: any) {
      console.error('Scan error:', error);
      toast.error(error.message || 'Fout bij scannen');
    } finally {
      setScanning(false);
    }
  };

  const downloadReport = () => {
    if (!fullReport || !score || !editor) {
      toast.error('Geen rapport beschikbaar om te downloaden');
      return;
    }

    const content = editor.getText();
    const reportContent = `AI DETECTIE RAPPORT
Gegenereerd: ${new Date().toLocaleString('nl-NL')}
Provider: ZeroGPT

====================================

AI SCORE: ${Math.round(score.ai)}%
ORIGINALITY SCORE: ${Math.round(score.original)}%
STATUS: ${level === 'safe' ? 'Veilig' : level === 'warning' ? 'Waarschuwing' : 'Gevaar'}

BEOORDELING:
${message}

====================================

CONTENT ANALYSE:
Lengte: ${content.length} karakters
Woorden: ~${Math.round(content.split(/\s+/).length)} woorden

${fullReport.sentences && fullReport.sentences.length > 0 ? `
ZINS-NIVEAU ANALYSE:
${fullReport.sentences.map((s: any, idx: number) => 
  `${idx + 1}. [${Math.round(s.ai_score)}% AI] ${s.text}`
).join('\n')}
` : ''}

====================================

AANBEVELINGEN:
${level === 'safe' 
  ? '✓ Content lijkt natuurlijk en menselijk geschreven. Geen actie vereist.' 
  : level === 'warning'
  ? '⚠ Overweeg humanization om de natuurlijkheid te verbeteren.'
  : '⚠⚠⚠ Humanization sterk aanbevolen om AI-detectie te verlagen.'}

Credits gebruikt: ${fullReport.credits_used || 'N/A'}
`;

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-detectie-rapport-${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Rapport gedownload!');
  };

  // Toggle sentence selection
  const toggleSentenceSelection = (index: number) => {
    const newSelection = new Set(selectedSentences);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedSentences(newSelection);
  };

  // Select all sentences above 10% AI
  const selectAllHighAI = () => {
    const highAIIndices = sentenceData
      .map((s, idx) => ({ score: s.ai_score, idx }))
      .filter(item => item.score > 10)
      .map(item => item.idx);
    setSelectedSentences(new Set(highAIIndices));
    toast.success(`${highAIIndices.length} zinnen geselecteerd (>10% AI)`);
  };

  // Deselect all sentences
  const deselectAll = () => {
    setSelectedSentences(new Set());
    toast.info('Selectie gewist');
  };

  const rewriteAIParts = async () => {
    if (!editor) {
      toast.error('Editor niet geïnitialiseerd');
      return;
    }

    if (!sentenceData || sentenceData.length === 0) {
      toast.error('Voer eerst een scan uit om AI-delen te detecteren');
      return;
    }

    // Use selected sentences if any, otherwise fall back to all high AI sentences
    const sentencesToRewrite = selectedSentences.size > 0
      ? Array.from(selectedSentences).map(idx => sentenceData[idx])
      : sentenceData.filter(s => s.ai_score > 10);
    
    if (sentencesToRewrite.length === 0) {
      toast.error('Selecteer eerst zinnen om te herschrijven');
      return;
    }

    console.log('[Rewrite AI Parts] Rewriting', sentencesToRewrite.length, 'selected sentences with ZeroGPT');
    
    setRewritingAIParts(true);
    
    // Show progress toast
    const progressToast = toast.loading(`Herschrijven van ${sentencesToRewrite.length} geselecteerde zinnen...`);
    
    try {
      const htmlContent = editor.getHTML();
      
      // Use ZeroGPT humanization endpoint
      const response = await fetch('/api/client/zerogpt/humanize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: htmlContent,
          tone: 'Creative', // Use creative tone for aggressive rewriting
          isHtml: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Herschrijven mislukt');
      }

      if (!data.humanizedContent) {
        throw new Error('Geen herschreven content ontvangen');
      }

      // Update editor with rewritten content
      editor.commands.setContent(data.humanizedContent);
      
      // Dismiss progress toast
      toast.dismiss(progressToast);
      
      toast.success(`✨ ${sentencesToRewrite.length} zinnen succesvol herschreven! Scan opnieuw voor nieuwe score.`);

      // Clear sentence data and selection to trigger new scan
      setSentenceData([]);
      setSelectedSentences(new Set());
      setScore(null);
      setLevel(null);
    } catch (error: any) {
      console.error('[Rewrite AI Parts] Error:', error);
      toast.dismiss(progressToast);
      toast.error(error.message || 'Fout bij herschrijven');
    } finally {
      setRewritingAIParts(false);
    }
  };

  const humanizeUntilSafe = async () => {
    if (!editor) {
      toast.error('Editor niet geïnitialiseerd');
      return;
    }

    const htmlContent = editor.getHTML();
    const plainContent = editor.getText();

    if (!plainContent || plainContent.trim().length < 100) {
      toast.error('Content te kort voor humanization (minimaal 100 karakters)');
      return;
    }

    console.log('[Iterative Humanizer] Starting iterative humanization with ZeroGPT until 5% AI');

    setIterativeHumanizing(true);
    setIterationProgress({ 
      currentIteration: 0, 
      totalIterations: 5,
      currentScore: score?.ai || 100, 
      message: '🚀 Initiële scan uitvoeren...',
      scansPerformed: 0,
      scansSaved: 0
    });

    const progressToast = toast.loading('Automatisch verbeteren tot <5% AI...');

    try {
      // Use ZeroGPT iterative humanization endpoint
      const response = await fetch('/api/client/zerogpt/humanize-iterative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: htmlContent,
          targetScore: 5, // Target 5% AI (aggressive humanization)
          maxIterations: 5,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Iteratieve humanization mislukt');
      }

      if (!data.finalContent) {
        throw new Error('Geen verbeterde content ontvangen');
      }

      // Update editor with final content
      editor.commands.setContent(data.finalContent);

      // Update scores
      const finalScore: OriginalityScore = {
        ai: data.finalScore,
        original: 100 - data.finalScore,
        score: data.finalScore,
      };
      setScore(finalScore);

      // Set level based on final score
      let newLevel: 'safe' | 'warning' | 'danger' = 'safe';
      let newMessage = 'Content lijkt menselijk geschreven';

      if (data.finalScore > 50) {
        newLevel = 'danger';
        newMessage = `Hoge AI-detectie: ${data.finalScore.toFixed(1)}% - maximale iteraties bereikt`;
      } else if (data.finalScore > 20) {
        newLevel = 'warning';
        newMessage = `Matige AI-detectie: ${data.finalScore.toFixed(1)}%`;
      } else if (data.finalScore <= 5) {
        newLevel = 'safe';
        newMessage = `✅ Uitstekend! Slechts ${data.finalScore.toFixed(1)}% AI gedetecteerd`;
      }

      setLevel(newLevel);
      setMessage(newMessage);

      // Clear sentence data to trigger new scan
      setSentenceData([]);
      setSelectedSentences(new Set());

      // Dismiss progress toast
      toast.dismiss(progressToast);

      // Show result
      const targetReached = data.finalScore <= 5;
      if (targetReached) {
        toast.success(
          `✨ Perfect! Score verlaagd naar ${data.finalScore.toFixed(1)}% AI in ${data.iterations} iteratie${data.iterations > 1 ? 's' : ''}!`,
          { duration: 8000 }
        );
      } else {
        toast.warning(
          `⚠️ Gestopt na ${data.iterations} iteratie${data.iterations > 1 ? 's' : ''}. Huidige score: ${data.finalScore.toFixed(1)}% AI (doel was <5%).`,
          { duration: 6000 }
        );
      }

      console.log(`[Iterative Humanizer] Completed ${data.iterations} iterations. Final score: ${data.finalScore}%`);

    } catch (error: any) {
      console.error('[Iterative Humanizer] Error:', error);
      toast.dismiss(progressToast);
      toast.error(error.message || 'Fout bij iteratieve humanization');
    } finally {
      setIterativeHumanizing(false);
      setIterationProgress(null);
    }
  };

  const humanizeContent = async () => {
    if (!editor) {
      console.error('[Humanizer] Editor not initialized');
      toast.error('Editor niet geïnitialiseerd');
      return;
    }

    // Use HTML content to preserve formatting
    const htmlContent = editor.getHTML();
    const plainContent = editor.getText();
    
    console.log('[Humanizer] HTML content length:', htmlContent.length);
    console.log('[Humanizer] Plain content length:', plainContent.length);

    if (!plainContent || plainContent.trim().length < 100) {
      console.error('[Humanizer] Content too short:', plainContent.trim().length);
      toast.error('Content te kort voor humanization (minimaal 100 karakters)');
      return;
    }

    console.log('[Humanizer] Starting humanization with ZeroGPT...');
    
    setHumanizing(true);
    try {
      // Use ZeroGPT humanization endpoint
      const response = await fetch('/api/client/zerogpt/humanize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: htmlContent,
          tone: 'Standard', // Use standard tone for single-pass humanization
          isHtml: true,
        }),
      });

      console.log('[Humanizer] Response status:', response.status);

      const data = await response.json();
      console.log('[Humanizer] Response data:', data);

      if (!response.ok) {
        console.error('[Humanizer] API error:', data.error);
        throw new Error(data.error || 'Humanization mislukt');
      }

      if (!data.humanizedContent) {
        console.error('[Humanizer] No humanized content in response');
        throw new Error('Geen gehumaniseerde content ontvangen');
      }

      console.log('[Humanizer] Updating editor with humanized content...');
      console.log('[Humanizer] Humanized content length:', data.humanizedContent.length);
      
      // Update editor with humanized content
      editor.commands.setContent(data.humanizedContent);
      
      toast.success('✨ Content succesvol herschreven! Scan opnieuw voor nieuwe score.');

      // Clear score to encourage re-scan
      setScore(null);
      setLevel(null);
      setSentenceData([]);
      
      console.log('[Humanizer] Humanization completed successfully!');
    } catch (error: any) {
      console.error('[Humanizer] Humanization error:', error);
      console.error('[Humanizer] Error stack:', error.stack);
      toast.error(error.message || 'Fout bij humaniseren');
    } finally {
      console.log('[Humanizer] Humanization process finished');
      setHumanizing(false);
    }
  };

  // Load conversations
  useEffect(() => {
    if (isMounted && session) {
      loadConversations();
    }
  }, [isMounted, session]);

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/client/text-editor/conversations');
      const data = await response.json();
      if (response.ok) {
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const improveWithAI = async () => {
    if (!editor || !chatInstruction.trim()) {
      toast.error('Voer een instructie in');
      return;
    }

    const content = editor.getHTML();
    if (!content || editor.getText().trim().length < 10) {
      toast.error('Voeg eerst wat tekst toe aan de editor');
      return;
    }

    setIsImproving(true);
    try {
      const response = await fetch('/api/client/text-editor/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          instruction: chatInstruction,
          conversationId: currentConversationId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verbetering mislukt');
      }

      // Update editor with improved content
      editor.commands.setContent(data.improvedContent);

      // Add messages to chat
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: chatInstruction,
        createdAt: new Date().toISOString(),
      };

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Tekst is verbeterd volgens je instructie.',
        createdAt: new Date().toISOString(),
      };

      setChatMessages([...chatMessages, userMessage, assistantMessage]);
      setCurrentConversationId(data.conversationId);
      setChatInstruction('');
      
      toast.success('✨ Tekst verbeterd!');
      
      // Reload conversations to show updated list
      loadConversations();
      
      // Scroll to bottom of chat
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error: any) {
      console.error('Improvement error:', error);
      toast.error(error.message || 'Fout bij verbeteren');
    } finally {
      setIsImproving(false);
    }
  };

  const startNewConversation = () => {
    setCurrentConversationId(null);
    setChatMessages([]);
    setChatInstruction('');
    toast.info('Nieuwe conversatie gestart');
  };

  const loadConversation = (conversation: Conversation) => {
    setCurrentConversationId(conversation.id);
    setChatMessages(conversation.messages);
    toast.info(`Conversatie geladen: ${conversation.title}`);
  };

  const deleteConversation = async (conversationId: string) => {
    if (!confirm('Weet je zeker dat je deze conversatie wilt verwijderen?')) {
      return;
    }

    try {
      const response = await fetch('/api/client/text-editor/conversations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      });

      if (response.ok) {
        setConversations(conversations.filter((c) => c.id !== conversationId));
        if (currentConversationId === conversationId) {
          startNewConversation();
        }
        toast.success('Conversatie verwijderd');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Fout bij verwijderen');
    }
  };

  const rewriteText = async () => {
    if (!editor || isRewriting) return;

    const content = editor.getHTML();
    if (!content || content.trim().length === 0) {
      toast.error('Voer eerst tekst in om te herschrijven');
      return;
    }

    setIsRewriting(true);

    try {
      console.log('[Rewriter] Starting rewrite with style:', rewriteStyle);
      
      const response = await fetch('/api/client/text-rewriter/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          style: rewriteStyle,
          preserveHtml: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Herschrijven mislukt');
      }

      // Update editor with rewritten content
      editor.commands.setContent(data.rewrittenContent);
      
      toast.success(`✨ Tekst herschreven in ${getStyleName(rewriteStyle)} stijl!`);
      setSaved(false); // Mark as unsaved
      
    } catch (error: any) {
      console.error('Rewrite error:', error);
      toast.error(error.message || 'Fout bij herschrijven');
    } finally {
      setIsRewriting(false);
    }
  };

  const getStyleName = (style: string): string => {
    const names: Record<string, string> = {
      human: 'menselijke',
      professional: 'professionele',
      friendly: 'vriendelijke',
      simple: 'eenvoudige',
      engaging: 'boeiende',
      academic: 'academische',
    };
    return names[style] || style;
  };

  if (!isMounted || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
          <span className="text-white text-lg">Laden...</span>
        </div>
      </div>
    );
  }

  if (!editor) {
    return null;
  }

  const wordCount = editor.storage.characterCount.words();
  const charCount = editor.storage.characterCount.characters();

  return (
    <div className="min-h-screen bg-gray-950 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push('/client-portal')}
                variant="outline"
                size="sm"
                className="text-white border-gray-700 hover:bg-gray-800"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Terug
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <Wand2 className="h-8 w-8 text-orange-500" />
                  AI Tekstherschrijver & Originality Scanner
                </h1>
                <p className="text-white mt-2">
                  Herschrijf teksten in verschillende stijlen of scan op AI-detectie
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={saveDraft}
                variant="outline"
                size="sm"
                className={saved ? 'border-green-500 text-green-500' : 'text-white border-gray-700 hover:bg-gray-800'}
              >
                {saved ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Opgeslagen
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Opslaan
                  </>
                )}
              </Button>

              <Button
                onClick={clearEditor}
                variant="outline"
                size="sm"
                className="text-red-400 border-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Wissen
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-gray-800 bg-gray-900/50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{wordCount}</div>
                  <div className="text-sm text-white">Woorden</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-800 bg-gray-900/50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{charCount}</div>
                  <div className="text-sm text-white">Karakters</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-800 bg-gray-900/50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {score ? `${Math.round(score.ai)}%` : '-'}
                  </div>
                  <div className="text-sm text-white">AI Score</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-800 bg-gray-900/50">
              <CardContent className="pt-6">
                <div className="text-center">
                  {level ? (
                    <Badge
                      variant={level === 'safe' ? 'default' : level === 'warning' ? 'secondary' : 'destructive'}
                      className="text-sm px-3 py-1"
                    >
                      {level === 'safe' ? '✅ Veilig' : level === 'warning' ? '⚠️ Waarschuwing' : '🚨 Gevaar'}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-sm px-3 py-1 text-white border-gray-600">
                      Nog niet gescand
                    </Badge>
                  )}
                  <div className="text-sm text-white mt-2">Status</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {score && message && (
            <Alert className="mt-4 bg-gray-800/50 border-gray-700">
              <Info className="h-4 w-4 text-orange-500" />
              <AlertDescription className="text-white font-medium">{message}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Main Content - Full Width */}
        <div className="space-y-6">
          {/* Tabs for Rewrite and Scan */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'rewrite' | 'scan')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-900 border border-gray-800">
              <TabsTrigger value="rewrite" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                <Wand2 className="mr-2 h-4 w-4" />
                Tekst Herschrijven
              </TabsTrigger>
              <TabsTrigger value="scan" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                <Shield className="mr-2 h-4 w-4" />
                AI Detectie Scan
              </TabsTrigger>
            </TabsList>

            {/* Rewrite Tab Content */}
            <TabsContent value="rewrite" className="mt-6 space-y-6">
              {/* Rewrite Style Selector */}
              <Card className="border-gray-800 bg-gray-900/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Zap className="h-5 w-5 text-orange-500" />
                    Schrijfstijl
                  </CardTitle>
                  <CardDescription className="text-white">
                    Kies een stijl voor het herschrijven van je tekst
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Select value={rewriteStyle} onValueChange={(v) => setRewriteStyle(v as any)}>
                    <SelectTrigger className="w-full bg-gray-900 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      <SelectItem value="human" className="text-white">
                        🧑 Menselijk - 100% natuurlijk en ondetecteerbaar
                      </SelectItem>
                      <SelectItem value="professional" className="text-white">
                        💼 Professioneel - Zakelijk en vertrouwenwekkend
                      </SelectItem>
                      <SelectItem value="friendly" className="text-white">
                        😊 Vriendelijk - Warm en toegankelijk
                      </SelectItem>
                      <SelectItem value="simple" className="text-white">
                        ✏️ Eenvoudig - Begrijpelijk voor iedereen
                      </SelectItem>
                      <SelectItem value="engaging" className="text-white">
                        🎯 Boeiend - Pakkend en interessant
                      </SelectItem>
                      <SelectItem value="academic" className="text-white">
                        🎓 Academisch - Wetenschappelijk en formeel
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={rewriteText}
                    disabled={isRewriting || wordCount < 10}
                    className="w-full mt-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold"
                    size="lg"
                  >
                    {isRewriting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Herschrijven...
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-2 h-5 w-5" />
                        Herschrijf Tekst in {getStyleName(rewriteStyle)} Stijl
                      </>
                    )}
                  </Button>
                  
                  {wordCount < 10 && (
                    <p className="text-sm text-yellow-500 mt-2 text-center">
                      Voer minimaal 10 woorden in om te herschrijven
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Scan Tab Content */}
            <TabsContent value="scan" className="mt-6 space-y-6">
              {/* AI Actions Bar */}
              <Card className="border-gray-800 bg-gray-900/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-orange-500" />
                    AI Detectie & Humanization
                  </CardTitle>
                  <CardDescription className="text-white">
                    Scan je content op AI-detectie en verbeter automatisch
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Powered by label */}
                    <div className="text-xs text-gray-400 text-center">
                      <Shield className="inline h-3 w-3 mr-1" />
                      Powered by ZeroGPT API
                    </div>

                    {/* Main Actions Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Scan Column */}
                      <div className="space-y-2">
                        <Button
                          onClick={scanContent}
                          disabled={scanning || wordCount < 10}
                          variant="outline"
                          className="w-full border-gray-700 text-white hover:bg-gray-800"
                        >
                          {scanning ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Scannen...
                            </>
                          ) : (
                            <>
                              <Shield className="mr-2 h-4 w-4" />
                              Scan Content
                            </>
                          )}
                        </Button>
                        <div className="text-xs text-white/70 text-center">
                          Detecteer AI-patronen
                        </div>
                      </div>

                      {/* Humanize Column */}
                      <div className="space-y-2">
                        <Button
                          onClick={humanizeContent}
                          disabled={humanizing || wordCount < 20 || iterativeHumanizing}
                          className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold"
                        >
                          {humanizing ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Verbeteren...
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-2 h-4 w-4" />
                              Verbeter Alles
                            </>
                          )}
                        </Button>
                        <div className="text-xs text-white/70 text-center">
                          Herschrijf volledige tekst
                        </div>
                      </div>

                      {/* Auto Humanize Column */}
                      <div className="space-y-2">
                        <Button
                          onClick={humanizeUntilSafe}
                          disabled={iterativeHumanizing || humanizing || wordCount < 20}
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold shadow-lg"
                        >
                          {iterativeHumanizing ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Iteratie {iterationProgress?.currentIteration || 0}...
                            </>
                          ) : (
                            <>
                              <TrendingUp className="mr-2 h-4 w-4" />
                              Verbeter tot &lt;5% AI
                            </>
                          )}
                        </Button>
                        <div className="text-xs text-white/70 text-center">
                          Automatisch verbeteren
                        </div>
                      </div>
                    </div>

                    {wordCount < 10 && (
                      <p className="text-sm text-yellow-500 text-center">
                        Voer minimaal 10 woorden in om te scannen
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Editor */}
          <div className="w-full">
            <Card className="border-gray-800 bg-gray-900/50">
              <CardHeader className="border-b border-gray-800">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    variant={editor.isActive('bold') ? 'default' : 'outline'}
                    size="sm"
                  >
                    <Bold className="h-4 w-4" />
                  </Button>

                  <Button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    variant={editor.isActive('italic') ? 'default' : 'outline'}
                    size="sm"
                  >
                    <Italic className="h-4 w-4" />
                  </Button>

                  <Button
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    variant={editor.isActive('underline') ? 'default' : 'outline'}
                    size="sm"
                  >
                    <UnderlineIcon className="h-4 w-4" />
                  </Button>

                  <div className="w-px h-6 bg-gray-700" />

                  <Button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'outline'}
                    size="sm"
                  >
                    <Heading2 className="h-4 w-4" />
                  </Button>

                  <Button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'outline'}
                    size="sm"
                  >
                    <Heading3 className="h-4 w-4" />
                  </Button>

                  <div className="w-px h-6 bg-gray-700" />

                  <Button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    variant={editor.isActive('bulletList') ? 'default' : 'outline'}
                    size="sm"
                  >
                    <List className="h-4 w-4" />
                  </Button>

                  <Button
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    variant={editor.isActive('orderedList') ? 'default' : 'outline'}
                    size="sm"
                  >
                    <ListOrdered className="h-4 w-4" />
                  </Button>

                  <div className="w-px h-6 bg-gray-700" />

                  <Button
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'outline'}
                    size="sm"
                  >
                    <AlignLeft className="h-4 w-4" />
                  </Button>

                  <Button
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'outline'}
                    size="sm"
                  >
                    <AlignCenter className="h-4 w-4" />
                  </Button>

                  <Button
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'outline'}
                    size="sm"
                  >
                    <AlignRight className="h-4 w-4" />
                  </Button>

                  <div className="w-px h-6 bg-gray-700" />

                  <Button
                    onClick={() => editor.chain().focus().toggleHighlight().run()}
                    variant={editor.isActive('highlight') ? 'default' : 'outline'}
                    size="sm"
                  >
                    <Highlighter className="h-4 w-4" />
                  </Button>

                  <div className="w-px h-6 bg-gray-700" />

                  <Button
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    variant="outline"
                    size="sm"
                  >
                    <Undo className="h-4 w-4" />
                  </Button>

                  <Button
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    variant="outline"
                    size="sm"
                  >
                    <Redo className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <EditorContent editor={editor} />
              </CardContent>
            </Card>
          </div>

          {/* AI Actions Bar */}
          <Card className="border-gray-800 bg-gray-900/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-orange-500" />
                AI Acties
              </CardTitle>
              <CardDescription className="text-white">
                Scan en verbeter je content met AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Powered by label */}
                <div className="text-xs text-gray-400 text-center">
                  <Shield className="inline h-3 w-3 mr-1" />
                  Powered by ZeroGPT API
                </div>

                {/* Main Actions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Scan Column */}
                  <div className="space-y-2">
                    <Button
                      onClick={scanContent}
                      disabled={scanning || wordCount < 10}
                      variant="outline"
                      className="w-full border-gray-700 text-white hover:bg-gray-800"
                    >
                      {scanning ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Scannen...
                        </>
                      ) : (
                        <>
                          <Shield className="mr-2 h-4 w-4" />
                          Scan Content
                        </>
                      )}
                    </Button>
                    <div className="text-xs text-white/70 text-center">
                      Detecteer AI-patronen
                    </div>
                  </div>

                  {/* Humanize Column */}
                  <div className="space-y-2">
                    <Button
                      onClick={humanizeContent}
                      disabled={humanizing || wordCount < 20 || iterativeHumanizing}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold"
                    >
                      {humanizing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verbeteren...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Verbeter Alles
                        </>
                      )}
                    </Button>
                    <div className="text-xs text-white/70 text-center">
                      Herschrijf volledige tekst
                    </div>
                  </div>

                  {/* Auto Humanize Column */}
                  <div className="space-y-2">
                    <Button
                      onClick={humanizeUntilSafe}
                      disabled={iterativeHumanizing || humanizing || wordCount < 20}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold shadow-lg"
                    >
                      {iterativeHumanizing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Iteratie {iterationProgress?.currentIteration || 0}...
                        </>
                      ) : (
                        <>
                          <TrendingUp className="mr-2 h-4 w-4" />
                          Verbeter tot &lt;5% AI
                        </>
                      )}
                    </Button>
                    <div className="text-xs text-white/70 text-center">
                      Automatisch verbeteren
                    </div>
                  </div>
                </div>

                {iterationProgress && (
                  <div className="space-y-2 p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg">
                    {/* Progress Header */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin text-green-400" />
                        <span className="text-green-400 font-semibold">
                          {iterationProgress.message}
                        </span>
                      </div>
                      <span className="text-white/70">
                        {iterationProgress.currentIteration}/{iterationProgress.totalIterations}
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300"
                        style={{ 
                          width: `${(iterationProgress.currentIteration / iterationProgress.totalIterations) * 100}%` 
                        }}
                      />
                    </div>
                    
                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div className="text-center">
                        <div className="text-white/70 text-[10px] uppercase">Score</div>
                        <div className="text-white text-xs font-bold">
                          {iterationProgress.currentScore.toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-white/70 text-[10px] uppercase">Scans</div>
                        <div className="text-white text-xs font-bold">
                          {iterationProgress.scansPerformed}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-green-400 text-[10px] uppercase">⚡ Bespaard</div>
                        <div className="text-green-400 text-xs font-bold">
                          {iterationProgress.scansSaved}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-xs text-white/70 text-center">
                  {iterativeHumanizing 
                    ? '⚡ Geoptimaliseerd proces: minder scans, lagere kosten'
                    : 'Blijft automatisch herschrijven totdat doel bereikt is (max 5 iteraties)'}
                </div>

                {/* Selective Rewrite Section */}
                {sentenceData.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-gray-700">
                    <div className="text-sm font-semibold text-white text-center">
                      Of selectief herschrijven
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={selectAllHighAI}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs border-orange-500 text-orange-400 hover:bg-orange-500/10"
                      >
                        Selecteer &gt;10% AI
                      </Button>
                      <Button
                        onClick={deselectAll}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs border-gray-600 text-gray-400 hover:bg-gray-700"
                      >
                        Wis Selectie
                      </Button>
                    </div>
                    <Button
                      onClick={rewriteAIParts}
                      disabled={rewritingAIParts || selectedSentences.size === 0}
                      variant="outline"
                      className="w-full border-orange-500 text-orange-400 hover:bg-orange-500/10"
                    >
                      {rewritingAIParts ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Herschrijven...
                        </>
                      ) : (
                        <>
                          <TrendingUp className="mr-2 h-4 w-4" />
                          Herschrijf Geselecteerde ({selectedSentences.size})
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Download Report Button */}
                {score && fullReport && (
                  <div className="pt-4 border-t border-gray-700">
                    <Button
                      onClick={downloadReport}
                      variant="outline"
                      size="sm"
                      className="w-full border-gray-700 text-white hover:bg-gray-800"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Rapport
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Sentence Analysis Card */}
          {sentenceData.length > 0 && (
            <Card className="border-gray-800 bg-gray-900/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                  AI-detectie per Zin
                </CardTitle>
                <CardDescription className="text-white">
                  {sentenceData.filter(s => s.ai_score > 10).length} van {sentenceData.length} zinnen boven 10% AI - Klik op zinnen om te selecteren
                </CardDescription>
              </CardHeader>
                <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
                  {sentenceData.map((sentence, idx) => {
                    const aiScore = Math.round(sentence.ai_score);
                    const isSelected = selectedSentences.has(idx);
                    let scoreColor = 'text-green-500';
                    let bgColor = 'bg-green-500/10';
                    let borderColor = 'border-green-500/30';
                    
                    if (aiScore > 70) {
                      scoreColor = 'text-red-500';
                      bgColor = 'bg-red-500/10';
                      borderColor = 'border-red-500/30';
                    } else if (aiScore > 50) {
                      scoreColor = 'text-orange-500';
                      bgColor = 'bg-orange-500/10';
                      borderColor = 'border-orange-500/30';
                    } else if (aiScore > 30) {
                      scoreColor = 'text-yellow-500';
                      bgColor = 'bg-yellow-500/10';
                      borderColor = 'border-yellow-500/30';
                    } else if (aiScore > 10) {
                      scoreColor = 'text-blue-500';
                      bgColor = 'bg-blue-500/10';
                      borderColor = 'border-blue-500/30';
                    }
                    
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border ${bgColor} ${borderColor} ${isSelected ? 'ring-2 ring-orange-500' : ''} cursor-pointer hover:opacity-80 transition-all`}
                        onClick={() => toggleSentenceSelection(idx)}
                      >
                        <div className="flex items-start gap-3">
                          {/* Checkbox */}
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSentenceSelection(idx)}
                            className="mt-0.5 h-4 w-4 rounded border-gray-600 text-orange-500 focus:ring-orange-500 cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          />
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <span className={`text-xs font-bold ${scoreColor}`}>
                                {aiScore}% AI
                              </span>
                              {aiScore > 10 && (
                                <Badge variant={aiScore > 50 ? 'destructive' : 'secondary'} className="text-xs">
                                  {aiScore > 50 ? 'Hoog' : 'Matig'}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-white/80">
                              {sentence.text}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </CardContent>
            </Card>
          )}

          {/* AI Chat Assistant - Below Editor */}
          <Card className="border-gray-800 bg-gray-900/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-orange-500" />
                AI Tekst Assistent
              </CardTitle>
              <CardDescription className="text-white">
                Vraag om specifieke wijzigingen en de AI past de tekst direct aan in de editor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Chat Messages Area */}
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                      <p className="text-sm mb-4">Geef een instructie om de tekst te verbeteren</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {[
                          'Maak de tekst formeler',
                          'Voeg meer details toe',
                          'Maak het korter',
                          'Verbeter de grammatica',
                          'Herschrijf vriendelijker',
                          'Verwijder jargon',
                        ].map((example, idx) => (
                          <button
                            key={idx}
                            onClick={() => setChatInstruction(example)}
                            className="text-left p-2 text-xs text-gray-300 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 hover:border-orange-500 transition-colors"
                          >
                            {example}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      {chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              msg.role === 'user'
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-800 text-gray-200 border border-gray-700'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            <p className="text-[10px] mt-1 opacity-70">
                              {new Date(msg.createdAt).toLocaleTimeString('nl-NL', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </>
                  )}
                </div>

                {/* Conversation History */}
                {conversations.length > 0 && (
                  <div className="pt-4 border-t border-gray-700">
                    <details className="group">
                      <summary className="flex items-center justify-between cursor-pointer text-sm text-gray-400 hover:text-white mb-2">
                        <span className="flex items-center gap-2">
                          <History className="h-4 w-4" />
                          Eerdere conversaties ({conversations.length})
                        </span>
                      </summary>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {conversations.map((conv) => (
                          <div
                            key={conv.id}
                            className={`flex items-center justify-between p-2 rounded border ${
                              currentConversationId === conv.id
                                ? 'bg-orange-500/10 border-orange-500'
                                : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                            } cursor-pointer group/item`}
                            onClick={() => loadConversation(conv)}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-white truncate">{conv.title}</p>
                              <p className="text-[10px] text-gray-500">
                                {new Date(conv.updatedAt).toLocaleDateString('nl-NL')}
                              </p>
                            </div>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteConversation(conv.id);
                              }}
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover/item:opacity-100 h-6 w-6 p-0 text-red-400 hover:text-red-300"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                )}

                {/* Chat Input */}
                <div className="pt-4 border-t border-gray-700">
                  <Alert className="mb-3 bg-blue-500/10 border-blue-500/30">
                    <Info className="h-4 w-4 text-blue-500" />
                    <AlertDescription className="text-xs text-blue-200">
                      💡 De AI past je tekst direct aan op basis van je instructie
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex gap-2">
                    <Textarea
                      value={chatInstruction}
                      onChange={(e) => setChatInstruction(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          improveWithAI();
                        }
                      }}
                      placeholder="Bijvoorbeeld: 'De tekst klinkt te AI-achtig, maak het natuurlijker' of 'Voeg meer voorbeelden toe in paragraaf 2'..."
                      className="flex-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 min-h-[100px] resize-none"
                      disabled={isImproving}
                    />
                  </div>
                  
                  <div className="flex gap-2 mt-2">
                    <Button
                      onClick={startNewConversation}
                      variant="outline"
                      size="sm"
                      className="border-gray-700 text-white hover:bg-gray-800"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Nieuwe Chat
                    </Button>
                    <Button
                      onClick={improveWithAI}
                      disabled={isImproving || !chatInstruction.trim()}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold"
                    >
                      {isImproving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verbeteren...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Pas Tekst Aan
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Results Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Sparkles className="h-5 w-5 text-orange-500" />
              Humanization Resultaat
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Content is succesvol gehumaniseerd om AI-detectie te verslaan
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {beforeScore && afterScore && (
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-white font-semibold">Voor Humanization</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-400">
                      {Math.round(beforeScore.ai)}%
                    </div>
                    <p className="text-xs text-gray-400 mt-1">AI Score</p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-white font-semibold">Na Humanization</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-400">
                      {Math.round(afterScore.ai)}%
                    </div>
                    <p className="text-xs text-white mt-1">AI Score</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {improvements.length > 0 && (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-white font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-400" />
                    Verbeteringen
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {improvements.map((improvement, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-white">{improvement}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Alert className="bg-green-500/10 border-green-500/50">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-300">
                De gehumaniseerde content is automatisch in de editor geplaatst. Je kunt nu verder bewerken of opslaan.
              </AlertDescription>
            </Alert>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
