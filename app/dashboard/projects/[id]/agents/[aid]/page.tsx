'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Send, Settings, ArrowLeft, Bot, Menu, FileText, X } from 'lucide-react';
import { MessageBubble } from '@/components/chat/message-bubble';
import { ChatHistorySidebar } from '@/components/chat/chat-history-sidebar';
import { FileSelector } from '@/components/chat/file-selector';
import { onAuthChange, getIdToken } from '@/lib/auth-client';

export default function AgentChatPage() {
  const params = useParams();
  const router = useRouter();
  const [agent, setAgent] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarRefreshKey, setSidebarRefreshKey] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<{ id: string; fileName: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const projectId = params.id as string;
  const agentId = params.aid as string;

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (!user) { router.push('/sign-in'); return; }
      try {
        const token = await getIdToken();
        if (!token) return;
        const res = await fetch(`/api/projects/${projectId}/agents/${agentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAgent(data.agent);
        }
      } catch (err) {
        console.error('Failed to load agent:', err);
      }
    });
    return () => unsubscribe();
  }, [projectId, agentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectChat = useCallback((newChatId: string, chatMessages: any[]) => {
    setChatId(newChatId);
    setMessages(chatMessages);
    setError(null);
  }, []);

  const handleNewChat = useCallback(() => {
    setChatId(null);
    setMessages([]);
    setError(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = { id: crypto.randomUUID(), role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    const messageText = input;
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const token = await getIdToken();
      if (!token) throw new Error('Not authenticated');
      const res = await fetch(`/api/projects/${projectId}/agents/${agentId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: messageText,
          chatId,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          selectedFileIds: selectedFiles.map(f => f.id),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `Request failed (${res.status})`);
      }

      const newChatId = res.headers.get('X-Chat-Id');
      if (newChatId) {
        const isNewChat = chatId === null;
        setChatId(newChatId);
        if (isNewChat) setSidebarRefreshKey(k => k + 1);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let fullContent = '';
      const assistantMsg = { id: crypto.randomUUID(), role: 'assistant', content: '', timestamp: new Date() };
      setMessages(prev => [...prev, assistantMsg]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === 'assistant') last.content = fullContent;
          return updated;
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const getMessageCount = (msgs: any[]) => msgs.filter(m => m.role === 'user').length;

  if (!agent) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <div className="text-center text-gray-500">
          <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4" />
          <p>Loading agent...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] -m-6 sm:-m-8">
      {/* Chat History Sidebar */}
      <ChatHistorySidebar
        projectId={projectId}
        agentId={agentId}
        activeChatId={chatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        collapsed={!sidebarOpen}
        onToggleCollapse={() => setSidebarOpen(!sidebarOpen)}
        refreshKey={sidebarRefreshKey}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-gray-600 transition lg:hidden"
              title="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link
              href={`/dashboard/projects/${projectId}`}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 transition shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2 min-w-0">
              <Bot className="w-5 h-5 text-emerald-600 shrink-0" />
              <h1 className="text-lg font-bold text-gray-900 truncate">{agent.name}</h1>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full hidden sm:inline">{agent.modelName}</span>
              {chatId && getMessageCount(messages) > 0 && (
                <span className="text-xs text-gray-400 hidden md:inline">
                  {getMessageCount(messages)} messages
                </span>
              )}
            </div>
          </div>
          <Link
            href={`/dashboard/projects/${projectId}/agents/${agentId}/settings`}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition shrink-0"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </Link>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 py-12">
              <Bot className="w-16 h-16 text-gray-200 mb-4" />
              <p className="text-xl font-medium text-gray-700 mb-2">
                {chatId ? 'Continue this chat' : `Start chatting with ${agent.name}`}
              </p>
              <p className="text-sm text-gray-400 max-w-md">
                {agent.systemPrompt
                  ? `System: "${agent.systemPrompt.slice(0, 120)}${agent.systemPrompt.length > 120 ? '...' : ''}"`
                  : 'No system prompt set — the agent will behave as a general assistant.'}
              </p>
              {!chatId && (
                <p className="text-xs text-gray-400 mt-4 flex items-center gap-1">
                  <Menu className="w-3 h-3" /> Open the sidebar to browse previous chats
                </p>
              )}
            </div>
          )}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          {error && (
            <div className="text-center text-red-500 py-2 bg-red-50 rounded-lg">
              <p className="text-sm">{error}</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="border-t border-gray-200 bg-white shrink-0">
          {/* Selected files badges */}
          {selectedFiles.length > 0 && (
            <div className="px-4 pt-3 pb-1 flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-gray-400 mr-1">Files:</span>
              {selectedFiles.map(file => (
                <span
                  key={file.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-violet-50 text-violet-700 rounded-full"
                >
                  <FileText className="w-3 h-3" />
                  <span className="truncate max-w-[120px]">{file.fileName}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedFiles(prev => prev.filter(f => f.id !== file.id))}
                    className="hover:text-violet-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="p-4">
            <div className="flex gap-2 max-w-4xl mx-auto">
              <FileSelector
                projectId={projectId}
                selectedFiles={selectedFiles}
                onSelectionChange={setSelectedFiles}
              />
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${agent.name}...`}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="px-5 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
