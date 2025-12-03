/**
 * Agent Message Component
 * Displays user and agent messages in the terminal
 */

'use client';

import { User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

export interface AgentMessageProps {
  role: 'user' | 'assistant';
  content: string;
  className?: string;
}

export function AgentMessage({ role, content, className }: AgentMessageProps) {
  const isUser = role === 'user';

  return (
    <div
      className={cn(
        'flex gap-3 p-4 rounded-lg',
        isUser ? 'bg-zinc-800/50' : 'bg-zinc-900/50',
        className
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser
            ? 'bg-blue-600'
            : 'bg-gradient-to-br from-purple-600 to-blue-600'
        )}
      >
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-zinc-400 mb-1">
          {isUser ? 'You' : 'AI Agent'}
        </div>
        <div className="text-sm text-zinc-200 prose prose-invert prose-sm max-w-none">
          {isUser ? (
            <p>{content}</p>
          ) : (
            <ReactMarkdown
              components={{
                // Style code blocks
                code: ({ node, inline, className, children, ...props }: any) => {
                  return inline ? (
                    <code
                      className="px-1.5 py-0.5 rounded bg-zinc-800 text-blue-400 font-mono text-xs"
                      {...props}
                    >
                      {children}
                    </code>
                  ) : (
                    <code
                      className="block px-4 py-3 rounded-lg bg-zinc-800 text-zinc-200 font-mono text-xs overflow-x-auto"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                // Style links
                a: ({ node, children, ...props }: any) => (
                  <a
                    className="text-blue-400 hover:text-blue-300 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                    {...props}
                  >
                    {children}
                  </a>
                ),
                // Style lists
                ul: ({ node, children, ...props }: any) => (
                  <ul className="list-disc list-inside space-y-1" {...props}>
                    {children}
                  </ul>
                ),
                ol: ({ node, children, ...props }: any) => (
                  <ol className="list-decimal list-inside space-y-1" {...props}>
                    {children}
                  </ol>
                ),
                // Style headings
                h1: ({ node, children, ...props }: any) => (
                  <h1 className="text-lg font-bold mt-4 mb-2" {...props}>
                    {children}
                  </h1>
                ),
                h2: ({ node, children, ...props }: any) => (
                  <h2 className="text-base font-bold mt-3 mb-2" {...props}>
                    {children}
                  </h2>
                ),
                h3: ({ node, children, ...props }: any) => (
                  <h3 className="text-sm font-bold mt-2 mb-1" {...props}>
                    {children}
                  </h3>
                ),
                // Style paragraphs
                p: ({ node, children, ...props }: any) => (
                  <p className="mb-2 last:mb-0" {...props}>
                    {children}
                  </p>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
}
