'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EnhancedChatMessageProps {
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp?: Date;
}

export function EnhancedChatMessage({ content, role, timestamp }: EnhancedChatMessageProps) {
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);

  const copyCode = (code: string, language: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(language);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (role === 'user') {
    return (
      <div className="flex justify-end mb-4">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl px-4 py-3 max-w-[80%] shadow-md">
          <p className="text-sm whitespace-pre-wrap">{content}</p>
          {timestamp && (
            <p className="text-xs opacity-70 mt-1">{timestamp.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 max-w-[85%] shadow-md border border-gray-200 dark:border-gray-700">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                const language = match ? match[1] : '';
                const codeString = String(children).replace(/\n$/, '');
                const inline = !className;

                if (!inline && language) {
                  return (
                    <div className="relative group my-4">
                      <div className="flex items-center justify-between bg-gray-800 text-gray-300 px-4 py-2 rounded-t-lg text-xs font-mono">
                        <span className="text-gray-400">{language}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-gray-400 hover:text-white"
                          onClick={() => copyCode(codeString, language)}
                        >
                          {copiedCode === language ? (
                            <>
                              <Check className="h-3 w-3 mr-1" />
                              Gekopieerd!
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3 mr-1" />
                              Kopieer
                            </>
                          )}
                        </Button>
                      </div>
                      <pre className="!mt-0 !rounded-t-none bg-gray-900 text-gray-100 p-4 rounded-b-lg overflow-x-auto">
                        <code className={`language-${language}`}>{codeString}</code>
                      </pre>
                    </div>
                  );
                }

                return (
                  <code className="bg-gray-100 dark:bg-gray-700 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                    {children}
                  </code>
                );
              },
              a({ children, href }) {
                return (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 hover:text-orange-700 underline"
                  >
                    {children}
                  </a>
                );
              },
              img({ src, alt }) {
                return (
                  <div className="my-4 rounded-lg overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700">
                    <img
                      src={src}
                      alt={alt || 'AI Generated Image'}
                      className="w-full h-auto max-w-full"
                      loading="lazy"
                    />
                  </div>
                );
              },
              table({ children }) {
                return (
                  <div className="overflow-x-auto my-4">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      {children}
                    </table>
                  </div>
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
        {timestamp && (
          <p className="text-xs text-gray-500 mt-2">{timestamp.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}</p>
        )}
      </div>
    </div>
  );
}
