'use client';

import { useState } from 'react';
import { QuizCard } from '@/components/quiz/quiz-card';
import { XpNotification } from '@/components/gamification/xp-display';
import { useStats } from '@/hooks/use-stats';
import { getIdToken } from '@/lib/auth-client';
import { quizQuestions } from '@/lib/quiz-questions';

export default function QuizPage() {
  const [index, setIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [result, setResult] = useState<{ correct: boolean; explanation: string; correctAnswer: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [score, setScore] = useState(0);
  const [xpNotification, setXpNotification] = useState<{ xpEarned: number; isNewLevel?: boolean; level?: number } | null>(null);
  const { awardXp, refreshStats } = useStats();

  const currentQuestion = quizQuestions[index];
  const isLast = index >= quizQuestions.length - 1;
  const finished = !currentQuestion;

  const handleAnswer = async (answer: string) => {
    if (isLoading || result) return; // guard double submit
    setSelectedAnswer(answer);
    setIsLoading(true);
    try {
      const token = await getIdToken();
      if (!token) throw new Error('Not authenticated');
      const response = await fetch('/api/learning/assess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          conceptId: currentQuestion.concept,
          answer,
          difficulty: currentQuestion.difficulty,
        }),
      });
      if (!response.ok) throw new Error(`Assess failed (${response.status})`);
      const data = await response.json();
      setResult({ correct: data.correct, explanation: data.explanation, correctAnswer: data.correctAnswer });

      if (data.correct) {
        setScore((s) => s + 1);
        const xpResult = await awardXp('quiz_correct', { concept: currentQuestion.concept });
        if (xpResult.success) {
          setXpNotification({
            xpEarned: xpResult.xpAwarded || 10,
            isNewLevel: xpResult.newLevel !== undefined,
            level: xpResult.newLevel,
          });
        }
        refreshStats();
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
      setSelectedAnswer(null); // allow retry on network error
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setResult(null);
    setXpNotification(null);
    setIndex((i) => i + 1);
  };

  const handleRestart = () => {
    setSelectedAnswer(null);
    setResult(null);
    setXpNotification(null);
    setScore(0);
    setIndex(0);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Practice time</h1>
          <p className="text-gray-600">Test what you&apos;ve learned so far</p>
        </div>
        {!finished && (
          <span className="text-sm text-gray-500 tabular-nums">
            Question {index + 1} / {quizQuestions.length}
          </span>
        )}
      </div>

      <XpNotification
        xpEarned={xpNotification?.xpEarned || 0}
        isNewLevel={xpNotification?.isNewLevel}
        level={xpNotification?.level}
      />

      {finished ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center max-w-2xl">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Quiz complete 🎉</h2>
          <p className="text-gray-600 mb-6">
            You scored <span className="font-semibold text-violet-600">{score}</span> out of {quizQuestions.length}.
          </p>
          <button
            onClick={handleRestart}
            className="px-5 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition"
          >
            Restart quiz
          </button>
        </div>
      ) : (
        <>
          <QuizCard
            question={currentQuestion}
            onAnswer={handleAnswer}
            isLoading={isLoading}
            selectedAnswer={selectedAnswer}
            correctAnswer={result?.correctAnswer ?? null}
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
              {result.correct && <p className="mt-2 text-sm text-amber-600">+10 XP earned!</p>}
              <button
                onClick={handleNext}
                className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition"
              >
                {isLast ? 'Finish' : 'Next question'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
