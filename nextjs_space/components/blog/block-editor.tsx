'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Code,
  Quote,
  Table as TableIcon,
  Upload,
  Video,
  Palette,
  Highlighter,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';

interface BlockEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  onImageUpload?: (file: File) => Promise<string>;
}

export function BlockEditor({ content, onChange, placeholder, onImageUpload }: BlockEditorProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [showVideoInput, setShowVideoInput] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-orange-500 underline hover:text-orange-600',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg my-4',
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
          class: 'border border-gray-700 bg-gray-800 px-4 py-2 font-bold',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-700 px-4 py-2',
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Schrijf je artikel hier...',
      }),
      CharacterCount,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose lg:prose-lg xl:prose-xl prose-invert max-w-none focus:outline-none min-h-[600px] p-6 text-gray-200',
      },
    },
  });

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!editor || acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      if (!file.type.startsWith('image/')) {
        toast.error('Alleen afbeeldingen zijn toegestaan');
        return;
      }

      setUploading(true);
      try {
        let imageUrl: string;

        if (onImageUpload) {
          imageUrl = await onImageUpload(file);
        } else {
          // Default upload logic
          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error('Upload mislukt');
          }

          const data = await response.json();
          imageUrl = data.url;
        }

        editor.chain().focus().setImage({ src: imageUrl }).run();
        toast.success('Afbeelding geüpload!');
      } catch (error) {
        console.error('Upload error:', error);
        toast.error('Fout bij uploaden van afbeelding');
      } finally {
        setUploading(false);
      }
    },
    [editor, onImageUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    noClick: true,
    noKeyboard: true,
  });

  if (!editor) {
    return null;
  }

  const addLink = () => {
    if (linkUrl) {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: linkUrl })
        .run();
      setLinkUrl('');
      setShowLinkInput(false);
    }
  };

  const addImage = () => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
      setShowImageInput(false);
    }
  };

  const addVideo = () => {
    if (videoUrl) {
      // Extract video ID and create embed HTML
      const { extractYouTubeId, extractVimeoId } = require('@/lib/blog-utils');
      let embedHtml = '';
      
      // Only proceed if URL starts with proper protocol and domain
      const urlLower = videoUrl.toLowerCase();
      if (urlLower.startsWith('https://www.youtube.com/') || 
          urlLower.startsWith('https://youtube.com/') || 
          urlLower.startsWith('https://youtu.be/') ||
          urlLower.startsWith('http://www.youtube.com/') || 
          urlLower.startsWith('http://youtube.com/') || 
          urlLower.startsWith('http://youtu.be/')) {
        const videoId = extractYouTubeId(videoUrl);
        if (videoId) {
          embedHtml = `<div class="video-wrapper my-4"><iframe width="100%" height="400" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
        }
      } else if (urlLower.startsWith('https://vimeo.com/') || 
                 urlLower.startsWith('http://vimeo.com/') ||
                 urlLower.startsWith('https://www.vimeo.com/') || 
                 urlLower.startsWith('http://www.vimeo.com/')) {
        const videoId = extractVimeoId(videoUrl);
        if (videoId) {
          embedHtml = `<div class="video-wrapper my-4"><iframe width="100%" height="400" src="https://player.vimeo.com/video/${videoId}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>`;
        }
      }

      if (embedHtml) {
        editor.chain().focus().insertContent(embedHtml).run();
        setVideoUrl('');
        setShowVideoInput(false);
        toast.success('Video toegevoegd!');
      } else {
        toast.error('Ongeldige video URL. Gebruik een volledige YouTube of Vimeo URL.');
      }
    }
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onDrop([file]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card className="p-3 bg-gray-800/50 border-gray-700">
        <div className="flex flex-wrap gap-1">
          {/* Text formatting */}
          <div className="flex gap-1 pr-2 border-r border-gray-700">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={editor.isActive('bold') ? 'bg-orange-500 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}
              title="Vet (Ctrl+B)"
            >
              <Bold className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={editor.isActive('italic') ? 'bg-orange-500 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}
              title="Cursief (Ctrl+I)"
            >
              <Italic className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={editor.isActive('underline') ? 'bg-orange-500 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}
              title="Onderstrepen (Ctrl+U)"
            >
              <UnderlineIcon className="w-4 h-4" />
            </Button>
          </div>

          {/* Headings */}
          <div className="flex gap-1 pr-2 border-r border-gray-700">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={
                editor.isActive('heading', { level: 1 }) ? 'bg-orange-500 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }
              title="Titel 1"
            >
              <Heading1 className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={
                editor.isActive('heading', { level: 2 }) ? 'bg-orange-500 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }
              title="Titel 2"
            >
              <Heading2 className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={
                editor.isActive('heading', { level: 3 }) ? 'bg-orange-500 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }
              title="Titel 3"
            >
              <Heading3 className="w-4 h-4" />
            </Button>
          </div>

          {/* Lists */}
          <div className="flex gap-1 pr-2 border-r border-gray-700">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={editor.isActive('bulletList') ? 'bg-orange-500 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}
              title="Opsommingslijst"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={editor.isActive('orderedList') ? 'bg-orange-500 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}
              title="Genummerde lijst"
            >
              <ListOrdered className="w-4 h-4" />
            </Button>
          </div>

          {/* Alignment */}
          <div className="flex gap-1 pr-2 border-r border-gray-700">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              className={
                editor.isActive({ textAlign: 'left' }) ? 'bg-orange-500 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }
              title="Links uitlijnen"
            >
              <AlignLeft className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              className={
                editor.isActive({ textAlign: 'center' }) ? 'bg-orange-500 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }
              title="Centreren"
            >
              <AlignCenter className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              className={
                editor.isActive({ textAlign: 'right' }) ? 'bg-orange-500 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }
              title="Rechts uitlijnen"
            >
              <AlignRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Blocks */}
          <div className="flex gap-1 pr-2 border-r border-gray-700">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={editor.isActive('blockquote') ? 'bg-orange-500 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}
              title="Quote"
            >
              <Quote className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={editor.isActive('codeBlock') ? 'bg-orange-500 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}
              title="Code blok"
            >
              <Code className="w-4 h-4" />
            </Button>
          </div>

          {/* Media & Embeds */}
          <div className="flex gap-1 pr-2 border-r border-gray-700">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowLinkInput(!showLinkInput)}
              className="text-gray-300 hover:text-white hover:bg-gray-700"
              title="Link toevoegen"
            >
              <LinkIcon className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="text-gray-300 hover:text-white hover:bg-gray-700"
              disabled={uploading}
              title="Afbeelding uploaden"
            >
              {uploading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowImageInput(!showImageInput)}
              className="text-gray-300 hover:text-white hover:bg-gray-700"
              title="Afbeelding URL"
            >
              <ImageIcon className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowVideoInput(!showVideoInput)}
              className="text-gray-300 hover:text-white hover:bg-gray-700"
              title="Video embed"
            >
              <Video className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={insertTable}
              className="text-gray-300 hover:text-white hover:bg-gray-700"
              title="Tabel invoegen"
            >
              <TableIcon className="w-4 h-4" />
            </Button>
          </div>

          {/* Color & Highlight */}
          <div className="flex gap-1">
            <input
              type="color"
              onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
              value={editor.getAttributes('textStyle').color || '#ffffff'}
              className="w-8 h-8 rounded cursor-pointer"
              title="Tekstkleur"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHighlight({ color: '#ffc078' }).run()}
              className={editor.isActive('highlight') ? 'bg-orange-500 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}
              title="Markeren"
            >
              <Highlighter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Input panels */}
        {showLinkInput && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-700">
            <Input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="bg-gray-900 border-gray-700 text-white"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addLink();
                }
              }}
            />
            <Button type="button" onClick={addLink} size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
              Toevoegen
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowLinkInput(false)}
              size="sm"
              className="text-gray-300 hover:text-white hover:bg-gray-700"
            >
              Annuleren
            </Button>
          </div>
        )}

        {showImageInput && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-700">
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="bg-gray-900 border-gray-700 text-white"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addImage();
                }
              }}
            />
            <Button type="button" onClick={addImage} size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
              Toevoegen
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowImageInput(false)}
              size="sm"
              className="text-gray-300 hover:text-white hover:bg-gray-700"
            >
              Annuleren
            </Button>
          </div>
        )}

        {showVideoInput && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-700">
            <Input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="YouTube of Vimeo URL"
              className="bg-gray-900 border-gray-700 text-white"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addVideo();
                }
              }}
            />
            <Button type="button" onClick={addVideo} size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
              Toevoegen
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowVideoInput(false)}
              size="sm"
              className="text-gray-300 hover:text-white hover:bg-gray-700"
            >
              Annuleren
            </Button>
          </div>
        )}
      </Card>

      {/* Editor Content with Drag & Drop */}
      <div {...getRootProps()} className="relative">
        <input {...getInputProps()} />
        <Card className="border-gray-700 bg-gray-900 overflow-hidden">
          {isDragActive && (
            <div className="absolute inset-0 bg-orange-500/20 border-2 border-dashed border-orange-500 z-10 flex items-center justify-center">
              <div className="text-center">
                <Upload className="w-12 h-12 text-orange-500 mx-auto mb-2" />
                <p className="text-white font-semibold">Sleep afbeelding hier</p>
              </div>
            </div>
          )}
          <EditorContent editor={editor} className="prose-editor" />
        </Card>
      </div>

      {/* Stats Bar */}
      <div className="flex justify-between items-center text-sm text-gray-400 px-2">
        <span>{editor.storage.characterCount.words()} woorden</span>
        <span>{editor.storage.characterCount.characters()} karakters</span>
        <span>Leestijd: ~{Math.ceil(editor.storage.characterCount.words() / 200)} min</span>
      </div>
    </div>
  );
}
