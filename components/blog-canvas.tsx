'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import TiptapImage from '@tiptap/extension-image';
import CharacterCount from '@tiptap/extension-character-count';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Highlight from '@tiptap/extension-highlight';
import Blockquote from '@tiptap/extension-blockquote';
import { ProductBox, GenericDiv } from '@/components/tiptap-extensions/product-box';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Heading1,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo,
  Redo,
  Download,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  Expand,
  Minimize,
  Palette,
  Image as ImageIcon,
  Link as LinkIcon,
  Table as TableIcon,
  Highlighter,
  Code,
  Quote,
  Minus,
  Save,
  Upload,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Trash2,
  RotateCcw,
  Strikethrough,
  Globe,
  Loader2,
  FileText,
  Edit2,
  Replace,
  Wand2,
  X,
  Share2,
  Package,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import WordPressPublisherDialog from '@/components/wordpress-publisher-dialog';
import CTABoxCreator from '@/components/cta-box-creator';
import AIImageGeneratorDialog from '@/components/ai-image-generator-dialog';
import { ProductBoxSelector } from '@/components/product-box-selector';
import { CTABoxSelector } from '@/components/cta-box-selector';
import { ImageSelectorModal } from '@/components/image-selector-modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// WritgoAI Dark Theme Colors (Optie 2)
const DARK_THEME = {
  background: '#1a1a1a',
  cardBg: '#2d2d2d',
  border: '#404040',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  orange: '#FF8C00',
  orangeLight: '#FFA500',
};

interface BlogCanvasProps {
  content: string;
  isGenerating: boolean;
  onRequestChange?: (instruction: string) => void;
  onSave?: (data: {
    content: string;
    seoMetadata?: {
      seoTitle: string;
      metaDescription: string;
      focusKeyword: string;
      extraKeywords: string[];
      lsiKeywords: string[];
    } | null;
    featuredImage?: string;
    socialMediaPost?: {
      text: string;
      imageUrl: string;
      hashtags: string[];
    } | null;
  }) => void;
  onClose?: () => void;
  topic?: string;
  seoMetadata?: {
    seoTitle: string;
    metaDescription: string;
    focusKeyword: string;
    extraKeywords: string[];
    lsiKeywords: string[];
  } | null;
  featuredImage?: string; // Nieuwe featured image URL
  socialMediaPost?: {
    text: string;
    imageUrl: string;
    hashtags: string[];
  } | null;
  onRefreshFeaturedImage?: () => void; // Refresh functie voor featured image
  refreshingImage?: boolean; // Loading state voor refresh
  projectId?: string | null; // Project ID voor Bol.com producten
}

