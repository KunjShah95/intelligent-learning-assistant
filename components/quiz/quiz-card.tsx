'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { QuizQuestion } from '@/lib/types';

interface QuizCardProps {
  question: QuizQuestion;
  onAnswer: (answer: string) => void;
  isLoading?: boolean;
}

export function QuizCard({ question, onAnswer, isLoading }: QuizCardProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (option: string) => {
    setSelected(option);
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
            disabled={isLoading}
            className={cn(
              'w-full text-left px-4 py-3 rounded-lg border transition',
              selected === option
                ? 'border-primary-600 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300',
              isLoading && 'opacity-50 cursor-not-allowed'
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}