import type { QuizQuestion } from './types';

/**
 * Shared quiz question bank used by both the quiz UI and the assess API.
 * Keeping a single source of truth means the server can validate answers
 * by question id without trusting a correctAnswer sent from the client.
 */
export const quizQuestions: QuizQuestion[] = [
  {
    id: 'algebra-1',
    concept: 'algebra',
    question: 'Solve for x: 2x + 5 = 13',
    options: ['x = 4', 'x = 5', 'x = 6', 'x = 7'],
    correctAnswer: 'x = 4',
    difficulty: 'easy',
    explanation: '2x + 5 = 13, subtract 5 from both sides: 2x = 8, divide by 2: x = 4.',
  },
  {
    id: 'algebra-2',
    concept: 'algebra',
    question: 'What is the slope of the line y = 3x - 2?',
    options: ['-2', '2', '3', '-3'],
    correctAnswer: '3',
    difficulty: 'easy',
    explanation: 'In slope-intercept form y = mx + b, the coefficient m is the slope. Here m = 3.',
  },
  {
    id: 'geometry-1',
    concept: 'geometry',
    question: 'What is the sum of interior angles of a triangle?',
    options: ['90°', '180°', '270°', '360°'],
    correctAnswer: '180°',
    difficulty: 'easy',
    explanation: 'The interior angles of any triangle always sum to 180°.',
  },
  {
    id: 'arithmetic-1',
    concept: 'arithmetic',
    question: 'What is 15% of 200?',
    options: ['15', '20', '30', '45'],
    correctAnswer: '30',
    difficulty: 'medium',
    explanation: '15% of 200 = 0.15 × 200 = 30.',
  },
  {
    id: 'algebra-3',
    concept: 'algebra',
    question: 'Factor: x² - 9',
    options: ['(x - 3)(x - 3)', '(x + 3)(x - 3)', '(x + 9)(x - 1)', '(x - 9)(x + 1)'],
    correctAnswer: '(x + 3)(x - 3)',
    difficulty: 'medium',
    explanation: 'x² - 9 is a difference of squares: a² - b² = (a + b)(a - b), so x² - 3² = (x + 3)(x - 3).',
  },
];

export function findQuestion(criteria: { id?: string; concept?: string }): QuizQuestion | undefined {
  if (criteria.id) {
    const byId = quizQuestions.find((q) => q.id === criteria.id);
    if (byId) return byId;
  }
  if (criteria.concept) {
    return quizQuestions.find((q) => q.concept === criteria.concept);
  }
  return undefined;
}
