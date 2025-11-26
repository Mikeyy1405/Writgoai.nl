
'use client';

import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import CharacterCount from '@tiptap/extension-character-count';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  Palette,
  Download,
  Eye,
  Code2,
  FileText,
  CheckSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const initialContent = `
<h1>Automatische Blog Generator - Instructies voor DeepAgent</h1>

<h2>Hoe te gebruiken (voor de gebruiker):</h2>
<ul>
  <li>Zeg gewoon: <strong>"Schrijf een nieuwe blog voor https://website.nl van 800 woorden"</strong></li>
  <li>OF met affiliate link: <strong>"Schrijf een nieuwe blog voor https://website.nl van 1000 woorden, Gebruik deze affiliate link: https://website.nl/actie"</strong></li>
</ul>

<h2>DeepAgent Workflow (volledig automatisch - geen vragen stellen!):</h2>

<h3>Stap 1: Scrape en analyseer de website</h3>
<ul>
  <li>Scrape de hele website (homepage + alle subpagina's)</li>
  <li>Begrijp wat voor bedrijf het is</li>
  <li>Maak een lijst van alle bestaande content/blogs</li>
  <li>Identificeer alle interne pagina's die bestaan (voor latere links)</li>
  <li>Bewaar de analyse</li>
</ul>

<h3>Stap 2: Kies automatisch een NIEUW onderwerp</h3>
<ul>
  <li>Analyseer de website en begrijp de kernactiviteiten</li>
  <li>Bedenk 5-7 relevante onderwerpen die waarde toevoegen voor hun doelgroep</li>
  <li>Check of elk onderwerp al op de site staat</li>
  <li>Kies het beste onderwerp dat NIET bestaat</li>
  <li>Gebruik web search voor actuele informatie en trends</li>
  <li>Denk aan lokale SEO, praktische vragen, kosten, vergelijkingen, tips, handleidingen</li>
</ul>

<h3>Stap 3: Verzamel 6-8 afbeeldingen</h3>
<ul>
  <li>Zoek <mark>ALLEEN</mark> op Pexels en Unsplash</li>
  <li>Kies relevante, hoogwaardige foto's</li>
  <li>Sla URLs + beschrijvingen op in JSON</li>
</ul>

<h3>Stap 4: Identificeer interne links</h3>
<ul>
  <li>Maak een lijst van 3-5 relevante pagina's van de website</li>
  <li>Dienstproducten, contact, over ons, andere blogs</li>
  <li>Noteer welke ankertekst je gaat gebruiken</li>
</ul>

<h3>Stap 5: Schrijf de blog</h3>

<p><strong>Format:</strong></p>

<pre><code>---
**SEO Title:** [50-60 tokens met zoekwoord]
**Meta Description:** [120-155 tokens met CTA]

# [h1 hoofdtitel]

[Intro 2-3 zinnen]

![alt-tekst](afbeelding-url)

## [h2 sectie 1]
[Content met praktische info]
[Interne link naar relevante pagina]

![alt-tekst](afbeelding-url)

## [h2 sectie 2]
[Content met tips]

## [h2 sectie 3]
[Content met voorbeelden]

![alt-tekst](afbeelding-url)

## [Afsluiting]
[Call-to-action met links]
</code></pre>

<p><strong>Schrijfregels:</strong></p>
<ul>
  <li>Nederlands, informeel (je/jij)</li>
  <li>Korte alinea's (max 3-4 zinnen)</li>
  <li>Praktische tips en voorbeelden</li>
  <li>3-5 interne links NATUURLIJK verwerkt</li>
  <li>Headings voor belangrijke woorden</li>
  <li>Headings: alleen eerste letter hoofdletter</li>
  <li>Unieke tips (geen "klassieke" dingen)</li>
  <li>Lokale focus indien relevant</li>
</ul>

<h3>Stap 6: Lever op</h3>
<ul>
  <li>Sla blog op als /home/ubuntu/[onderwerp]_blog.md</li>
  <li>Maak samenvatting met:
    <ul>
      <li>Gekozen onderwerp en waarom</li>
      <li>Aantal woorden</li>
      <li>Aantal afbeeldingen</li>
      <li>Aantal interne links</li>
      <li>Bevestiging dat het een NIEUW onderwerp is</li>
    </ul>
  </li>
</ul>

<h2>Checklist (controleer alles automatisch):</h2>
<ul>
  <li>[] Website volledig gescraped</li>
  <li>[] Onderwerp is NIEUW (staat niet op site)</li>
  <li>[] 6-8 afbeeldingen van Pexels/Unsplash</li>
  <li>[] Alle afbeeldingen hebben alt-tekst</li>
  <li>[] 3-5 interne links natuurlijk verwerkt</li>
  <li>[] Affiliate link toegevoegd (indien opgegeven)</li>
  <li>[] SEO metadata compleet</li>
  <li>[] Headings zijn uniek</li>
  <li>[] Woordenaantal correct (±50 woorden)</li>
  <li>[] Toon correct praktische waarde</li>
  <li>[] Geen "in deze blog..." zinnen</li>
  <li>[] Nederlandse taal, informele tone</li>
</ul>

<h2>Belangrijk:</h2>
<p><mark style="background-color: #d4edda; color: #155724;">✅ DOE: Website scrapen, nieuw onderwerp kiezen, interne links plaatsen, Pexels/Unsplash afbeeldingen</mark></p>
<p><mark style="background-color: #f8d7da; color: #721c24;">❌ DOE NIET: Bestaande onderwerpen, vragen stellen, andere afbeelding bronnen, lange paragrafen</mark></p>

<p><strong>DeepAgent werkt volledig automatisch - geen input nodig! 🚀</strong></p>
`;

