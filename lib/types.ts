export type ExplanationLevel = 'simple' | 'detailed' | 'analogy' | 'step-by-step';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  concept?: string;
  explanationLevel?: 'simple' | 'detailed' | 'analogy' | 'step-by-step';
}

export interface QuizQuestion {
  id: string;
  concept: string;
  question: string;
  options?: string[];
  correctAnswer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation: string;
}

export interface UserProgress {
  totalSessions: number;
  currentStreak: number;
  conceptsMastered: number;
  weakAreas: string[];
  masteryMap: Array<{
    concept: string;
    level: number;
  }>;
  stats?: UserStats;
  achievements?: Achievement[];
}

export interface TutorRequest {
  question: string;
  subject?: string;
  concept?: string;
  context?: string;
  explanationLevel?: 'simple' | 'detailed' | 'analogy' | 'step-by-step';
  modelProvider?: string;
  apiKeys?: {
    openai?: string;
    google?: string;
    groq?: string;
    mistral?: string;
    openrouter?: string;
  };
}

export interface TutorResponse {
  answer: string;
  explanationLevel: 'simple' | 'detailed' | 'analogy' | 'step-by-step';
  followUp?: string;
  concept?: string;
}

export interface AssessRequest {
  conceptId: string;
  answer: string;
  difficulty: string;
  questionId?: string;
}

export interface AssessResponse {
  correct: boolean;
  explanation: string;
  nextDifficulty: 'easy' | 'medium' | 'hard';
  masteryChange: number;
  correctAnswer: string;
}

export interface UserStats {
  xp: number;
  level: number;
  totalXpEarned: number;
  currentStreakDays: number;
  longestStreakDays: number;
  lastActivityDate: string | null;
  questionsAnswered: number;
  correctAnswers: number;
  conceptsMastered: number;
  totalSessionTime: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  xpReward: number;
  earnedAt: string;
}

export interface XpEvent {
  id: string;
  eventType: 'quiz_correct' | 'quiz_streak' | 'session_complete' | 'concept_mastered' | 'daily_login' | 'achievement';
  xpAmount: number;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Agent {
  id: string;
  projectId: string;
  name: string;
  description: string;
  systemPrompt: string;
  modelProvider: string;
  modelName: string;
  temperature: number;
  maxTokens: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  openaiFileId?: string;
  storagePath: string;
  content?: string;
  uploadedAt: Date;
}
