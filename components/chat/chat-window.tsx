'use client';

import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { MessageBubble } from './message-bubble';
import { ModelSelector, ModelSelectorMobile } from './model-selector';
import { useChat } from '@/hooks/use-chat';
import { useApiKeys } from '@/hooks/use-api-keys';
import { cn } from '@/lib/utils';
import type { ExplanationLevel } from '@/lib/types';
import type { ModelProvider } from '@/lib/ai';

const LEVEL_INFO: Record<ExplanationLevel, { label: string; icon: string; description: string }> = {
  simple: { label: 'Simple', icon: '🌱', description: 'For beginners' },
  detailed: { label: 'Detailed', icon: '📚', description: 'In-depth explanation' },
  analogy: { label: 'Analogy', icon: '🔗', description: 'Real-world examples' },
  'step-by-step': { label: 'Steps', icon: '📋', description: 'Process breakdown' },
};

export function ChatWindow() {
  const { messages, isLoading, error, askTutor, setExplanationLevel } = useChat();
  const { apiKeys } = useApiKeys();
  const [input, setInput] = useState('');
  const [explanationLevel, setLocalExplanationLevel] = useState<ExplanationLevel>('detailed');
  const [selectedModel, setSelectedModel] = useState<ModelProvider>('gemini-1.5-flash');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (apiKeys.defaultModel) {
      setSelectedModel(apiKeys.defaultModel as ModelProvider);
    }
  }, [apiKeys.defaultModel]);

  const handleLevelChange = (level: ExplanationLevel) => {
    setLocalExplanationLevel(level);
    setExplanationLevel(level);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const question = input;
    setInput('');
    await askTutor(question, explanationLevel, selectedModel);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-white rounded-xl shadow-sm">
      <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600 mr-2">Explain like:</span>
          {(Object.keys(LEVEL_INFO) as ExplanationLevel[]).map((level) => (
            <button
              key={level}
              onClick={() => handleLevelChange(level)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                explanationLevel === level
                  ? 'bg-violet-100 text-violet-700 border border-violet-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
              )}
            >
              <span className="mr-1">{LEVEL_INFO[level].icon}</span>
              {LEVEL_INFO[level].label}
            </button>
          ))}
        </div>
        <div className="hidden md:block">
          <ModelSelector currentModel={selectedModel} onModelChange={setSelectedModel} />
        </div>
        <div className="md:hidden">
          <ModelSelectorMobile currentModel={selectedModel} onModelChange={setSelectedModel} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <p className="text-lg mb-2">👋 Welcome to AI Tutor</p>
            <p className="text-sm">Ask me anything or pick an explanation style above!</p>
          </div>
        )}
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2">
              <p className="text-gray-400">Thinking...</p>
            </div>
          </div>
        )}
        {error && (
          <div className="text-center text-red-500 py-2">
            <p>{error}</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