export default function BlogCanvas({
  content,
  isGenerating,
  onRequestChange,
  onSave,
  onClose,
  topic,
  seoMetadata,
  featuredImage,
  socialMediaPost,
  onRefreshFeaturedImage,
  refreshingImage,
  projectId,
}: BlogCanvasProps) {
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [wordPressDialogOpen, setWordPressDialogOpen] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Nieuwe editor tools
  const [ctaBoxDialogOpen, setCtaBoxDialogOpen] = useState(false);
  const [ctaBoxEditMode, setCtaBoxEditMode] = useState(false);
  const [ctaBoxEditElement, setCtaBoxEditElement] = useState<HTMLElement | null>(null);
  const [ctaBoxEditConfig, setCtaBoxEditConfig] = useState<any>(null);
  const [aiImageDialogOpen, setAiImageDialogOpen] = useState(false);
  const [imageSelectorOpen, setImageSelectorOpen] = useState(false);
  const [productBoxDialogOpen, setProductBoxDialogOpen] = useState(false);
  const [affiliateLinkDialogOpen, setAffiliateLinkDialogOpen] = useState(false);
  const [affiliateLinkUrl, setAffiliateLinkUrl] = useState('');
  const [affiliateLinkText, setAffiliateLinkText] = useState('');

  // ✨ FIX: Keep SEO metadata in state to prevent loss on re-render
  const [persistentSeoMetadata, setPersistentSeoMetadata] = useState(seoMetadata);
  const [persistentSocialMediaPost, setPersistentSocialMediaPost] = useState(socialMediaPost);

  // Update persistent metadata when prop changes
  useEffect(() => {
    if (seoMetadata) {
      setPersistentSeoMetadata(seoMetadata);
      console.log('✅ SEO Metadata updated:', seoMetadata);
    }
  }, [seoMetadata]);

  // Update persistent social media post when prop changes
  useEffect(() => {
    if (socialMediaPost) {
      setPersistentSocialMediaPost(socialMediaPost);
      console.log('✅ Social Media Post updated:', socialMediaPost);
    }
  }, [socialMediaPost]);

  // Install CTA Box edit handler
  useEffect(() => {
    (window as any).editCTABox = (button: HTMLElement) => {
      const ctaBox = button.closest('.writgo-cta-box') as HTMLElement;
      if (!ctaBox) return;
      
      const configStr = ctaBox.getAttribute('data-cta-config');
      if (!configStr) return;
      
      try {
        const config = JSON.parse(configStr.replace(/&quot;/g, '"'));
        setCtaBoxEditConfig(config);
        setCtaBoxEditElement(ctaBox);
        setCtaBoxEditMode(true);
        setCtaBoxDialogOpen(true);
      } catch (error) {
        console.error('Failed to parse CTA config:', error);
      }
    };
    
    return () => {
      delete (window as any).editCTABox;
    };
  }, []);

  // AI Editing states
  const [selectedText, setSelectedText] = useState('');
  const [selectedImageSrc, setSelectedImageSrc] = useState('');
  const [showTextEditDialog, setShowTextEditDialog] = useState(false);
  const [showImageEditDialog, setShowImageEditDialog] = useState(false);
  const [textEditInstruction, setTextEditInstruction] = useState('');
  const [imageEditPrompt, setImageEditPrompt] = useState('');
  const [imageEditModel, setImageEditModel] = useState('FLUX_SCHNELL');
  const [imageModels, setImageModels] = useState<any[]>([]);
  const [editingText, setEditingText] = useState(false);
  const [editingImage, setEditingImage] = useState(false);
  const [previewText, setPreviewText] = useState('');
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewType, setPreviewType] = useState<'text' | 'image'>('text');

  // Floating selection toolbox states
  const [selectionPosition, setSelectionPosition] = useState<{ top: number; left: number } | null>(null);
  const [showSelectionToolbox, setShowSelectionToolbox] = useState(false);
  const selectionToolboxRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        blockquote: false, // Disable default blockquote from StarterKit
      }),
      Placeholder.configure({
        placeholder: 'Begin met typen of genereer content met AI...',
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Color.configure({
        types: ['textStyle'],
      }),
      TextStyle,
      TiptapImage.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto my-4',
        },
      }),
      CharacterCount,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-orange-500 underline hover:text-orange-600',
        },
      }),
      Blockquote.configure({
        HTMLAttributes: {
          class: 'border-l-4 border-orange-500 pl-4 italic my-4 py-2 rounded-r-lg',
          style: 'background: rgba(255, 107, 53, 0.1); color: #FFFFFF;',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full my-4',
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 bg-gray-50 px-4 py-2 font-semibold',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 px-4 py-2',
        },
      }),
      Highlight.configure({
        multicolor: true,
      }),
      // Product Box extensions - preserve custom HTML
      ProductBox,
      GenericDiv,
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'writgo-editor focus:outline-none min-h-[600px] px-2 md:px-8 py-4 md:py-6 w-full max-w-full overflow-x-hidden break-words',
        style: `font-size: ${fontSize}px; color: ${DARK_THEME.text}; background: ${DARK_THEME.cardBg}; word-break: break-word; overflow-wrap: break-word;`,
      },
      transformPastedHTML(html) {
        // Preserve all inline styles when pasting
        return html;
      },
    },
  });

  // Auto-restore from localStorage on mount (DISABLED - handled by parent component)
  // useEffect(() => {
  //   if (!editor) return;
  //   
  //   // Try to restore from localStorage
  //   const savedContent = localStorage.getItem('current-blog-content');
  //   const savedTimestamp = localStorage.getItem('current-blog-timestamp');
  //   
  //   if (savedContent && savedTimestamp) {
  //     const timestamp = new Date(savedTimestamp);
  //     const now = new Date();
  //     const hoursSinceLastSave = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);
  //     
  //     // Only restore if less than 24 hours old
  //     if (hoursSinceLastSave < 24) {
  //       const shouldRestore = confirm(
  //         `Er is een conceptversie gevonden van ${timestamp.toLocaleString('nl-NL')}. Wil je deze herstellen?`
  //       );
  //       
  //       if (shouldRestore) {
  //         editor.commands.setContent(savedContent);
  //         toast.success('Concept hersteld');
  //         return;
  //       }
  //     }
  //   }
  // }, [editor]);

  // Update editor content when content prop changes
  useEffect(() => {
    if (editor && content && content !== editor.getHTML()) {
      // ✅ VERBETERDE MARKDOWN/HTML CONVERSIE
      let htmlContent = content;
      
      // Check of de content al HTML is (bevat <h1>, <h2>, <p> tags)
      const isAlreadyHTML = /<h[1-6]>|<p>|<div>/.test(content);
      
      if (!isAlreadyHTML) {
        // Converteer Markdown naar HTML
        
        // Headers (moet eerst, anders conflicteert met andere conversies)
        htmlContent = htmlContent
          .replace(/^### (.+)$/gm, '<h3>$1</h3>')
          .replace(/^## (.+)$/gm, '<h2>$1</h2>')
          .replace(/^# (.+)$/gm, '<h1>$1</h1>');
        
        // Bold en italic (strict order belangrijk!)
        htmlContent = htmlContent
          .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>');
        
        // Blockquotes
        htmlContent = htmlContent
          .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
        
        // Links
        htmlContent = htmlContent
          .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
        
        // Images (markdown style)
        htmlContent = htmlContent
          .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');
        
        // Lists - bullet points
        htmlContent = htmlContent
          .replace(/^\* (.+)$/gm, '<li>$1</li>')
          .replace(/^- (.+)$/gm, '<li>$1</li>');
        
        // Lists - numbered
        htmlContent = htmlContent
          .replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
        
        // Strikethrough
        htmlContent = htmlContent
          .replace(/~~(.+?)~~/g, '<s>$1</s>');
        
        // Code
        htmlContent = htmlContent
          .replace(/`(.+?)`/g, '<code>$1</code>');
        
        // Wrap consecutive list items in ul tags
        htmlContent = htmlContent.replace(/(<li>.*?<\/li>\n?)+/g, (match) => {
          return `<ul>${match}</ul>`;
        });
        
        // Markdown tables naar HTML tables
        const tableRegex = /^\|(.+)\|$/gm;
        const tableMatches = htmlContent.match(tableRegex);
        if (tableMatches && tableMatches.length > 1) {
          // Parse table
          let tableHTML = '<table class="border-collapse table-auto w-full my-4">';
          tableMatches.forEach((row, idx) => {
            const cells = row.split('|').filter(cell => cell.trim() !== '');
            if (idx === 0) {
              // Header row
              tableHTML += '<thead><tr>';
              cells.forEach(cell => {
                tableHTML += `<th class="border border-gray-300 bg-gray-50 px-4 py-2 font-semibold">${cell.trim()}</th>`;
              });
              tableHTML += '</tr></thead><tbody>';
            } else if (idx === 1 && /^[-:\s|]+$/.test(row)) {
              // Skip separator row
            } else {
              // Data row
              tableHTML += '<tr>';
              cells.forEach(cell => {
                tableHTML += `<td class="border border-gray-300 px-4 py-2">${cell.trim()}</td>`;
              });
              tableHTML += '</tr>';
            }
          });
          tableHTML += '</tbody></table>';
          
          // Replace table in content
          htmlContent = htmlContent.replace(tableRegex, '').replace(/^\|[-:\s|]+\|$/gm, '');
          htmlContent = htmlContent.replace(/\n\n+/g, '\n\n') + '\n' + tableHTML;
        }
        
        // Wrap text lines in paragraphs (alleen als ze nog niet in een tag zitten)
        htmlContent = htmlContent
          .split('\n')
          .map(line => {
            const trimmed = line.trim();
            if (!trimmed) return '';
            if (/<\/?[a-z][\s\S]*>/i.test(trimmed)) return line; // Al een HTML tag
            return `<p>${trimmed}</p>`;
          })
          .join('\n');
      }
      
      // Clean up any double-wrapped elements
      htmlContent = htmlContent
        .replace(/<p>(<h[1-6]>.*?<\/h[1-6]>)<\/p>/g, '$1')
        .replace(/<p>(<ul>.*?<\/ul>)<\/p>/g, '$1')
        .replace(/<p>(<table>.*?<\/table>)<\/p>/g, '$1')
        .replace(/<p>(<blockquote>.*?<\/blockquote>)<\/p>/g, '$1')
        .replace(/<p>(<img[^>]*>)<\/p>/g, '$1');

      editor.commands.setContent(htmlContent);
    }
  }, [content, editor]);

  // Auto-save to localStorage only (NOT to database) - prevents duplicate saves
  useEffect(() => {
    if (!editor) return;

    const interval = setInterval(() => {
      const content = editor.getHTML();
      if (content && content !== '<p></p>') {
        // Save to localStorage only - database save happens when user clicks "Opslaan"
        localStorage.setItem('current-blog-content', content);
        localStorage.setItem('current-blog-timestamp', new Date().toISOString());
        setLastSaved(new Date());
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [editor]);
  
  // Save on every edit (debounced to localStorage ONLY) - prevents duplicate saves
  useEffect(() => {
    if (!editor) return;
    
    let timeout: NodeJS.Timeout;
    
    const handleUpdate = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const content = editor.getHTML();
        if (content && content !== '<p></p>') {
          // Save to localStorage only - database save happens when user clicks "Opslaan"
          localStorage.setItem('current-blog-content', content);
          localStorage.setItem('current-blog-timestamp', new Date().toISOString());
        }
      }, 2000); // Debounce 2 seconds
    };
    
    editor.on('update', handleUpdate);
    
    return () => {
      editor.off('update', handleUpdate);
      clearTimeout(timeout);
    };
  }, [editor]);

  // Update font size
  useEffect(() => {
    if (editor) {
      const { view } = editor;
      view.dom.style.fontSize = `${fontSize}px`;
    }
  }, [fontSize, editor]);

  // 🔥 FIX: Gekopieerde tekst moet ZWART zijn, niet wit + CTA box leesbaar maken
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'blog-canvas-copy-fix';
    style.innerHTML = `
      .ProseMirror *::selection {
        background-color: ${DARK_THEME.orange} !important;
        color: #000000 !important;
      }
      
      .ProseMirror {
        color: ${DARK_THEME.text} !important;
        word-wrap: break-word !important;
        overflow-wrap: break-word !important;
        word-break: break-word !important;
        max-width: 100% !important;
        overflow-x: auto !important;
      }
      
      /* ✨ CTA Box Styling - Altijd goed leesbaar */
      .ProseMirror .writgo-cta-box {
        position: relative !important;
        margin: 25px 0 !important;
        border-radius: 12px !important;
        padding: 30px !important;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3) !important;
        min-height: 150px !important;
        display: block !important;
      }
      
      .ProseMirror .writgo-cta-box h3 {
        font-size: 24px !important;
        font-weight: bold !important;
        margin: 0 0 15px 0 !important;
        text-align: center !important;
        line-height: 1.3 !important;
      }
      
      .ProseMirror .writgo-cta-box p {
        font-size: 16px !important;
        line-height: 1.6 !important;
        margin: 0 0 25px 0 !important;
        text-align: center !important;
      }
      
      .ProseMirror .writgo-cta-box a {
        display: inline-block !important;
        padding: 15px 40px !important;
        border-radius: 8px !important;
        text-decoration: none !important;
        font-weight: bold !important;
        font-size: 18px !important;
        transition: transform 0.2s, box-shadow 0.2s !important;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2) !important;
      }
      
      .ProseMirror .writgo-cta-box a:hover {
        transform: scale(1.05) !important;
        box-shadow: 0 6px 20px rgba(0,0,0,0.3) !important;
      }
      
      .ProseMirror .writgo-cta-box .cta-edit-btn {
        position: absolute !important;
        top: 10px !important;
        right: 10px !important;
        background: rgba(0,0,0,0.7) !important;
        color: white !important;
        border: 1px solid rgba(255,255,255,0.3) !important;
        border-radius: 5px !important;
        padding: 5px 10px !important;
        cursor: pointer !important;
        font-size: 12px !important;
        z-index: 10 !important;
        transition: all 0.2s !important;
      }
      
      .ProseMirror .writgo-cta-box .cta-edit-btn:hover {
        background: rgba(255,107,53,0.9) !important;
        border-color: ${DARK_THEME.orange} !important;
      }
      
      .ProseMirror h1, .ProseMirror h2, .ProseMirror h3, 
      .ProseMirror p, .ProseMirror li, .ProseMirror td, 
      .ProseMirror th {
        color: ${DARK_THEME.text} !important;
        word-wrap: break-word !important;
        overflow-wrap: break-word !important;
        max-width: 100% !important;
      }
      
      .ProseMirror h1 {
        font-size: 1.75rem !important;
      }
      
      @media (max-width: 768px) {
        .ProseMirror h1 {
          font-size: 1.5rem !important;
        }
        .ProseMirror h2 {
          font-size: 1.25rem !important;
        }
        .ProseMirror h3 {
          font-size: 1.1rem !important;
        }
        .ProseMirror p, .ProseMirror li {
          font-size: 0.95rem !important;
        }
      }
      
      .ProseMirror blockquote {
        background: rgba(255, 107, 53, 0.1) !important;
        color: ${DARK_THEME.text} !important;
        border-left: 4px solid #ff6b35 !important;
        padding: 12px 16px !important;
        margin: 16px 0 !important;
        border-radius: 0 8px 8px 0 !important;
        font-style: italic !important;
        word-wrap: break-word !important;
        overflow-wrap: break-word !important;
      }
      
      .ProseMirror blockquote p {
        color: ${DARK_THEME.text} !important;
      }
      
      .ProseMirror ul, .ProseMirror ol {
        color: ${DARK_THEME.text} !important;
        padding-left: 24px !important;
      }
      
      .ProseMirror li {
        color: ${DARK_THEME.text} !important;
        margin-bottom: 8px !important;
      }
      
      .ProseMirror strong {
        color: ${DARK_THEME.orange} !important;
      }
      
      .ProseMirror a {
        color: ${DARK_THEME.orange} !important;
        word-break: break-all !important;
      }
      
      .ProseMirror code {
        background: ${DARK_THEME.background} !important;
        color: ${DARK_THEME.orange} !important;
        border: 1px solid ${DARK_THEME.border} !important;
        word-wrap: break-word !important;
        overflow-wrap: break-word !important;
      }
      
      .ProseMirror pre {
        background: ${DARK_THEME.background} !important;
        border: 1px solid ${DARK_THEME.border} !important;
        overflow-x: auto !important;
        max-width: 100% !important;
      }
      
      .ProseMirror pre code {
        color: #00FF00 !important;
      }
      
      .ProseMirror img, .ProseMirror video {
        max-width: 100% !important;
        height: auto !important;
      }
      
      .ProseMirror table {
        max-width: 100% !important;
        overflow-x: auto !important;
        display: block !important;
        border-collapse: collapse !important;
        border: 1px solid ${DARK_THEME.border} !important;
      }
      
      .ProseMirror td, .ProseMirror th {
        border: 1px solid ${DARK_THEME.border} !important;
        padding: 8px 12px !important;
        color: ${DARK_THEME.text} !important;
      }
      
      .ProseMirror th {
        background: ${DARK_THEME.background} !important;
        font-weight: bold !important;
      }
      
      .ProseMirror tr:nth-child(even) {
        background: rgba(255, 255, 255, 0.02) !important;
      }
      
      /* 🎨 PRODUCT & CTA BOXES - WritgoAI Editor Preview Styling */
      /* In the editor: Modern WritgoAI style with orange accents */
      /* On export: Original inline styles are preserved */
      
      .ProseMirror .writgo-product-box {
        background: linear-gradient(135deg, #fff5f0 0%, #ffffff 50%, #fff8f5 100%) !important;
        border: 3px solid #FF6B35 !important;
        border-radius: 20px !important;
        padding: 30px !important;
        margin: 40px auto !important;
        box-shadow: 0 12px 40px rgba(255, 107, 53, 0.2) !important;
        max-width: 900px !important;
        transition: all 0.3s ease !important;
      }
      
      .ProseMirror .writgo-product-box:hover {
        box-shadow: 0 16px 50px rgba(255, 107, 53, 0.3) !important;
        transform: translateY(-2px) !important;
      }
      
      .ProseMirror .writgo-product-box h2,
      .ProseMirror .writgo-product-box h3 {
        color: #FF6B35 !important;
        font-weight: 800 !important;
        margin-bottom: 16px !important;
      }
      
      .ProseMirror .writgo-product-box p {
        color: #4b5563 !important;
        line-height: 1.6 !important;
      }
      
      .ProseMirror .writgo-product-box a {
        background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%) !important;
        color: white !important;
        padding: 14px 28px !important;
        border-radius: 12px !important;
        font-weight: 700 !important;
        text-decoration: none !important;
        display: inline-flex !important;
        align-items: center !important;
        gap: 8px !important;
        box-shadow: 0 6px 20px rgba(255, 107, 53, 0.3) !important;
        transition: all 0.3s ease !important;
      }
      
      .ProseMirror .writgo-product-box a:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 8px 25px rgba(255, 107, 53, 0.4) !important;
      }
      
      .ProseMirror .writgo-product-box img {
        border-radius: 12px !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
      }
      
      .ProseMirror .writgo-product-box .writgo-product-img-container {
        background: linear-gradient(135deg, #fff8f5 0%, #ffffff 50%, #fff5f0 100%) !important;
        border: 2px solid #FFE5D9 !important;
        border-radius: 16px !important;
        padding: 20px !important;
      }
      
      /* CTA Box Editor Styling */
      .ProseMirror .writgo-cta-box {
        /* Keep inline styles for CTA boxes as they have many color variations */
        all: revert !important;
        display: block !important;
        margin: 40px auto !important;
      }
      
      /* General protection for nested elements */
      .ProseMirror .writgo-cta-box *,
      .ProseMirror .writgo-product-grid,
      .ProseMirror .writgo-product-grid *,
      .ProseMirror .writgo-comparison-table,
      .ProseMirror .writgo-comparison-table *,
      .ProseMirror .universal-cta-box,
      .ProseMirror .universal-cta-box * {
        all: revert !important;
      }
      
      .ProseMirror .writgo-product-grid {
        display: grid !important;
        margin: 50px 0 !important;
      }
      
      .ProseMirror .writgo-comparison-table {
        display: block !important;
        margin: 50px 0 !important;
      }
      
      /* Ensure proper display for other affiliate elements */
      .ProseMirror .writgo-cta-box,
      .ProseMirror .universal-cta-box {
        display: block !important;
        margin: 50px auto !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      const existingStyle = document.getElementById('blog-canvas-copy-fix');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  const copyToClipboard = async () => {
    if (!editor) return;
    
    try {
      const html = editor.getHTML();
      await navigator.clipboard.writeText(html);
      setCopied(true);
      toast.success('Gekopieerd naar klembord');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Kopiëren mislukt');
    }
  };

  const handleSave = () => {
    if (!editor || !onSave) return;
    const content = editor.getHTML();
    
    // Save via callback with all metadata
    onSave({
      content,
      seoMetadata: persistentSeoMetadata,
      featuredImage: featuredImage,
      socialMediaPost: persistentSocialMediaPost,
    });
    
    // Update last saved time
    setLastSaved(new Date());
    
    // 🔥 VERBETERD: Gebruik consistent localStorage keys
    localStorage.setItem('current-blog-content', content);
    localStorage.setItem('current-blog-timestamp', new Date().toISOString());
    
    toast.success('Blog opgeslagen');
  };
  
  const clearDraft = () => {
    // 🔥 VERBETERD: Gebruik consistent localStorage keys
    localStorage.removeItem('current-blog-content');
    localStorage.removeItem('current-blog-timestamp');
    localStorage.removeItem('current-blog-topic');
  };

  const downloadAsHTML = () => {
    if (!editor) return;

    const html = `<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${topic || 'Blog'}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.8;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            color: #333;
            background: #fff;
        }
        /* Reguliere heading styles - maar NIET voor headings binnen CTA/Product boxes */
        body > h1, 
        body > h2, 
        body > h3,
        div:not(.writgo-cta-box):not(.writgo-product-box) h1,
        div:not(.writgo-cta-box):not(.writgo-product-box) h2,
        div:not(.writgo-cta-box):not(.writgo-product-box) h3 { 
            color: #000814; 
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            font-weight: 700;
        }
        body > h1, div:not(.writgo-cta-box):not(.writgo-product-box) h1 { 
            font-size: 2.5em; 
            border-bottom: 3px solid #FFA500; 
            padding-bottom: 0.3em; 
        }
        body > h2, div:not(.writgo-cta-box):not(.writgo-product-box) h2 { 
            font-size: 2em; 
            border-bottom: 2px solid #FFA500; 
            padding-bottom: 0.3em; 
        }
        body > h3, div:not(.writgo-cta-box):not(.writgo-product-box) h3 { 
            font-size: 1.5em; 
            color: #FFA500; 
        }
        /* Reguliere content styles - maar NIET binnen CTA/Product boxes */
        body > p,
        div:not(.writgo-cta-box):not(.writgo-product-box) p { 
            margin: 1em 0; 
        }
        ul, ol { margin: 1em 0; padding-left: 2em; }
        li { margin: 0.5em 0; }
        body > strong,
        div:not(.writgo-cta-box):not(.writgo-product-box) strong { 
            color: #FFA500; 
            font-weight: 600; 
        }
        em { font-style: italic; }
        /* Link styles - maar NIET binnen CTA/Product boxes */
        body > a,
        div:not(.writgo-cta-box):not(.writgo-product-box) > a,
        p > a { 
            color: #FFA500; 
            text-decoration: none; 
            border-bottom: 1px solid #FFA500; 
        }
        body > a:hover,
        div:not(.writgo-cta-box):not(.writgo-product-box) > a:hover,
        p > a:hover { 
            color: #FF8C00; 
            border-bottom-color: #FF8C00; 
        }
        img { 
            max-width: 100%; 
            height: auto; 
            border-radius: 8px; 
            margin: 1.5em 0;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        blockquote {
            border-left: 4px solid #FFA500;
            padding-left: 1em;
            margin: 1.5em 0;
            font-style: italic;
            color: #666;
        }
        code {
            background: #f5f5f5;
            padding: 0.2em 0.4em;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 1.5em 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        th {
            background: #f5f5f5;
            font-weight: 600;
        }
        mark {
            background: #fff3cd;
            padding: 0.1em 0.2em;
        }

        /* CTA & Product Box Protection - Zorg dat hun inline styles altijd prioriteit hebben */
        .writgo-cta-box,
        .writgo-product-box {
            /* Alle inline styles hebben !important, dus deze boxes worden niet beïnvloed */
            /* Deze regels zorgen ervoor dat de boxes hun eigen styling behouden */
        }
        
        /* Zorg dat links binnen CTA/Product boxes hun eigen styling behouden */
        .writgo-cta-box a,
        .writgo-product-box a {
            /* Inline styles met !important hebben prioriteit */
        }
    </style>
</head>
<body>
    ${editor.getHTML()}
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${topic?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'blog'}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Blog gedownload als HTML');
  };

  const downloadAsMarkdown = () => {
    if (!editor) return;

    // Convert HTML to Markdown
    let markdown = editor.getText();
    const html = editor.getHTML();
    
    // Basic HTML to Markdown conversion
    markdown = html
      .replace(/<h1>(.*?)<\/h1>/g, '# $1\n\n')
      .replace(/<h2>(.*?)<\/h2>/g, '## $1\n\n')
      .replace(/<h3>(.*?)<\/h3>/g, '### $1\n\n')
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
      .replace(/<em>(.*?)<\/em>/g, '*$1*')
      .replace(/<s>(.*?)<\/s>/g, '~~$1~~')
      .replace(/<code>(.*?)<\/code>/g, '`$1`')
      .replace(/<a href="(.*?)".*?>(.*?)<\/a>/g, '[$2]($1)')
      .replace(/<ul><li>(.*?)<\/li><\/ul>/g, '* $1\n')
      .replace(/<ol><li>(.*?)<\/li><\/ol>/g, '1. $1\n')
      .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<[^>]*>/g, ''); // Remove remaining HTML tags

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${topic?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'blog'}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Blog gedownload als Markdown');
  };

  const downloadAsText = () => {
    if (!editor) return;

    const text = editor.getText();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${topic?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'blog'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Blog gedownload als tekst');
  };

  const insertLink = useCallback(() => {
    if (!editor || !linkUrl) return;

    if (linkUrl === '') {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().setLink({ href: linkUrl }).run();
    }

    setLinkUrl('');
    setLinkDialogOpen(false);
    toast.success('Link toegevoegd');
  }, [editor, linkUrl]);

  const insertImage = useCallback(() => {
    if (!editor || !imageUrl) return;

    editor.chain().focus().setImage({ src: imageUrl }).run();
    setImageUrl('');
    setImageDialogOpen(false);
    toast.success('Afbeelding toegevoegd');
  }, [editor, imageUrl]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    setUploadingImage(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      editor.chain().focus().setImage({ src: data.url }).run();
      toast.success('Afbeelding geüpload');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload mislukt');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [editor]);

  const insertTable = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    toast.success('Tabel toegevoegd');
  }, [editor]);

  // Nieuwe editor tools functies
  const insertCTABox = useCallback((html: string) => {
    if (!editor) return;
    
    // Als we in edit mode zijn, vervang de oude CTA box
    if (ctaBoxEditMode && ctaBoxEditElement) {
      const parent = ctaBoxEditElement.parentElement;
      if (parent) {
        // Maak een temporary div om de nieuwe HTML in te plaatsen
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const newCTABox = tempDiv.firstElementChild;
        
        if (newCTABox) {
          parent.replaceChild(newCTABox, ctaBoxEditElement);
          toast.success('CTA Box bijgewerkt!');
          
          // Reset edit mode
          setCtaBoxEditMode(false);
          setCtaBoxEditElement(null);
          setCtaBoxEditConfig(null);
        }
      }
    } else {
      // Normale insert mode
      editor.chain().focus().insertContent(html).run();
      toast.success('CTA Box toegevoegd!');
    }
  }, [editor, ctaBoxEditMode, ctaBoxEditElement]);

  const insertAIImage = useCallback((imageUrl: string) => {
    if (!editor) return;
    editor.chain().focus().setImage({ src: imageUrl }).run();
    toast.success('AI Afbeelding toegevoegd!');
  }, [editor]);

  const handleSelectedImage = useCallback((imageUrl: string) => {
    // Update featured image via onSave callback
    if (onSave) {
      onSave({
        content: editor?.getHTML() || '',
        seoMetadata: persistentSeoMetadata,
        featuredImage: imageUrl,
        socialMediaPost: null,
      });
      toast.success('Featured image bijgewerkt!');
    }
  }, [editor, onSave, persistentSeoMetadata]);

  const insertProductBox = useCallback((html: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(html).run();
    toast.success('Productbox toegevoegd!');
  }, [editor]);

  const insertAffiliateLink = useCallback(() => {
    if (!editor || !affiliateLinkUrl || !affiliateLinkText) {
      toast.error('Vul zowel de link als de tekst in');
      return;
    }

    // Voeg affiliate link toe met opmaak
    const affiliateHTML = `<a href="${affiliateLinkUrl}" target="_blank" rel="noopener noreferrer sponsored" style="color: #FF6B35; font-weight: 600; text-decoration: underline; transition: color 0.2s;">${affiliateLinkText}</a>`;
    
    editor.chain().focus().insertContent(affiliateHTML).run();
    
    setAffiliateLinkUrl('');
    setAffiliateLinkText('');
    setAffiliateLinkDialogOpen(false);
    toast.success('Affiliate link toegevoegd');
  }, [editor, affiliateLinkUrl, affiliateLinkText]);



  // AI Editing: Handle text selection
  const handleTextSelection = useCallback(() => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, ' ');

    if (text && text.length > 10) {
      setSelectedText(text);
      setShowTextEditDialog(true);
    } else if (text.length > 0 && text.length <= 10) {
      toast.info('Selecteer minimaal 10 tekens om te bewerken');
    }
  }, [editor]);

  // AI Editing: Rewrite text
  const handleRewriteText = async (instruction: string) => {
    if (!editor || !selectedText || !instruction) return;

    setEditingText(true);
    setTextEditInstruction(instruction);

    try {
      const response = await fetch('/api/client/rewrite-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: selectedText,
          instruction,
          tone: 'professional',
          language: 'nl',
        }),
      });

      if (!response.ok) throw new Error('Fout bij het herschrijven');

      const data = await response.json();
      setPreviewText(data.text);
      setPreviewType('text');
      setShowPreviewDialog(true);
      setShowTextEditDialog(false);

      toast.success(`Tekst herschreven! (${data.creditsUsed} credits gebruikt)`);
    } catch (error: any) {
      console.error('Error rewriting text:', error);
      toast.error(error.message || 'Fout bij het herschrijven van tekst');
    } finally {
      setEditingText(false);
    }
  };

  // AI Editing: Accept text changes
  const acceptTextChanges = useCallback(() => {
    if (!editor || !previewText) return;

    const { from, to } = editor.state.selection;
    editor.chain().focus().deleteRange({ from, to }).insertContent(previewText).run();

    setShowPreviewDialog(false);
    setPreviewText('');
    setSelectedText('');
    toast.success('Wijzigingen toegepast!');
  }, [editor, previewText]);

  // Generate intelligent image prompt based on surrounding content
  const generateIntelligentImagePrompt = (imageSrc: string): string => {
    if (!editor) return '';

    try {
      const { state } = editor;
      const { doc } = state;
      
      // Find the image node position
      let imagePos = -1;
      let surroundingText = '';
      
      doc.descendants((node, pos) => {
        if (node.type.name === 'image' && node.attrs.src === imageSrc) {
          imagePos = pos;
          
          // Get surrounding paragraphs (before and after image)
          const contextRange = 500; // characters to extract
          const startPos = Math.max(0, pos - contextRange);
          const endPos = Math.min(doc.content.size, pos + contextRange);
          
          // Extract text around the image
          surroundingText = doc.textBetween(startPos, endPos, ' ', ' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          return false; // Stop iteration
        }
      });
      
      if (!surroundingText) {
        // Fallback: use title or first paragraph
        const firstParagraph = doc.textBetween(0, Math.min(300, doc.content.size), ' ', ' ')
          .replace(/\s+/g, ' ')
          .trim();
        surroundingText = firstParagraph;
      }
      
      // Clean up the text and create a meaningful prompt
      if (surroundingText.length > 200) {
        // Find last complete sentence within 200 chars
        const truncated = surroundingText.substring(0, 200);
        const lastPeriod = Math.max(
          truncated.lastIndexOf('.'),
          truncated.lastIndexOf('?'),
          truncated.lastIndexOf('!')
        );
        if (lastPeriod > 0) {
          surroundingText = truncated.substring(0, lastPeriod + 1);
        }
      }
      
      // Generate intelligent prompt based on context
      const prompt = `Professional image related to: ${surroundingText}. 
      
Style: Modern, high-quality, visually appealing. 
16:9 aspect ratio, no text overlays.`;
      
      return prompt;
    } catch (error) {
      console.warn('Error generating intelligent image prompt:', error);
      return '';
    }
  };

  // AI Editing: Handle image click
  useEffect(() => {
    if (!editor) return;

    const handleImageClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG') {
        const imgSrc = target.getAttribute('src') || '';
        setSelectedImageSrc(imgSrc);
        
        // Generate intelligent prompt based on surrounding content
        const intelligentPrompt = generateIntelligentImagePrompt(imgSrc);
        if (intelligentPrompt) {
          setImageEditPrompt(intelligentPrompt);
        }
        
        setShowImageEditDialog(true);
      }
    };

    const editorElement = editor.view.dom;
    editorElement.addEventListener('click', handleImageClick);

    return () => {
      editorElement.removeEventListener('click', handleImageClick);
    };
  }, [editor]);

  // Handle text selection for floating toolbox
  useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = () => {
      const { state } = editor;
      const { from, to } = state.selection;
      const text = state.doc.textBetween(from, to, ' ');

      if (text.trim().length > 0) {
        // Get selection coordinates
        const { view } = editor;
        const start = view.coordsAtPos(from);
        const end = view.coordsAtPos(to);

        setSelectedText(text);
        setSelectionPosition({
          top: start.top - 60, // Position above selection
          left: (start.left + end.right) / 2 - 150, // Center the toolbox
        });
        setShowSelectionToolbox(true);
      } else {
        setShowSelectionToolbox(false);
        setSelectionPosition(null);
      }
    };

    editor.on('selectionUpdate', handleSelectionUpdate);

    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate);
    };
  }, [editor]);

  // Close toolbox when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        selectionToolboxRef.current &&
        !selectionToolboxRef.current.contains(e.target as Node)
      ) {
        // Only close if not clicking the editor
        const editorElement = editor?.view.dom;
        if (editorElement && !editorElement.contains(e.target as Node)) {
          setShowSelectionToolbox(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editor]);

  // Open text edit dialog from toolbox
  const openTextEditDialog = () => {
    setShowSelectionToolbox(false);
    setShowTextEditDialog(true);
  };

  // Fetch available image models
  useEffect(() => {
    const fetchImageModels = async () => {
      try {
        const response = await fetch('/api/client/generate-image');
        if (response.ok) {
          const data = await response.json();
          setImageModels(data.models || []);
        }
      } catch (error) {
        console.error('Error fetching image models:', error);
      }
    };
    fetchImageModels();
  }, []);

  // AI Editing: Generate new image
  const handleGenerateImage = async () => {
    if (!imageEditPrompt) {
      toast.error('Voer een beschrijving in voor de nieuwe afbeelding');
      return;
    }

    setEditingImage(true);

    try {
      const response = await fetch('/api/client/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imageEditPrompt,
          model: imageEditModel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fout bij het genereren van afbeelding');
      }

      const data = await response.json();
      setPreviewImageUrl(data.imageUrl);
      setPreviewType('image');
      setShowPreviewDialog(true);
      setShowImageEditDialog(false);

      toast.success(`Afbeelding gegenereerd met ${data.model}! (${data.creditsUsed} credits gebruikt)`);
    } catch (error: any) {
      console.error('Error generating image:', error);
      toast.error(error.message || 'Fout bij het genereren van afbeelding');
    } finally {
      setEditingImage(false);
    }
  };

  // AI Editing: Accept image changes
  const acceptImageChanges = useCallback(() => {
    if (!editor || !previewImageUrl || !selectedImageSrc) return;

    // Find and replace the image in the editor
    const { doc } = editor.state;
    let imagePos = -1;

    doc.descendants((node, pos) => {
      if (node.type.name === 'image' && node.attrs.src === selectedImageSrc) {
        imagePos = pos;
        return false; // Stop searching
      }
    });

    if (imagePos !== -1) {
      editor
        .chain()
        .focus()
        .deleteRange({ from: imagePos, to: imagePos + 1 })
        .setImage({ src: previewImageUrl })
        .run();

      setShowPreviewDialog(false);
      setPreviewImageUrl('');
      setSelectedImageSrc('');
      setImageEditPrompt('');
      toast.success('Afbeelding vervangen!');
    }
  }, [editor, previewImageUrl, selectedImageSrc]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-gray-400">Editor wordt geladen...</div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50' : 'h-full'} overflow-y-auto`} style={{ background: DARK_THEME.background }}>
      {/* Toolbar - Clean WritgoAI Dark style - FLOATING/STICKY! */}
      <div className="border-b sticky top-0 z-30 overflow-x-auto" style={{ background: DARK_THEME.cardBg, borderColor: DARK_THEME.border, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
        {/* Main Toolbar */}
        <div className="flex items-center justify-between px-2 md:px-3 py-1.5 border-b min-w-max md:min-w-0" style={{ borderColor: DARK_THEME.border }}>
          <div className="flex items-center gap-1 flex-wrap">
            {/* Text Formatting */}
            <div className="flex items-center gap-0.5 mr-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`h-8 w-8 p-0 ${editor.isActive('bold') ? 'bg-gray-100 text-gray-900' : ''}`}
                disabled={isGenerating}
                title="Vet (Ctrl+B)"
              >
                <Bold className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`h-8 w-8 p-0 ${editor.isActive('italic') ? 'bg-gray-100 text-gray-900' : ''}`}
                disabled={isGenerating}
                title="Cursief (Ctrl+I)"
              >
                <Italic className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={`h-8 w-8 p-0 ${editor.isActive('underline') ? 'bg-gray-100 text-gray-900' : ''}`}
                disabled={isGenerating}
                title="Onderstreept (Ctrl+U)"
              >
                <UnderlineIcon className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={`h-8 w-8 p-0 ${editor.isActive('strike') ? 'bg-gray-100 text-gray-900' : ''}`}
                disabled={isGenerating}
                title="Doorgestreept"
              >
                <Strikethrough className="w-4 h-4" />
              </Button>
            </div>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            {/* Headings */}
            <div className="flex items-center gap-0.5 mr-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={`h-8 w-8 p-0 ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-100 text-gray-900' : ''}`}
                disabled={isGenerating}
                title="Titel 1"
              >
                <Heading1 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`h-8 w-8 p-0 ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-100 text-gray-900' : ''}`}
                disabled={isGenerating}
                title="Titel 2"
              >
                <Heading2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={`h-8 w-8 p-0 ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-100 text-gray-900' : ''}`}
                disabled={isGenerating}
                title="Titel 3"
              >
                <Heading3 className="w-4 h-4" />
              </Button>
            </div>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            {/* Lists */}
            <div className="flex items-center gap-0.5 mr-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`h-8 w-8 p-0 ${editor.isActive('bulletList') ? 'bg-gray-100 text-gray-900' : ''}`}
                disabled={isGenerating}
                title="Lijst met opsommingstekens"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`h-8 w-8 p-0 ${editor.isActive('orderedList') ? 'bg-gray-100 text-gray-900' : ''}`}
                disabled={isGenerating}
                title="Genummerde lijst"
              >
                <ListOrdered className="w-4 h-4" />
              </Button>
            </div>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            {/* Alignment */}
            <div className="flex items-center gap-0.5 mr-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                className={`h-8 w-8 p-0 ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-100 text-gray-900' : ''}`}
                disabled={isGenerating}
                title="Links uitlijnen"
              >
                <AlignLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                className={`h-8 w-8 p-0 ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-100 text-gray-900' : ''}`}
                disabled={isGenerating}
                title="Centreren"
              >
                <AlignCenter className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                className={`h-8 w-8 p-0 ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-100 text-gray-900' : ''}`}
                disabled={isGenerating}
                title="Rechts uitlijnen"
              >
                <AlignRight className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                className={`h-8 w-8 p-0 ${editor.isActive({ textAlign: 'justify' }) ? 'bg-gray-100 text-gray-900' : ''}`}
                disabled={isGenerating}
                title="Uitvullen"
              >
                <AlignJustify className="w-4 h-4" />
              </Button>
            </div>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            {/* Insert Elements */}
            <div className="flex items-center gap-0.5 mr-1">
              <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 w-8 p-0 ${editor.isActive('link') ? 'bg-gray-100 text-gray-900' : ''}`}
                    disabled={isGenerating}
                    title="Link toevoegen"
                  >
                    <LinkIcon className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Link toevoegen</DialogTitle>
                    <DialogDescription>
                      Voer de URL in voor de link
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="link-url">URL</Label>
                      <Input
                        id="link-url"
                        placeholder="https://example.com"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            insertLink();
                          }
                        }}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
                      Annuleren
                    </Button>
                    <Button onClick={insertLink} className="bg-orange-500 hover:bg-orange-600">
                      Toevoegen
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={isGenerating}
                    title="Afbeelding toevoegen"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Afbeelding toevoegen</DialogTitle>
                    <DialogDescription>
                      Upload een afbeelding of voer een URL in
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Upload afbeelding</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                        />
                        {uploadingImage && (
                          <div className="animate-spin">
                            <Loader2 className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-sm text-gray-500">OF</span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="image-url">Afbeelding URL</Label>
                      <Input
                        id="image-url"
                        placeholder="https://i.ytimg.com/vi/IBccH7Yp9rg/maxresdefault.jpg"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            insertImage();
                          }
                        }}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setImageDialogOpen(false)}>
                      Annuleren
                    </Button>
                    <Button onClick={insertImage} className="bg-orange-500 hover:bg-orange-600">
                      Toevoegen
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button
                variant="ghost"
                size="sm"
                onClick={insertTable}
                className="h-8 w-8 p-0"
                disabled={isGenerating}
                title="Tabel toevoegen"
              >
                <TableIcon className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleHighlight().run()}
                className={`h-8 w-8 p-0 ${editor.isActive('highlight') ? 'bg-yellow-100 text-yellow-600' : ''}`}
                disabled={isGenerating}
                title="Markeren"
              >
                <Highlighter className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleCode().run()}
                className={`h-8 w-8 p-0 ${editor.isActive('code') ? 'bg-gray-100 text-gray-900' : ''}`}
                disabled={isGenerating}
                title="Code"
              >
                <Code className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={`h-8 w-8 p-0 ${editor.isActive('blockquote') ? 'bg-gray-100 text-gray-900' : ''}`}
                disabled={isGenerating}
                title="Citaat"
              >
                <Quote className="w-4 h-4" />
              </Button>
            </div>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            {/* Undo/Redo */}
            <div className="flex items-center gap-0.5 mr-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo() || isGenerating}
                className="h-8 w-8 p-0"
                title="Ongedaan maken (Ctrl+Z)"
              >
                <Undo className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo() || isGenerating}
                className="h-8 w-8 p-0"
                title="Opnieuw (Ctrl+Y)"
              >
                <Redo className="w-4 h-4" />
              </Button>
            </div>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            {/* Clear Formatting */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
              disabled={isGenerating}
              className="h-8 w-8 p-0"
              title="Opmaak wissen"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* 🆕 Geavanceerde Editor Tools */}
          <div className="flex items-center gap-0.5 mr-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAiImageDialogOpen(true)}
              disabled={isGenerating}
              className="h-8 px-2 hover:bg-orange-50"
              title="AI Afbeelding Genereren"
            >
              <Sparkles className="w-4 h-4 text-orange-500 mr-1" />
              <span className="text-xs hidden md:inline">Afbeelding</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCtaBoxDialogOpen(true)}
              disabled={isGenerating}
              className="h-8 px-2 hover:bg-blue-50"
              title="CTA Box Toevoegen"
            >
              <Zap className="w-4 h-4 text-blue-500 mr-1" />
              <span className="text-xs hidden md:inline">CTA Box</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setProductBoxDialogOpen(true)}
              disabled={isGenerating || !projectId}
              className="h-8 px-2 hover:bg-green-50"
              title={!projectId ? "Selecteer een project" : "Productbox Toevoegen"}
            >
              <Package className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-xs hidden md:inline">Product</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAffiliateLinkDialogOpen(true)}
              disabled={isGenerating}
              className="h-8 px-2 hover:bg-purple-50"
              title="Affiliate Link Toevoegen"
            >
              <LinkIcon className="w-4 h-4 text-purple-500 mr-1" />
              <span className="text-xs hidden md:inline">Affiliate</span>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* Font Size */}
            <Select
              value={fontSize.toString()}
              onValueChange={(value) => setFontSize(parseInt(value))}
            >
              <SelectTrigger className="w-20 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12">12px</SelectItem>
                <SelectItem value="14">14px</SelectItem>
                <SelectItem value="16">16px</SelectItem>
                <SelectItem value="18">18px</SelectItem>
                <SelectItem value="20">20px</SelectItem>
                <SelectItem value="24">24px</SelectItem>
              </SelectContent>
            </Select>

            {/* Preview Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="h-8"
              title={showPreview ? 'Bewerk modus' : 'Voorbeeld'}
            >
              {showPreview ? <Edit2 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Secondary Toolbar - AI Actions & Export */}
        <div className="flex items-center justify-between px-2 md:px-4 py-2 gap-2 overflow-x-auto">
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* AI Edit Selected Text Button */}
            <Button
              variant="outline"
              size="sm"
              className="bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 border-none h-8"
              onClick={handleTextSelection}
              disabled={isGenerating}
            >
              <Wand2 className="w-4 h-4 mr-2" />
              AI Bewerk Tekst
            </Button>

            {/* AI Actions */}
            {onRequestChange && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 border-none h-8"
                    disabled={isGenerating}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI Acties
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  <DropdownMenuLabel>✨ Aanpassen met AI</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onRequestChange('Maak de blog langer en voeg meer details en voorbeelden toe')}>
                    <Expand className="w-4 h-4 mr-2" />
                    📝 Maak langer
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onRequestChange('Maak de blog korter en bondiger zonder belangrijke informatie te verliezen')}>
                    <Minimize className="w-4 h-4 mr-2" />
                    ✂️ Maak korter
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onRequestChange('Verbeter de SEO optimalisatie met betere keywords en structuur')}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    🚀 Verbeter SEO
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onRequestChange('Maak de toon vriendelijker, toegankelijker en persoonlijker')}>
                    <Palette className="w-4 h-4 mr-2" />
                    😊 Vriendelijker toon
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onRequestChange('Maak de toon professioneler en formeler')}>
                    <Palette className="w-4 h-4 mr-2" />
                    💼 Professioneler toon
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onRequestChange('Voeg meer praktische voorbeelden en case studies toe')}>
                    <ImageIcon className="w-4 h-4 mr-2" />
                    💡 Meer voorbeelden
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onRequestChange('Voeg relevante statistieken en data toe')}>
                    <ImageIcon className="w-4 h-4 mr-2" />
                    📊 Voeg statistieken toe
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onRequestChange('Herschrijf de hele blog compleet opnieuw met een frisse benadering')}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    🔄 Volledig herschrijven
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Save Button */}
            {onSave && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={isGenerating}
                className="h-8"
              >
                <Save className="w-4 h-4 mr-2" />
                Opslaan
              </Button>
            )}

            {/* Copy */}
            <Button
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
              disabled={isGenerating}
              className="h-8"
              title="Kopieer naar klembord"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </Button>

            {/* Export */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" disabled={isGenerating} className="h-8">
                  <Download className="w-4 h-4 mr-2" />
                  Exporteren
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Download als</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={downloadAsHTML}>
                  <Globe className="w-4 h-4 mr-2" />
                  HTML bestand
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadAsMarkdown}>
                  <Code className="w-4 h-4 mr-2" />
                  Markdown (.md)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadAsText}>
                  <FileText className="w-4 h-4 mr-2" />
                  Platte tekst (.txt)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* WordPress Publish */}
            <Button
              variant="outline"
              size="sm"
              disabled={isGenerating}
              className="h-8 bg-[#ff6b35] hover:bg-[#ff8c42] text-white border-[#ff6b35]"
              onClick={() => setWordPressDialogOpen(true)}
            >
              <Globe className="w-4 h-4 mr-2" />
              Naar WordPress
            </Button>

            {/* Fullscreen Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-8"
              title={isFullscreen ? 'Volledig scherm sluiten' : 'Volledig scherm'}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Expand className="w-4 h-4" />}
            </Button>

            {/* Close Editor */}
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                title="Editor sluiten"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Floating Selection Toolbox */}
      {showSelectionToolbox && selectionPosition && (
        <div
          ref={selectionToolboxRef}
          className="fixed z-50 bg-black text-white rounded-lg shadow-2xl flex items-center gap-1 px-2 py-1.5 animate-in fade-in slide-in-from-top-2 duration-200"
          style={{
            top: `${selectionPosition.top}px`,
            left: `${selectionPosition.left}px`,
          }}
        >
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-white hover:bg-orange-500 hover:text-white"
            onClick={openTextEditDialog}
          >
            <Wand2 className="w-4 h-4 mr-1" />
            Bewerk met AI
          </Button>
          <div className="w-px h-6 bg-gray-600" />
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-white hover:bg-gray-700"
            onClick={() => {
              editor?.chain().focus().toggleBold().run();
              setShowSelectionToolbox(false);
            }}
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-white hover:bg-gray-700"
            onClick={() => {
              editor?.chain().focus().toggleItalic().run();
              setShowSelectionToolbox(false);
            }}
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-white hover:bg-gray-700"
            onClick={() => {
              editor?.chain().focus().toggleUnderline().run();
              setShowSelectionToolbox(false);
            }}
          >
            <UnderlineIcon className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Editor Content - WritgoAI Dark style */}
      <div className="flex-1" style={{ background: DARK_THEME.background }}>
        <div className="w-full max-w-4xl mx-auto py-2 md:py-12 px-2 md:px-4 lg:px-8">
          <div className="shadow-sm border min-h-[500px] md:min-h-[297mm] p-3 md:p-8 lg:p-16 w-full max-w-full overflow-x-auto" style={{ background: DARK_THEME.cardBg, borderColor: DARK_THEME.border, color: DARK_THEME.text, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
            {/* 🖼️ FEATURED IMAGE - Boven de content */}
            {featuredImage && (
              <div className="mb-4 md:mb-8 rounded-lg overflow-hidden relative group">
                <img 
                  src={featuredImage} 
                  alt={topic || 'Featured image'} 
                  className="w-full h-auto"
                  style={{ maxHeight: '400px', objectFit: 'cover' }}
                />
                {/* Refresh Button - shows on hover */}
                {onRefreshFeaturedImage && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <Button
                      size="sm"
                      onClick={onRefreshFeaturedImage}
                      disabled={refreshingImage}
                      className="bg-black/70 hover:bg-black/90 text-white border border-white/20"
                    >
                      {refreshingImage ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Genereren...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Vernieuw afbeelding
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setImageSelectorOpen(true)}
                      className="bg-blue-600/80 hover:bg-blue-700/90 text-white border border-white/20"
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Selecteer afbeelding
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {showPreview ? (
              <div 
                className="prose prose-sm md:prose-lg max-w-none break-words overflow-x-auto"
                style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
              />
            ) : (
              <EditorContent editor={editor} />
            )}
          </div>
          
          {/* SEO Metadata Section - Shown below content */}
          {persistentSeoMetadata && (
            <div className="mt-4 md:mt-8 shadow-sm border p-3 md:p-6 rounded-lg max-w-4xl" style={{ background: DARK_THEME.cardBg, borderColor: DARK_THEME.border }}>
              <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4 flex items-center gap-2" style={{ color: DARK_THEME.text }}>
                <Sparkles className="w-4 md:w-5 h-4 md:h-5" style={{ color: DARK_THEME.orange }} />
                SEO Metadata
              </h3>
              
              <div className="space-y-4">
                {/* SEO Title */}
                <div>
                  <Label className="text-xs md:text-sm font-semibold mb-1 block" style={{ color: DARK_THEME.textSecondary }}>
                    SEO Titel ({persistentSeoMetadata.seoTitle?.length || 0} tekens)
                  </Label>
                  <div className="border rounded-md p-2 md:p-3" style={{ background: DARK_THEME.background, borderColor: DARK_THEME.border, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                    <p className="text-sm md:text-base" style={{ color: DARK_THEME.text }}>{persistentSeoMetadata.seoTitle}</p>
                  </div>
                </div>
                
                {/* Meta Description */}
                <div>
                  <Label className="text-xs md:text-sm font-semibold mb-1 block" style={{ color: DARK_THEME.textSecondary }}>
                    Meta Omschrijving ({persistentSeoMetadata.metaDescription?.length || 0} tekens)
                  </Label>
                  <div className="border rounded-md p-2 md:p-3" style={{ background: DARK_THEME.background, borderColor: DARK_THEME.border, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                    <p className="text-sm md:text-base" style={{ color: DARK_THEME.text }}>{persistentSeoMetadata.metaDescription}</p>
                  </div>
                </div>
                
                {/* Focus Keyword */}
                <div>
                  <Label className="text-xs md:text-sm font-semibold mb-1 block" style={{ color: DARK_THEME.textSecondary }}>
                    Focus Keyword
                  </Label>
                  <div className="border rounded-md p-2 md:p-3" style={{ background: DARK_THEME.background, borderColor: DARK_THEME.border, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                    <p className="text-sm md:text-base font-mono" style={{ color: DARK_THEME.orange }}>{persistentSeoMetadata.focusKeyword}</p>
                  </div>
                </div>
                
                {/* Extra Keywords */}
                {persistentSeoMetadata.extraKeywords && persistentSeoMetadata.extraKeywords.length > 0 && (
                  <div>
                    <Label className="text-xs md:text-sm font-semibold mb-1 block" style={{ color: DARK_THEME.textSecondary }}>
                      Extra Keywords ({persistentSeoMetadata.extraKeywords.length})
                    </Label>
                    <div className="border rounded-md p-2 md:p-3" style={{ background: DARK_THEME.background, borderColor: DARK_THEME.border }}>
                      <div className="flex flex-wrap gap-1.5 md:gap-2">
                        {persistentSeoMetadata.extraKeywords.map((keyword, index) => (
                          <span 
                            key={index}
                            className="inline-flex items-center px-2 md:px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={{ background: DARK_THEME.orange, color: '#000000', wordBreak: 'break-word' }}
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* LSI Keywords */}
                {persistentSeoMetadata.lsiKeywords && persistentSeoMetadata.lsiKeywords.length > 0 && (
                  <div>
                    <Label className="text-xs md:text-sm font-semibold mb-1 block" style={{ color: DARK_THEME.textSecondary }}>
                      LSI Keywords ({persistentSeoMetadata.lsiKeywords.length})
                    </Label>
                    <div className="border rounded-md p-2 md:p-3" style={{ background: DARK_THEME.background, borderColor: DARK_THEME.border }}>
                      <div className="flex flex-wrap gap-1.5 md:gap-2">
                        {persistentSeoMetadata.lsiKeywords.map((keyword, index) => (
                          <span 
                            key={index}
                            className="inline-flex items-center px-2 md:px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={{ background: DARK_THEME.orangeLight, color: '#000000', wordBreak: 'break-word' }}
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Social Media Post Section - Shown below SEO Metadata */}
          {persistentSocialMediaPost && (
            <div className="mt-4 md:mt-8 shadow-sm border p-3 md:p-6 rounded-lg max-w-4xl" style={{ background: DARK_THEME.cardBg, borderColor: DARK_THEME.border }}>
              <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4 flex items-center gap-2" style={{ color: DARK_THEME.text }}>
                <Share2 className="w-4 md:w-5 h-4 md:h-5" style={{ color: DARK_THEME.orange }} />
                Social Media Post
              </h3>
              
              <div className="space-y-4">
                {/* Social Media Image */}
                {persistentSocialMediaPost.imageUrl && (
                  <div>
                    <Label className="text-xs md:text-sm font-semibold mb-2 block" style={{ color: DARK_THEME.textSecondary }}>
                      Social Media Afbeelding (1:1 vierkant)
                    </Label>
                    <div className="border rounded-md overflow-hidden" style={{ borderColor: DARK_THEME.border }}>
                      <img 
                        src={persistentSocialMediaPost.imageUrl} 
                        alt="Social media post afbeelding" 
                        className="w-full max-w-md mx-auto"
                        style={{ aspectRatio: '1/1', objectFit: 'cover' }}
                      />
                    </div>
                    <p className="text-xs mt-2" style={{ color: DARK_THEME.textSecondary }}>
                      📏 Geschikt voor LinkedIn, Facebook en Instagram (1080x1080px)
                    </p>
                  </div>
                )}
                
                {/* Social Media Text */}
                <div>
                  <Label className="text-xs md:text-sm font-semibold mb-2 block" style={{ color: DARK_THEME.textSecondary }}>
                    Post Tekst ({persistentSocialMediaPost.text.length} tekens)
                  </Label>
                  <div className="border rounded-md p-3 md:p-4" style={{ background: DARK_THEME.background, borderColor: DARK_THEME.border }}>
                    <p className="text-sm md:text-base whitespace-pre-wrap" style={{ color: DARK_THEME.text, lineHeight: '1.6' }}>
                      {persistentSocialMediaPost.text}
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(persistentSocialMediaPost.text);
                      toast.success('Post tekst gekopieerd!');
                    }}
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    style={{ borderColor: DARK_THEME.border }}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Kopieer tekst
                  </Button>
                </div>
                
                {/* Hashtags */}
                {persistentSocialMediaPost.hashtags && persistentSocialMediaPost.hashtags.length > 0 && (
                  <div>
                    <Label className="text-xs md:text-sm font-semibold mb-2 block" style={{ color: DARK_THEME.textSecondary }}>
                      Hashtags ({persistentSocialMediaPost.hashtags.length})
                    </Label>
                    <div className="border rounded-md p-3 md:p-4" style={{ background: DARK_THEME.background, borderColor: DARK_THEME.border }}>
                      <div className="flex flex-wrap gap-2">
                        {persistentSocialMediaPost.hashtags.map((hashtag, index) => (
                          <span 
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs md:text-sm font-medium"
                            style={{ background: DARK_THEME.orange, color: '#000000' }}
                          >
                            {hashtag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        const hashtagsText = persistentSocialMediaPost.hashtags.join(' ');
                        navigator.clipboard.writeText(hashtagsText);
                        toast.success('Hashtags gekopieerd!');
                      }}
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      style={{ borderColor: DARK_THEME.border }}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Kopieer hashtags
                    </Button>
                  </div>
                )}
                
                {/* Combined Copy Button */}
                <div className="pt-2 border-t" style={{ borderColor: DARK_THEME.border }}>
                  <Button
                    onClick={() => {
                      const fullPost = `${persistentSocialMediaPost.text}\n\n${persistentSocialMediaPost.hashtags.join(' ')}`;
                      navigator.clipboard.writeText(fullPost);
                      toast.success('Volledige social media post gekopieerd!');
                    }}
                    className="w-full"
                    style={{ background: DARK_THEME.orange, color: '#000000' }}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Kopieer volledige post (tekst + hashtags)
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Bar - WritgoAI Dark style */}
      <div className="border-t px-4 py-2 text-sm" style={{ background: DARK_THEME.cardBg, borderColor: DARK_THEME.border }}>
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-4" style={{ color: DARK_THEME.textSecondary }}>
            <span className="font-medium">{editor.storage.characterCount?.characters?.() || 0} tekens</span>
            <span>•</span>
            <span className="font-medium">{editor.storage.characterCount?.words?.() || 0} woorden</span>
            {lastSaved && (
              <>
                <span>•</span>
                <span>
                  Laatst opgeslagen: {lastSaved.toLocaleTimeString('nl-NL')}
                </span>
              </>
            )}
          </div>
          {isGenerating && (
            <div className="flex items-center gap-2" style={{ color: DARK_THEME.orange }}>
              <div className="relative flex h-2 w-2">
                <div className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: DARK_THEME.orange }}></div>
                <div className="relative inline-flex rounded-full h-2 w-2" style={{ background: DARK_THEME.orange }}></div>
              </div>
              <span className="font-medium">AI is aan het schrijven...</span>
            </div>
          )}
        </div>
      </div>

      {/* Text Edit Dialog */}
      <Dialog open={showTextEditDialog} onOpenChange={setShowTextEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-purple-500" />
              Tekst bewerken met AI
            </DialogTitle>
            <DialogDescription>
              Selecteer een actie om de geselecteerde tekst te bewerken
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Selected Text Preview */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Geselecteerde tekst:</Label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg max-h-32 overflow-y-auto">
                <p className="text-sm text-gray-700">{selectedText}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Snelle acties:</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleRewriteText('Herschrijf deze tekst met betere formulering en structuur')}
                  disabled={editingText}
                  className="justify-start"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Herschrijven
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleRewriteText('Maak deze tekst langer en voeg meer details toe')}
                  disabled={editingText}
                  className="justify-start"
                >
                  <Expand className="w-4 h-4 mr-2" />
                  Uitbreiden
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleRewriteText('Maak deze tekst korter en bondiger')}
                  disabled={editingText}
                  className="justify-start"
                >
                  <Minimize className="w-4 h-4 mr-2" />
                  Inkorten
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleRewriteText('Maak deze tekst professioneler')}
                  disabled={editingText}
                  className="justify-start"
                >
                  <Palette className="w-4 h-4 mr-2" />
                  Professioneler
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleRewriteText('Maak deze tekst vriendelijker en toegankelijker')}
                  disabled={editingText}
                  className="justify-start"
                >
                  <Palette className="w-4 h-4 mr-2" />
                  Vriendelijker
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleRewriteText('Voeg concrete voorbeelden toe aan deze tekst')}
                  disabled={editingText}
                  className="justify-start"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Voorbeelden
                </Button>
              </div>
            </div>

            {/* Custom Instruction */}
            <div className="space-y-2">
              <Label htmlFor="custom-instruction" className="text-sm font-semibold">
                Of geef een eigen instructie:
              </Label>
              <Textarea
                id="custom-instruction"
                value={textEditInstruction}
                onChange={(e) => setTextEditInstruction(e.target.value)}
                placeholder="Bijvoorbeeld: Voeg meer statistieken toe, maak het spannender, gebruik minder jargon..."
                rows={3}
                className="resize-none"
              />
              <Button
                onClick={() => handleRewriteText(textEditInstruction)}
                disabled={editingText || !textEditInstruction}
                className="w-full bg-purple-500 hover:bg-purple-600"
              >
                {editingText ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Bewerken...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Toepassen
                  </>
                )}
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTextEditDialog(false)}>
              Annuleren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Edit Dialog */}
      <Dialog open={showImageEditDialog} onOpenChange={setShowImageEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Replace className="w-5 h-5 text-blue-500" />
              Afbeelding vervangen met AI
            </DialogTitle>
            <DialogDescription>
              Beschrijf de nieuwe afbeelding die je wilt genereren
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Current Image Preview */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Huidige afbeelding:</Label>
              <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={selectedImageSrc}
                  alt="Current"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Image Prompt */}
            <div className="space-y-2">
              <Label htmlFor="image-prompt" className="text-sm font-semibold">
                Beschrijving nieuwe afbeelding: *
              </Label>
              <Textarea
                id="image-prompt"
                value={imageEditPrompt}
                onChange={(e) => setImageEditPrompt(e.target.value)}
                placeholder="Bijvoorbeeld: Een moderne kantooromgeving met diverse mensen die samenwerken aan laptops"
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Image Model Selection */}
            <div className="space-y-2">
              <Label htmlFor="image-model" className="text-sm font-semibold">
                AI Model & Kwaliteit:
              </Label>
              <Select value={imageEditModel} onValueChange={setImageEditModel}>
                <SelectTrigger id="image-model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {imageModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center justify-between w-full gap-3">
                        <div className="flex flex-col items-start">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{model.name}</span>
                            {model.recommended && (
                              <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                                Aanbevolen
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">{model.description}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-400">{model.speed}</span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs font-semibold text-[#FF9933]">
                              {model.credits} credits
                            </span>
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {imageModels.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  💡 Flux Schnell is aanbevolen voor snelle en goede resultaten
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowImageEditDialog(false)}>
              Annuleren
            </Button>
            <Button
              onClick={handleGenerateImage}
              disabled={editingImage || !imageEditPrompt}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {editingImage ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Genereren...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Nieuwe afbeelding genereren
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-green-500" />
              Preview wijzigingen
            </DialogTitle>
            <DialogDescription>
              Bekijk de voorgestelde wijziging en accepteer of verwerp deze
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[50vh] py-4">
            {previewType === 'text' && (
              <div className="space-y-4">
                {/* Original Text */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    Originele tekst:
                  </Label>
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedText}</p>
                  </div>
                </div>

                {/* New Text */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    Nieuwe tekst:
                  </Label>
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div
                      className="text-sm text-gray-700 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: previewText }}
                    />
                  </div>
                </div>
              </div>
            )}

            {previewType === 'image' && (
              <div className="space-y-4">
                {/* Original Image */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    Originele afbeelding:
                  </Label>
                  <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-red-200">
                    <img
                      src={selectedImageSrc}
                      alt="Original"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* New Image */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    Nieuwe afbeelding:
                  </Label>
                  <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-green-200">
                    <img
                      src={previewImageUrl}
                      alt="New"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowPreviewDialog(false);
                setPreviewText('');
                setPreviewImageUrl('');
              }}
            >
              <X className="w-4 h-4 mr-2" />
              Verwerpen
            </Button>
            <Button
              onClick={previewType === 'text' ? acceptTextChanges : acceptImageChanges}
              className="bg-green-500 hover:bg-green-600"
            >
              <Check className="w-4 h-4 mr-2" />
              Accepteren en toepassen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* WordPress Publisher Dialog */}
      <WordPressPublisherDialog
        open={wordPressDialogOpen}
        onOpenChange={setWordPressDialogOpen}
        title={topic || 'Blog artikel'}
        content={editor?.getHTML() || ''}
        excerpt={seoMetadata?.metaDescription || ''}
        featuredImageUrl={featuredImage}
        onPublishSuccess={(url) => {
          toast.success(`Gepubliceerd naar WordPress: ${url}`);
        }}
      />

      {/* 🆕 CTA Box Creator Dialog */}
      <CTABoxCreator
        open={ctaBoxDialogOpen}
        onClose={() => {
          setCtaBoxDialogOpen(false);
          setCtaBoxEditMode(false);
          setCtaBoxEditElement(null);
          setCtaBoxEditConfig(null);
        }}
        onInsert={insertCTABox}
        editMode={ctaBoxEditMode}
        editElement={ctaBoxEditElement}
        initialConfig={ctaBoxEditConfig}
      />

      {/* 🆕 AI Image Generator Dialog */}
      <AIImageGeneratorDialog
        open={aiImageDialogOpen}
        onClose={() => setAiImageDialogOpen(false)}
        onInsert={insertAIImage}
        defaultPrompt={topic || ''}
      />

      {/* Image Selector Modal */}
      <ImageSelectorModal
        open={imageSelectorOpen}
        onClose={() => setImageSelectorOpen(false)}
        onSelect={handleSelectedImage}
        projectId={undefined}
      />

      {/* 🆕 Product Box Selector Dialog */}
      <ProductBoxSelector
        open={productBoxDialogOpen}
        onClose={() => setProductBoxDialogOpen(false)}
        onInsert={insertProductBox}
        projectId={projectId || ''}
      />

      {/* 🆕 CTA Box Selector Dialog */}
      <CTABoxSelector
        open={ctaBoxDialogOpen && !ctaBoxEditMode}
        onClose={() => setCtaBoxDialogOpen(false)}
        onInsert={insertCTABox}
      />

      {/* 🆕 Affiliate Link Dialog */}
      <Dialog open={affiliateLinkDialogOpen} onOpenChange={setAffiliateLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Affiliate Link Toevoegen</DialogTitle>
            <DialogDescription>
              Voeg een affiliate link toe met custom tekst
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="affiliate-text">Link Tekst *</Label>
              <Input
                id="affiliate-text"
                placeholder="Bijv: Bekijk dit product op Amazon"
                value={affiliateLinkText}
                onChange={(e) => setAffiliateLinkText(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="affiliate-url">Affiliate URL *</Label>
              <Input
                id="affiliate-url"
                placeholder="https://..."
                value={affiliateLinkUrl}
                onChange={(e) => setAffiliateLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    insertAffiliateLink();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAffiliateLinkDialogOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={insertAffiliateLink} className="bg-purple-500 hover:bg-purple-600">
              Toevoegen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}