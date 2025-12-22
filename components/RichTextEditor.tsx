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
          class: 'rounded-lg max-w-full h-auto my-4',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-orange-400 hover:text-orange-300 underline',
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
        class: 'prose prose-invert prose-lg max-w-none focus:outline-none min-h-[400px] text-white',
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
      {/* Toolbar - Dark theme */}
      <div className="bg-gray-800 border border-gray-700 rounded-t-lg p-2 flex flex-wrap gap-1 sticky top-0 z-10">
        {/* Text formatting */}
        <div className="flex gap-1 border-r border-gray-600 pr-2 mr-2">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-gray-700 ${editor.isActive('bold') ? 'bg-orange-500/20 text-orange-400' : 'text-gray-300'}`}
            title="Vet"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-gray-700 ${editor.isActive('italic') ? 'bg-orange-500/20 text-orange-400' : 'text-gray-300'}`}
            title="Cursief"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 4h4m-2 0v16m-4 0h8" transform="skewX(-10)" />
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-2 rounded hover:bg-gray-700 ${editor.isActive('underline') ? 'bg-orange-500/20 text-orange-400' : 'text-gray-300'}`}
            title="Onderstrepen"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8v4a5 5 0 0010 0V8M5 20h14" />
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={`p-2 rounded hover:bg-gray-700 ${editor.isActive('highlight') ? 'bg-orange-500/20 text-orange-400' : 'text-gray-300'}`}
            title="Markeren"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15.243 4.515l-6.738 6.737-.707 2.121-1.04 1.041 2.828 2.829 1.04-1.041 2.122-.707 6.737-6.738-4.242-4.242zm6.364 3.536a1 1 0 010 1.414l-7.778 7.778-2.122.707-1.414 1.414a1 1 0 01-1.414 0l-4.243-4.243a1 1 0 010-1.414l1.414-1.414.707-2.121 7.778-7.778a1 1 0 011.414 0l5.657 5.657z"/>
            </svg>
          </button>
        </div>

        {/* Headings */}
        <div className="flex gap-1 border-r border-gray-600 pr-2 mr-2">
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-2 rounded hover:bg-gray-700 font-bold text-sm ${editor.isActive('heading', { level: 1 }) ? 'bg-orange-500/20 text-orange-400' : 'text-gray-300'}`}
            title="Heading 1"
          >
            H1
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 rounded hover:bg-gray-700 font-bold text-sm ${editor.isActive('heading', { level: 2 }) ? 'bg-orange-500/20 text-orange-400' : 'text-gray-300'}`}
            title="Heading 2"
          >
            H2
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-2 rounded hover:bg-gray-700 font-bold text-sm ${editor.isActive('heading', { level: 3 }) ? 'bg-orange-500/20 text-orange-400' : 'text-gray-300'}`}
            title="Heading 3"
          >
            H3
          </button>
        </div>

        {/* Lists */}
        <div className="flex gap-1 border-r border-gray-600 pr-2 mr-2">
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-gray-700 ${editor.isActive('bulletList') ? 'bg-orange-500/20 text-orange-400' : 'text-gray-300'}`}
            title="Opsomming"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded hover:bg-gray-700 ${editor.isActive('orderedList') ? 'bg-orange-500/20 text-orange-400' : 'text-gray-300'}`}
            title="Genummerde lijst"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20h14M7 12h14M7 4h14M3 20h.01M3 12h.01M3 4h.01" />
            </svg>
          </button>
        </div>

        {/* Alignment */}
        <div className="flex gap-1 border-r border-gray-600 pr-2 mr-2">
          <button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-2 rounded hover:bg-gray-700 ${editor.isActive({ textAlign: 'left' }) ? 'bg-orange-500/20 text-orange-400' : 'text-gray-300'}`}
            title="Links uitlijnen"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14" />
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-2 rounded hover:bg-gray-700 ${editor.isActive({ textAlign: 'center' }) ? 'bg-orange-500/20 text-orange-400' : 'text-gray-300'}`}
            title="Centreren"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M5 18h14" />
            </svg>
          </button>
        </div>

        {/* Quote & Code */}
        <div className="flex gap-1 border-r border-gray-600 pr-2 mr-2">
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-2 rounded hover:bg-gray-700 ${editor.isActive('blockquote') ? 'bg-orange-500/20 text-orange-400' : 'text-gray-300'}`}
            title="Citaat"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`p-2 rounded hover:bg-gray-700 ${editor.isActive('codeBlock') ? 'bg-orange-500/20 text-orange-400' : 'text-gray-300'}`}
            title="Code blok"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </button>
        </div>

        {/* Link & Image */}
        <div className="flex gap-1">
          <button
            onClick={setLink}
            className={`p-2 rounded hover:bg-gray-700 ${editor.isActive('link') ? 'bg-orange-500/20 text-orange-400' : 'text-gray-300'}`}
            title="Link toevoegen"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </button>
          <button
            onClick={() => {
              const url = prompt('Afbeelding URL:');
              if (url) addImage(url);
            }}
            className="p-2 rounded hover:bg-gray-700 text-gray-300"
            title="Afbeelding URL"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          {onGenerateImage && (
            <button
              onClick={() => setShowImageModal(true)}
              className="p-2 rounded hover:bg-gray-700 text-orange-400"
              title="AI Afbeelding genereren"
            >
              🤖
            </button>
          )}
        </div>

        {/* Undo/Redo */}
        <div className="flex gap-1 ml-auto">
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-2 rounded hover:bg-gray-700 text-gray-300 disabled:opacity-30"
            title="Ongedaan maken"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-2 rounded hover:bg-gray-700 text-gray-300 disabled:opacity-30"
            title="Opnieuw"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Editor Content - Dark theme */}
      <div className="bg-gray-900 border border-t-0 border-gray-700 rounded-b-lg p-6 min-h-[500px]">
        <EditorContent editor={editor} />
      </div>

      {/* AI Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">🤖 AI Afbeelding Genereren</h3>
            <p className="text-gray-400 text-sm mb-4">
              Beschrijf de afbeelding die je wilt genereren met Flux Pro
            </p>
            <textarea
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              placeholder="Bijv: Een professionele foto van een yoga mat op een houten vloer met ochtendlicht"
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-3 mb-4 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                {isGeneratingImage ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Genereren...
                  </>
                ) : (
                  'Genereer'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dark theme styles for editor content */}
      <style jsx global>{`
        .ProseMirror {
          color: #fff !important;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 1.125rem;
          line-height: 1.8;
        }
        .ProseMirror h1 {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 2rem;
          font-weight: 800;
          color: #fff !important;
          margin-bottom: 1rem;
        }
        .ProseMirror h2 {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: #f97316 !important;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #f97316;
        }
        .ProseMirror h3 {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 1.25rem;
          font-weight: 600;
          color: #d1d5db !important;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
        }
        .ProseMirror p {
          color: #e5e7eb !important;
          margin-bottom: 1rem;
        }
        .ProseMirror ul,
        .ProseMirror ol {
          color: #e5e7eb !important;
          padding-left: 1.5rem;
          margin: 1rem 0;
        }
        .ProseMirror li {
          color: #e5e7eb !important;
          margin-bottom: 0.5rem;
        }
        .ProseMirror strong {
          color: #fff !important;
          font-weight: 700;
        }
        .ProseMirror em {
          color: #d1d5db !important;
        }
        .ProseMirror a {
          color: #f97316 !important;
        }
        .ProseMirror blockquote {
          border-left: 4px solid #f97316;
          padding-left: 1rem;
          margin: 1rem 0;
          color: #9ca3af !important;
          background: rgba(249, 115, 22, 0.1);
          padding: 1rem;
          border-radius: 0 8px 8px 0;
        }
        .ProseMirror code {
          background: #374151;
          color: #f97316 !important;
          padding: 0.2rem 0.4rem;
          border-radius: 4px;
          font-family: monospace;
        }
        .ProseMirror pre {
          background: #1f2937;
          color: #e5e7eb !important;
          padding: 1rem;
          border-radius: 8px;
          overflow-x: auto;
        }
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1rem 0;
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
        }
      `}</style>
    </div>
  );
}
