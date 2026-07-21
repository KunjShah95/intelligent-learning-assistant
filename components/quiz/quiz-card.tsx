'use client';

import { cn } from '@/lib/utils';
import type { QuizQuestion } from '@/lib/types';

interface QuizCardProps {
  question: QuizQuestion;
  onAnswer: (answer: string) => void;
  isLoading?: boolean;
  /** The answer the user selected, once submitted. */
  selectedAnswer?: string | null;
  /** The correct answer, revealed after the server responds. */
  correctAnswer?: string | null;
}

export function QuizCard({
  question,
  onAnswer,
  isLoading,
  selectedAnswer,
  correctAnswer,
}: QuizCardProps) {
  const answered = !!selectedAnswer;
  const revealed = !!correctAnswer;

  const getOptionStyle = (option: string) => {
    if (revealed) {
      if (option === correctAnswer) return 'border-green-500 bg-green-50 text-green-800';
      if (option === selectedAnswer) return 'border-red-500 bg-red-50 text-red-800';
      return 'border-gray-200 opacity-60';
    }
    if (option === selectedAnswer) return 'border-primary-600 bg-primary-50';
    return 'border-gray-200 hover:border-gray-300';
  };

  const handleSelect = (option: string) => {
    if (answered || isLoading) return; // lock after first submit
    onAnswer(option);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-medium px-2 py-1 bg-primary-100 text-primary-700 rounded">
          {question.difficulty}
        </span>
        <span className="text-xs text-gray-500">{question.concept}</span>
      </div>

      <h3 className="text-lg font-semibold mb-6">{question.question}</h3>

      <div className="space-y-3">
        {question.options?.map((option) => (
          <button
            key={option}
            onClick={() => handleSelect(option)}
            disabled={answered || isLoading}
            className={cn(
              'w-full text-left px-4 py-3 rounded-lg border transition',
              getOptionStyle(option),
              (answered || isLoading) && 'cursor-not-allowed',
              isLoading && option === selectedAnswer && 'opacity-70 animate-pulse'
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
