import { create } from 'zustand';
import type { ChatMessage, ExplanationLevel } from '@/lib/types';

interface ChatState {
  messages: ChatMessage[];
  explanationLevel: ExplanationLevel;
  isLoading: boolean;
  addMessage: (message: ChatMessage) => void;
  setLoading: (loading: boolean) => void;
  setExplanationLevel: (level: ExplanationLevel) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  explanationLevel: 'detailed',
  isLoading: false,
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setLoading: (isLoading) => set({ isLoading }),
  setExplanationLevel: (explanationLevel) => set({ explanationLevel }),
  clearMessages: () => set({ messages: [] }),
}));