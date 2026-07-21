'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, Plus, Trash2, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/utils';
import { getIdToken } from '@/lib/auth-client';

interface ChatSessionInfo {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount?: number;
}

interface ChatHistorySidebarProps {
  projectId: string;
  agentId: string;
  activeChatId: string | null;
  onSelectChat: (chatId: string, messages: any[]) => void;
  onNewChat: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  refreshKey?: number;
}

export function ChatHistorySidebar({
  projectId,
  agentId,
  activeChatId,
  onSelectChat,
  onNewChat,
  collapsed = false,
  onToggleCollapse,
  refreshKey = 0,
}: ChatHistorySidebarProps) {
  const [chats, setChats] = useState<ChatSessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingChatId, setLoadingChatId] = useState<string | null>(null);

  const authFetch = async (url: string, options: RequestInit = {}) => {
    const token = await getIdToken();
    if (!token) throw new Error('Not authenticated');
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  };

  const fetchChats = async () => {
    try {
      const res = await authFetch(`/api/projects/${projectId}/agents/${agentId}/chats`);
      if (res.ok) {
        const data = await res.json();
        setChats(data.chats || []);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [projectId, agentId, refreshKey]);

  const handleSelectChat = async (chatId: string) => {
    if (chatId === activeChatId) return;
    setLoadingChatId(chatId);
    try {
      const res = await authFetch(`/api/projects/${projectId}/agents/${agentId}/chats/${chatId}`);
      if (res.ok) {
        const data = await res.json();
        onSelectChat(chatId, data.chat.messages || []);
      }
    } catch (err) {
      console.error('Failed to load chat:', err);
    } finally {
      setLoadingChatId(null);
    }
  };

  const handleNewChat = async () => {
    try {
      const res = await authFetch(`/api/projects/${projectId}/agents/${agentId}/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Chat' }),
      });
      if (res.ok) {
        const data = await res.json();
        setChats(prev => [data.chat, ...prev]);
        onNewChat();
        onSelectChat(data.chat.id, []);
      }
    } catch (err) {
      console.error('Failed to create new chat:', err);
    }
  };

  const getChatPreview = (chat: ChatSessionInfo): string => {
    if (chat.title && chat.title !== 'New Chat') return chat.title;
    return `Chat from ${formatRelativeTime(chat.createdAt)}`;
  };

  return (
    <div
      className={cn(
        'bg-white border-r border-gray-200 flex flex-col transition-all duration-200',
        collapsed ? 'w-12' : 'w-64'
      )}
    >
      {/* Header */}
      <div className={cn('flex items-center border-b border-gray-200', collapsed ? 'justify-center p-2' : 'justify-between p-3')}>
        {!collapsed && (
          <h3 className="text-sm font-semibold text-gray-900">Chat History</h3>
        )}
        <button
          onClick={onToggleCollapse}
          className="text-gray-400 hover:text-gray-600 transition p-1 rounded hover:bg-gray-100"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* New chat button */}
      <div className={cn('p-2', collapsed && 'flex justify-center')}>
        <button
          onClick={handleNewChat}
          className={cn(
            'flex items-center gap-2 w-full px-3 py-2 text-sm font-medium rounded-lg transition',
            activeChatId === null
              ? 'bg-violet-100 text-violet-700 border border-violet-200'
              : 'text-gray-600 hover:bg-gray-50 border border-transparent hover:border-gray-200'
          )}
          title="New chat"
        >
          <Plus className="w-4 h-4 shrink-0" />
          {!collapsed && <span>New Chat</span>}
        </button>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className={cn('space-y-2 p-2', collapsed && 'flex flex-col items-center')}>
            {[1, 2, 3].map(i => (
              <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" style={{ width: collapsed ? '2rem' : '100%' }} />
            ))}
          </div>
        ) : chats.length === 0 ? (
          !collapsed && (
            <div className="text-center py-8 px-3">
              <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-500">No chats yet</p>
            </div>
          )
        ) : (
          <div className={cn('space-y-1 p-2', collapsed && 'flex flex-col items-center')}>
            {chats.map(chat => {
              const isActive = chat.id === activeChatId;
              const isLoading = loadingChatId === chat.id;
              return (
                <button
                  key={chat.id}
                  onClick={() => handleSelectChat(chat.id)}
                  disabled={isLoading}
                  className={cn(
                    'w-full text-left rounded-lg transition flex items-center',
                    collapsed
                      ? 'justify-center p-2'
                      : 'px-3 py-2.5 gap-2',
                    isActive
                      ? 'bg-violet-50 text-violet-700'
                      : 'text-gray-600 hover:bg-gray-50',
                    isLoading && 'opacity-50'
                  )}
                  title={getChatPreview(chat)}
                >
                  {collapsed ? (
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center',
                      isActive ? 'bg-violet-100' : 'bg-gray-100'
                    )}>
                      {isLoading ? (
                        <div className="w-3 h-3 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <MessageSquare className="w-4 h-4" />
                      )}
                    </div>
                  ) : (
                    <>
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin shrink-0" />
                      ) : (
                        <MessageSquare className="w-4 h-4 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm truncate">{getChatPreview(chat)}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          <Clock className="w-3 h-3 inline mr-0.5" />
                          {formatRelativeTime(chat.updatedAt)}
                        </p>
                      </div>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
