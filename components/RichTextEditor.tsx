'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import { useCallback, useState } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  onGenerateImage?: (prompt: string) => Promise<string | null>;
  placeholder?: string;
}

export default function RichTextEditor({ 
  content, 
  onChange, 
  onGenerateImage,
  placeholder = 'Begin met schrijven...' 
}: RichTextEditorProps) {
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto my-6',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-orange-500 hover:text-orange-400 underline',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[500px]',
      },
    },
  });

  const addImage = useCallback((url: string) => {
    if (editor && url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim() || !onGenerateImage) return;
    
    setIsGeneratingImage(true);
    try {
      const imageUrl = await onGenerateImage(imagePrompt);
      if (imageUrl) {
        addImage(imageUrl);
        setShowImageModal(false);
        setImagePrompt('');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Fout bij genereren van afbeelding');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const setLink = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return <div className="animate-pulse bg-gray-800 h-96 rounded-lg"></div>;
  }

  return (
    <div className="rich-text-editor">
      {/* Minimal Toolbar */}
      <div className="bg-gray-800/50 rounded-lg p-2 flex flex-wrap gap-1 mb-4 sticky top-0 z-10 backdrop-blur-sm">
        {/* Text formatting */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-gray-700 ${editor.isActive('bold') ? 'bg-gray-700 text-orange-400' : 'text-gray-400'}`}
          title="Vet (Ctrl+B)"
        >
          <strong>B</strong>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-gray-700 ${editor.isActive('italic') ? 'bg-gray-700 text-orange-400' : 'text-gray-400'}`}
          title="Cursief (Ctrl+I)"
        >
          <em>I</em>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 rounded hover:bg-gray-700 ${editor.isActive('underline') ? 'bg-gray-700 text-orange-400' : 'text-gray-400'}`}
          title="Onderstrepen (Ctrl+U)"
        >
          <span className="underline">U</span>
        </button>

        <div className="w-px bg-gray-700 mx-1"></div>

        {/* Headings */}
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-2 py-1 rounded hover:bg-gray-700 text-sm font-semibold ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-700 text-orange-400' : 'text-gray-400'}`}
          title="Heading 1"
        >
          H1
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2 py-1 rounded hover:bg-gray-700 text-sm font-semibold ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-700 text-orange-400' : 'text-gray-400'}`}
          title="Heading 2"
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-2 py-1 rounded hover:bg-gray-700 text-sm font-semibold ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-700 text-orange-400' : 'text-gray-400'}`}
          title="Heading 3"
        >
          H3
        </button>

        <div className="w-px bg-gray-700 mx-1"></div>

        {/* Lists */}
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-gray-700 ${editor.isActive('bulletList') ? 'bg-gray-700 text-orange-400' : 'text-gray-400'}`}
          title="Opsomming"
        >
          •
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-gray-700 ${editor.isActive('orderedList') ? 'bg-gray-700 text-orange-400' : 'text-gray-400'}`}
          title="Genummerde lijst"
        >
          1.
        </button>

        <div className="w-px bg-gray-700 mx-1"></div>

        {/* Link & Image */}
        <button
          onClick={setLink}
          className={`p-2 rounded hover:bg-gray-700 ${editor.isActive('link') ? 'bg-gray-700 text-orange-400' : 'text-gray-400'}`}
          title="Link"
        >
          🔗
        </button>
        <button
          onClick={() => {
            const url = prompt('Afbeelding URL:');
            if (url) addImage(url);
          }}
          className="p-2 rounded hover:bg-gray-700 text-gray-400"
          title="Afbeelding URL"
        >
          🖼️
        </button>
        {onGenerateImage && (
          <button
            onClick={() => setShowImageModal(true)}
            className="p-2 rounded hover:bg-gray-700 text-orange-400"
            title="AI Afbeelding"
          >
            🤖
          </button>
        )}

        <div className="flex-1"></div>

        {/* Undo/Redo */}
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-2 rounded hover:bg-gray-700 text-gray-400 disabled:opacity-30"
          title="Ongedaan maken"
        >
          ↩
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-2 rounded hover:bg-gray-700 text-gray-400 disabled:opacity-30"
          title="Opnieuw"
        >
          ↪
        </button>
      </div>

      {/* Editor Content - Clean Google Docs style */}
      <div className="bg-gray-900 rounded-lg p-8 min-h-[500px]">
        <EditorContent editor={editor} />
      </div>

      {/* AI Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">🤖 AI Afbeelding</h3>
            <textarea
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              placeholder="Beschrijf de afbeelding..."
              className="w-full bg-gray-900 text-white rounded-lg px-4 py-3 mb-4 focus:ring-2 focus:ring-orange-500 focus:outline-none"
              rows={3}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowImageModal(false);
                  setImagePrompt('');
                }}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
              >
                Annuleren
              </button>
              <button
                onClick={handleGenerateImage}
                disabled={isGeneratingImage || !imagePrompt.trim()}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2"
              >
                {isGeneratingImage ? 'Genereren...' : 'Genereer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clean Google Docs style - no borders, just good typography */}
      <style jsx global>{`
        .ProseMirror {
          color: #fff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          font-size: 16px;
          line-height: 1.75;
        }
        
        .ProseMirror h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #fff;
          margin-top: 0;
          margin-bottom: 1.5rem;
          line-height: 1.3;
        }
        
        .ProseMirror h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #fff;
          margin-top: 2.5rem;
          margin-bottom: 1rem;
          line-height: 1.3;
        }
        
        .ProseMirror h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #e5e7eb;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
          line-height: 1.4;
        }
        
        .ProseMirror p {
          color: #d1d5db;
          margin-bottom: 1.25rem;
        }
        
        .ProseMirror ul,
        .ProseMirror ol {
          color: #d1d5db;
          padding-left: 1.5rem;
          margin-bottom: 1.25rem;
        }
        
        .ProseMirror li {
          margin-bottom: 0.5rem;
        }
        
        .ProseMirror li p {
          margin-bottom: 0.25rem;
        }
        
        .ProseMirror strong {
          color: #fff;
          font-weight: 600;
        }
        
        .ProseMirror em {
          color: #e5e7eb;
          font-style: italic;
        }
        
        .ProseMirror a {
          color: #f97316;
          text-decoration: underline;
        }
        
        .ProseMirror a:hover {
          color: #fb923c;
        }
        
        .ProseMirror blockquote {
          margin: 1.5rem 0;
          padding-left: 1.5rem;
          border-left: 3px solid #4b5563;
          color: #9ca3af;
          font-style: italic;
        }
        
        .ProseMirror code {
          background: #374151;
          color: #f97316;
          padding: 0.2rem 0.4rem;
          border-radius: 4px;
          font-family: 'SF Mono', Monaco, monospace;
          font-size: 0.9em;
        }
        
        .ProseMirror pre {
          background: #1f2937;
          color: #e5e7eb;
          padding: 1rem;
          border-radius: 8px;
          overflow-x: auto;
          margin: 1.5rem 0;
        }
        
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1.5rem 0;
        }
        
        .ProseMirror p.is-editor-empty:first-child::before {
          color: #6b7280;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        
        .ProseMirror mark {
          background-color: rgba(249, 115, 22, 0.3);
          color: #fff;
          padding: 0.1rem 0.2rem;
          border-radius: 2px;
        }
        
        .ProseMirror hr {
          border: none;
          border-top: 1px solid #374151;
          margin: 2rem 0;
        }
      `}</style>
    </div>
  );
}