export function SOPCanvas() {
  const [showPreview, setShowPreview] = useState(false);
  const [activeColor, setActiveColor] = useState('#000000');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[#FF9933] hover:underline cursor-pointer',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TextStyle,
      Color,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      CharacterCount,
      Placeholder.configure({
        placeholder: 'Begin met typen...',
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none focus:outline-none min-h-[600px] p-6',
      },
    },
  });

  if (!editor) {
    return null;
  }

  const addLink = () => {
    const url = window.prompt('Voer URL in:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    const url = window.prompt('Voer afbeelding URL in:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const downloadAsMarkdown = () => {
    const html = editor.getHTML();
    const markdown = htmlToMarkdown(html);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sop-bloggenerator.md';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('SOP gedownload als Markdown');
  };

  const downloadAsHTML = () => {
    const html = editor.getHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sop-bloggenerator.html';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('SOP gedownload als HTML');
  };

  const getWordCount = () => {
    return editor.storage.characterCount.words();
  };

  const getCharCount = () => {
    return editor.storage.characterCount.characters();
  };

  // Simple HTML to Markdown converter
  const htmlToMarkdown = (html: string): string => {
    return html
      .replace(/<h1>(.*?)<\/h1>/g, '# $1\n\n')
      .replace(/<h2>(.*?)<\/h2>/g, '## $1\n\n')
      .replace(/<h3>(.*?)<\/h3>/g, '### $1\n\n')
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
      .replace(/<em>(.*?)<\/em>/g, '*$1*')
      .replace(/<u>(.*?)<\/u>/g, '__$1__')
      .replace(/<mark.*?>(.*?)<\/mark>/g, '==$1==')
      .replace(/<code>(.*?)<\/code>/g, '`$1`')
      .replace(/<pre><code>(.*?)<\/code><\/pre>/gs, '```\n$1\n```\n\n')
      .replace(/<ul>/g, '')
      .replace(/<\/ul>/g, '\n')
      .replace(/<li>(.*?)<\/li>/g, '- $1\n')
      .replace(/<a href="(.*?)".*?>(.*?)<\/a>/g, '[$2]($1)')
      .replace(/<img.*?src="(.*?)".*?alt="(.*?)".*?>/g, '![$2]($1)')
      .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
      .replace(/<br\s*\/?>/g, '\n');
  };

  return (
    <div className="h-full flex flex-col bg-black">
      {/* Toolbar */}
      <Card className="border-b border-white/10 bg-black/50 backdrop-blur-xl rounded-none">
        <div className="p-2 space-y-2">
          {/* Main Formatting Tools */}
          <div className="flex flex-wrap gap-1">
            <Button
              size="sm"
              variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
              onClick={() => editor.chain().focus().toggleBold().run()}
              className="h-8 w-8 p-0"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className="h-8 w-8 p-0"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={editor.isActive('underline') ? 'secondary' : 'ghost'}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className="h-8 w-8 p-0"
            >
              <UnderlineIcon className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={editor.isActive('strike') ? 'secondary' : 'ghost'}
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className="h-8 w-8 p-0"
            >
              <Strikethrough className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={editor.isActive('code') ? 'secondary' : 'ghost'}
              onClick={() => editor.chain().focus().toggleCode().run()}
              className="h-8 w-8 p-0"
            >
              <Code className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="mx-1 h-8" />

            {/* Headings */}
            <Button
              size="sm"
              variant={editor.isActive('heading', { level: 1 }) ? 'secondary' : 'ghost'}
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className="h-8 w-8 p-0"
            >
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className="h-8 w-8 p-0"
            >
              <Heading2 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={editor.isActive('heading', { level: 3 }) ? 'secondary' : 'ghost'}
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className="h-8 w-8 p-0"
            >
              <Heading3 className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="mx-1 h-8" />

            {/* Lists */}
            <Button
              size="sm"
              variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className="h-8 w-8 p-0"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={editor.isActive('blockquote') ? 'secondary' : 'ghost'}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className="h-8 w-8 p-0"
            >
              <Quote className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="mx-1 h-8" />

            {/* Alignment */}
            <Button
              size="sm"
              variant={editor.isActive({ textAlign: 'left' }) ? 'secondary' : 'ghost'}
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              className="h-8 w-8 p-0"
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={editor.isActive({ textAlign: 'center' }) ? 'secondary' : 'ghost'}
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              className="h-8 w-8 p-0"
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={editor.isActive({ textAlign: 'right' }) ? 'secondary' : 'ghost'}
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              className="h-8 w-8 p-0"
            >
              <AlignRight className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={editor.isActive({ textAlign: 'justify' }) ? 'secondary' : 'ghost'}
              onClick={() => editor.chain().focus().setTextAlign('justify').run()}
              className="h-8 w-8 p-0"
            >
              <AlignJustify className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="mx-1 h-8" />

            {/* Highlight & Color */}
            <Button
              size="sm"
              variant={editor.isActive('highlight') ? 'secondary' : 'ghost'}
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              className="h-8 w-8 p-0"
            >
              <Highlighter className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              <input
                type="color"
                value={activeColor}
                onChange={(e) => {
                  setActiveColor(e.target.value);
                  editor.chain().focus().setColor(e.target.value).run();
                }}
                className="h-8 w-8 rounded cursor-pointer bg-transparent"
                title="Tekstkleur"
              />
            </div>

            <Separator orientation="vertical" className="mx-1 h-8" />

            {/* Links & Images */}
            <Button
              size="sm"
              variant={editor.isActive('link') ? 'secondary' : 'ghost'}
              onClick={addLink}
              className="h-8 w-8 p-0"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={addImage}
              className="h-8 w-8 p-0"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="mx-1 h-8" />

            {/* Undo/Redo */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="h-8 w-8 p-0"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="h-8 w-8 p-0"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={showPreview ? 'secondary' : 'outline'}
                onClick={() => setShowPreview(!showPreview)}
                className="h-8"
              >
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                {showPreview ? 'Editor' : 'Preview'}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {getWordCount()} woorden • {getCharCount()} tekens
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={downloadAsMarkdown}
                className="h-8"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Markdown
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={downloadAsHTML}
                className="h-8"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                HTML
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Editor Area */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-6">
          {showPreview ? (
            <Card className="p-6 bg-white dark:bg-zinc-900">
              <div 
                className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
              />
            </Card>
          ) : (
            <Card className="bg-white dark:bg-zinc-900 overflow-hidden">
              <EditorContent editor={editor} />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
