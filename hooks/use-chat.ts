import { useState } from 'react';
import { useChatStore } from '@/stores/chat-store';
import { useApiKeys } from '@/hooks/use-api-keys';
import { getModelProvider } from '@/lib/ai';
import type { TutorRequest, TutorResponse, ExplanationLevel } from '@/lib/types';
import type { ModelProvider } from '@/lib/ai';

export function useChat() {
  const { messages, explanationLevel, isLoading, addMessage, setLoading, setExplanationLevel, clearMessages } = useChatStore();
  const { apiKeys } = useApiKeys();
  const [error, setError] = useState<string | null>(null);

  const askTutor = async (question: string, level?: ExplanationLevel, modelProvider?: ModelProvider) => {
    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content: question,
      timestamp: new Date(),
    };
    addMessage(userMessage);
    setLoading(true);
    setError(null);

    try {
      const selectedModel = modelProvider || (apiKeys.defaultModel as ModelProvider) || 'gemini-1.5-flash';
      const selectedProvider = getModelProvider(selectedModel);

      const response = await fetch('/api/tutor/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question, 
          explanationLevel: level || explanationLevel,
          modelProvider: selectedModel,
          apiKeys: {
            [selectedProvider]: apiKeys[selectedProvider],
          },
        } as TutorRequest),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data: TutorResponse = await response.json();

      const assistantMessage = {
        id: crypto.randomUUID(),
        role: 'assistant' as const,
        content: data.answer,
        timestamp: new Date(),
        explanationLevel: data.explanationLevel,
        concept: data.concept,
      };
      addMessage(assistantMessage);

      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return { messages, isLoading, error, askTutor, setExplanationLevel, clearMessages };
}
