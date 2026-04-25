import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import type { AssessRequest, AssessResponse, QuizQuestion } from '@/lib/types';

type Difficulty = QuizQuestion['difficulty'];

const sampleQuestions: QuizQuestion[] = [
  {
    id: '1',
    concept: 'algebra',
    question: 'Solve for x: 2x + 5 = 13',
    options: ['x = 4', 'x = 5', 'x = 6', 'x = 7'],
    correctAnswer: 'x = 4',
    difficulty: 'easy',
    explanation: '2x + 5 = 13, subtract 5 from both sides: 2x = 8, divide by 2: x = 4',
  },
];

function isDifficulty(value: unknown): value is Difficulty {
  return value === 'easy' || value === 'medium' || value === 'hard';
}

function getNextDifficulty(current: Difficulty, correct: boolean): Difficulty {
  if (correct) {
    return current === 'easy' ? 'medium' : 'hard';
  }
  return current === 'hard' ? 'medium' : 'easy';
}

function clampMastery(value: number) {
  return Math.min(100, Math.max(0, value));
}

export async function POST(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: AssessRequest = await request.json();
    const { conceptId, answer, difficulty } = body;

    if (!conceptId || !answer || !difficulty) {
      return NextResponse.json(
        { error: 'conceptId, answer, and difficulty are required' },
        { status: 400 }
      );
    }

    if (!isDifficulty(difficulty)) {
      return NextResponse.json({ error: 'Invalid difficulty' }, { status: 400 });
    }

    const question = sampleQuestions.find((item) => item.concept === conceptId);
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const correct = answer === question.correctAnswer;
    const masteryChange = correct ? 10 : -5;

    // Upsert profile
    const profileRef = adminDb.collection('profiles').doc(userId);
    const profileSnap = await profileRef.get();
    if (!profileSnap.exists) {
      await profileRef.set({ id: userId, email: `${userId}@user.local` });
    }

    // Record quiz attempt
    await adminDb.collection('quiz_attempts').add({
      user_id: userId,
      concept: question.concept,
      question: question.question,
      user_answer: answer,
      correct,
      difficulty,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Read existing knowledge state
    const ksSnapshot = await adminDb
      .collection('knowledge_states')
      .where('user_id', '==', userId)
      .where('concept', '==', question.concept)
      .limit(1)
      .get();

    const currentMastery = ksSnapshot.empty
      ? 0
      : (ksSnapshot.docs[0].data().mastery_level as number) || 0;
    const masteryLevel = clampMastery(currentMastery + masteryChange);
    const now = new Date().toISOString();

    if (ksSnapshot.empty) {
      await adminDb.collection('knowledge_states').add({
        user_id: userId,
        concept: question.concept,
        mastery_level: masteryLevel,
        last_practiced: now,
        updated_at: now,
      });
    } else {
      await ksSnapshot.docs[0].ref.update({
        mastery_level: masteryLevel,
        last_practiced: now,
        updated_at: now,
      });
    }

    const response: AssessResponse = {
      correct,
      explanation: question.explanation,
      nextDifficulty: getNextDifficulty(difficulty, correct),
      masteryChange,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Assessment error:', error);
    return NextResponse.json({ error: 'Failed to process assessment' }, { status: 500 });
  }
}
