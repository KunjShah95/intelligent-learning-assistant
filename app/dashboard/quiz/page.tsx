'use client';

import { useState, useEffect } from 'react';
import { QuizCard } from '@/components/quiz/quiz-card';
import { XpNotification } from '@/components/gamification/xp-display';
import { useStats } from '@/hooks/use-stats';
import type { QuizQuestion } from '@/lib/types';

const sampleQuestion: QuizQuestion = {
  id: '1',
  concept: 'algebra',
  question: 'Solve for x: 2x + 5 = 13',
  options: ['x = 4', 'x = 5', 'x = 6', 'x = 7'],
  correctAnswer: 'x = 4',
  difficulty: 'easy',
  explanation: '2x + 5 = 13, subtract 5 from both sides: 2x = 8, divide by 2: x = 4',
};

export default function QuizPage() {
  const [currentQuestion] = useState(sampleQuestion);
  const [result, setResult] = useState<{ correct: boolean; explanation: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [xpNotification, setXpNotification] = useState<{ xpEarned: number; isNewLevel?: boolean; level?: number } | null>(null);
  const { awardXp, refreshStats } = useStats();

  useEffect(() => {
    if (result?.correct) {
      refreshStats();
    }
  }, [refreshStats, result]);

  const handleAnswer = async (answer: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/learning/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conceptId: currentQuestion.concept,
          answer,
          difficulty: currentQuestion.difficulty,
        }),
      });
      const data = await response.json();
      setResult(data);

      if (data.correct) {
        const xpResult = await awardXp('quiz_correct', { concept: currentQuestion.concept });
        if (xpResult.success) {
          setXpNotification({
            xpEarned: xpResult.xpAwarded || 10,
            isNewLevel: xpResult.newLevel !== undefined,
            level: xpResult.newLevel,
          });
        }
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Practice time</h1>
        <p className="text-gray-600">Test what you&apos;ve learned so far</p>
      </div>

      <XpNotification
        xpEarned={xpNotification?.xpEarned || 0}
        isNewLevel={xpNotification?.isNewLevel}
        level={xpNotification?.level}
      />

      <QuizCard
        question={currentQuestion}
        onAnswer={handleAnswer}
        isLoading={isLoading}
      />

      {result && (
        <div
          className={`p-6 rounded-xl ${
            result.correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}
        >
          <h3 className={`font-semibold ${result.correct ? 'text-green-700' : 'text-red-700'}`}>
            {result.correct ? 'Correct! Nice work 🎉' : 'Not quite right'}
          </h3>
          <p className="mt-2 text-gray-700">{result.explanation}</p>
          {result.correct && (
            <p className="mt-2 text-sm text-amber-600">+10 XP earned!</p>
          )}
        </div>
      )}
    </div>
  );
}
