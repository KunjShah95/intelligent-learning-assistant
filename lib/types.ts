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
}

export interface AssessResponse {
  correct: boolean;
  explanation: string;
  nextDifficulty: 'easy' | 'medium' | 'hard';
  masteryChange: number;
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
