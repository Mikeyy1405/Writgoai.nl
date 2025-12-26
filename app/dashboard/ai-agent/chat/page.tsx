'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Message {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  action_required?: boolean;
  action_type?: string;
  action_data?: any;
  created_at: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Load chat history
  useEffect(() => {
    loadMessages();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    try {
      const res = await fetch('/api/agent/chat');
      const data = await res.json();

      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await res.json();

      if (data.userMessage && data.agentMessage) {
        setMessages((prev) => [...prev, data.userMessage, data.agentMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const confirmAction = async (message: Message) => {
    if (!message.action_data) return;

    setLoading(true);

    try {
      // Create task from proposal
      const res = await fetch('/api/agent/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: message.action_data.title,
          description: message.action_data.description,
          prompt: JSON.stringify(message.action_data),
          template_id: message.action_data.template_id,
        }),
      });

      const data = await res.json();

      if (data.task) {
        // Add system message
        const systemMessage: Message = {
          id: Date.now().toString(),
          role: 'system',
          content: `✅ Task created! [View task](/dashboard/ai-agent/tasks/${data.task.id})`,
          created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, systemMessage]);

        // Optionally redirect to task page
        // router.push(`/dashboard/ai-agent/tasks/${data.task.id}`);
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading chat...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">🤖 AI Agent Chat</h1>
            <p className="text-sm text-gray-600">
              Tell me what you want me to do
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/dashboard/ai-agent/templates')}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              📚 Templates
            </button>
            <button
              onClick={() => router.push('/dashboard/ai-agent/tasks')}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              📋 Tasks
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🤖</div>
              <h2 className="text-2xl font-bold mb-2">Welcome to your AI Agent!</h2>
              <p className="text-gray-600 mb-6">
                I can help you automate tasks, research, and more. What would you like me to do?
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                <button
                  onClick={() => setInput('Check the top 10 search queries from Google Search Console for my site')}
                  className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-white transition-all"
                >
                  <div className="font-medium mb-1">📊 GSC Report</div>
                  <div className="text-sm text-gray-600">
                    Get latest Search Console data
                  </div>
                </button>
                <button
                  onClick={() => setInput('Monitor iPhone 15 prices on bol.com and alert me if below €700')}
                  className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-white transition-all"
                >
                  <div className="font-medium mb-1">💎 Price Monitor</div>
                  <div className="text-sm text-gray-600">
                    Track product prices automatically
                  </div>
                </button>
                <button
                  onClick={() => setInput('Find new blog posts from my competitors and summarize them')}
                  className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-white transition-all"
                >
                  <div className="font-medium mb-1">🎯 Competitor Monitor</div>
                  <div className="text-sm text-gray-600">
                    Track competitor content
                  </div>
                </button>
                <button
                  onClick={() => setInput('Publish all my draft articles to WordPress')}
                  className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-white transition-all"
                >
                  <div className="font-medium mb-1">📝 WordPress Publish</div>
                  <div className="text-sm text-gray-600">
                    Bulk publish your content
                  </div>
                </button>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-3xl rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : message.role === 'system'
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  {message.role === 'agent' && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-lg">🤖</div>
                      <div className="font-medium text-sm text-gray-600">AI Agent</div>
                    </div>
                  )}

                  <div className="whitespace-pre-wrap">{message.content}</div>

                  {message.action_required && message.action_type === 'task_proposal' && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="bg-blue-50 rounded-lg p-4 mb-3">
                        <div className="font-medium mb-2">📋 {message.action_data.title}</div>
                        <div className="text-sm text-gray-600 mb-3">
                          {message.action_data.description}
                        </div>

                        {message.action_data.steps && message.action_data.steps.length > 0 && (
                          <div className="mb-3">
                            <div className="text-sm font-medium mb-1">Steps:</div>
                            <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
                              {message.action_data.steps.map((step: string, i: number) => (
                                <li key={i}>{step}</li>
                              ))}
                            </ol>
                          </div>
                        )}

                        {message.action_data.estimated_duration && (
                          <div className="text-sm text-gray-600">
                            ⏱️ Estimated: {message.action_data.estimated_duration}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => confirmAction(message)}
                          disabled={loading}
                          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ✅ Yes, do it!
                        </button>
                        <button
                          disabled={loading}
                          className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                        >
                          ❌ Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="text-xs mt-2 opacity-70">
                    {new Date(message.created_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="text-lg">🤖</div>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <form onSubmit={sendMessage} className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message... (e.g., 'Check bol.com prices for iPhone 15')"
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Sending...' : 'Send'}
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            💡 Tip: Be specific about what you want the agent to do. Example: "Monitor bol.com iPhone prices daily"
          </div>
        </form>
      </div>
    </div>
  );
}
