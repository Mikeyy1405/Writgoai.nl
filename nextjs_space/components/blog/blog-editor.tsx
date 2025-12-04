'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface BlogEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export function BlogEditor({ content, onChange, placeholder }: BlogEditorProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[#FF9933] underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Start met typen...',
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
          'prose prose-sm sm:prose lg:prose-lg xl:prose-xl prose-invert max-w-none focus:outline-none min-h-[500px] p-4 text-gray-200',
      },
    },
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

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-900">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-gray-700 bg-gray-800">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-orange-500 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-orange-500 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive('underline') ? 'bg-orange-500 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}
        >
          <UnderlineIcon className="w-4 h-4" />
        </Button>

        <div className="w-px bg-gray-600 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={
            editor.isActive('heading', { level: 1 }) ? 'bg-orange-500 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'
          }
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
        >
          <Heading3 className="w-4 h-4" />
        </Button>

        <div className="w-px bg-gray-600 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-orange-500 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-orange-500 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}
        >
          <ListOrdered className="w-4 h-4" />
        </Button>

        <div className="w-px bg-gray-600 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={
            editor.isActive({ textAlign: 'left' }) ? 'bg-orange-500 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'
          }
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
        >
          <AlignRight className="w-4 h-4" />
        </Button>

        <div className="w-px bg-gray-600 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'bg-orange-500 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}
        >
          <Quote className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={editor.isActive('codeBlock') ? 'bg-orange-500 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}
        >
          <Code className="w-4 h-4" />
        </Button>

        <div className="w-px bg-gray-600 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowLinkInput(!showLinkInput)}
          className="text-gray-300 hover:text-white hover:bg-gray-700"
        >
          <LinkIcon className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowImageInput(!showImageInput)}
          className="text-gray-300 hover:text-white hover:bg-gray-700"
        >
          <ImageIcon className="w-4 h-4" />
        </Button>
      </div>

      {/* Link Input */}
      {showLinkInput && (
        <div className="flex gap-2 p-3 bg-gray-800 border-b border-gray-700">
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

      {/* Image Input */}
      {showImageInput && (
        <div className="flex gap-2 p-3 bg-gray-800 border-b border-gray-700">
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

      {/* Editor Content */}
      <EditorContent editor={editor} className="bg-gray-900 text-white" />

      {/* Character Count */}
      <div className="flex justify-between items-center p-2 border-t border-gray-700 bg-gray-800 text-sm text-gray-400">
        <span>
          {editor.storage.characterCount.words()} woorden
        </span>
        <span>
          {editor.storage.characterCount.characters()} karakters
        </span>
      </div>
    </div>
  );
}
