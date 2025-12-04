/**
 * Agent Terminal Component
 * Main terminal interface for the AI agent
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Terminal as TerminalIcon } from 'lucide-react';
import { AgentMessage } from './agent-message';
import { ToolExecution, ToolCall } from './tool-execution';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AgentTerminal() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentToolCalls, setCurrentToolCalls] = useState<ToolCall[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentToolCalls]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);
    setCurrentToolCalls([]);

    // Add user message
    const newMessages: Message[] = [
      ...messages,
      { role: 'user', content: userMessage },
    ];
    setMessages(newMessages);

    try {
      // Convert to API format
      const apiMessages = newMessages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      // Call agent API with streaming
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Agent response failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let statusMessage = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === 'status') {
                  // Handle status updates
                  statusMessage = data.message || '';
                  // Optionally show status in UI (for now just log)
                  console.log('Status:', data.message);
                } else if (data.type === 'tool_start') {
                  // Tool execution started
                  const toolCall: ToolCall = {
                    id: `tool_${Date.now()}`,
                    name: data.tool,
                    parameters: {},
                    status: 'executing',
                  };
                  setCurrentToolCalls(prev => [...prev, toolCall]);
                  console.log('Tool started:', data.tool, data.message);
                } else if (data.type === 'tool_complete') {
                  // Tool execution completed
                  setCurrentToolCalls(prev => 
                    prev.map(tc => 
                      tc.name === data.tool
                        ? { ...tc, status: 'completed' as const, result: { success: true, message: data.message } }
                        : tc
                    )
                  );
                  console.log('Tool completed:', data.tool, data.message);
                } else if (data.type === 'complete') {
                  // Final assistant response
                  assistantContent = data.message || '';
                  setMessages([
                    ...newMessages,
                    { role: 'assistant', content: assistantContent },
                  ]);
                } else if (data.type === 'done') {
                  break;
                } else if (data.type === 'error') {
                  const errorMsg = data.details 
                    ? `${data.message}\n\nDetails: ${data.details}`
                    : data.message || 'Er is een onbekende fout opgetreden';
                  // Set error and break from loop
                  reader.cancel();
                  throw new Error(errorMsg);
                }
              } catch (parseError: any) {
                // Check if this is an error from the API (not a JSON parse error)
                if (parseError.message && !parseError.message.includes('JSON')) {
                  // Re-throw API errors
                  throw parseError;
                }
                console.error('Failed to parse SSE data:', line, parseError);
                // Continue processing other lines for JSON parse errors
              }
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Agent error:', error);
      
      // Show detailed error message
      const errorMessage = error.message || 'Er is een onbekende fout opgetreden';
      toast.error(errorMessage);
      
      // Add error message to chat
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: `❌ **Fout opgetreden**\n\n${errorMessage}\n\nProbeer het opnieuw of neem contact op met de beheerder als het probleem zich blijft voordoen.`,
        },
      ]);
    } finally {
      setIsLoading(false);
      setCurrentToolCalls([]);
    }
  };

  // Execute tool calls
  const executeTools = async (messages: any[], toolCalls: ToolCall[]) => {
    try {
      // Update tool call statuses to executing
      setCurrentToolCalls(
        toolCalls.map(tc => ({ ...tc, status: 'executing' as const }))
      );

      // Call API to execute tools
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          toolCalls,
        }),
      });

      if (!response.ok) {
        throw new Error('Tool execution failed');
      }

      const result = await response.json();

      // Update tool calls with results
      if (result.toolCalls) {
        setCurrentToolCalls(result.toolCalls);
      }

      // Add assistant response
      if (result.message) {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: result.message },
        ]);
      }
    } catch (error: any) {
      console.error('Tool execution error:', error);
      toast.error('Tool execution failed');
      setCurrentToolCalls(
        toolCalls.map(tc => ({
          ...tc,
          status: 'failed' as const,
          result: { success: false, error: error.message },
        }))
      );
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-zinc-800 bg-zinc-900/50 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600">
            <TerminalIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">AI Agent Terminal</h1>
            <p className="text-sm text-zinc-400">
              Chat met de AI agent om taken uit te voeren
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <TerminalIcon className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-zinc-300 mb-2">
                Welkom bij de AI Agent Terminal
              </h2>
              <p className="text-sm text-zinc-500 mb-6">
                Geef opdrachten aan de AI agent om taken uit te voeren zoals
                content genereren, klanten beheren, en meer.
              </p>
              <div className="text-left bg-zinc-900/50 rounded-lg p-4 space-y-2">
                <p className="text-xs font-medium text-zinc-400">
                  Voorbeelden:
                </p>
                <ul className="text-xs text-zinc-500 space-y-1">
                  <li>• "Genereer 5 blogs voor Bakkerij Jansen"</li>
                  <li>• "Zoek alle actieve klanten"</li>
                  <li>• "Maak een factuur voor klant X"</li>
                  <li>• "Toon beschikbare AI modellen"</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <AgentMessage
            key={index}
            role={message.role}
            content={message.content}
          />
        ))}

        {/* Tool Executions */}
        {currentToolCalls.length > 0 && (
          <div className="space-y-2">
            {currentToolCalls.map((toolCall) => (
              <ToolExecution key={toolCall.id} toolCall={toolCall} />
            ))}
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && currentToolCalls.length === 0 && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-zinc-900/50">
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            <span className="text-sm text-zinc-400">Agent denkt na...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-zinc-800 bg-zinc-900/50 p-4">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Typ je opdracht... (Cmd/Ctrl + Enter om te verzenden)"
            className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-500 resize-none min-h-[60px] max-h-[200px]"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="lg"
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </form>
        <p className="text-xs text-zinc-600 mt-2">
          Tip: Gebruik Cmd/Ctrl + Enter om snel te verzenden
        </p>
      </div>
    </div>
  );
}
