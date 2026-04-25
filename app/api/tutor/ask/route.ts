import { NextRequest, NextResponse } from 'next/server';
import { orchestrate } from '@/lib/agents';
import { adminDb } from '@/lib/firebase-admin';
import { allModels, type ModelProvider } from '@/lib/ai';
import type { TutorRequest, TutorResponse } from '@/lib/types';
import * as admin from 'firebase-admin';

function parseModelProvider(value: string | undefined): ModelProvider | undefined {
  if (!value) {
    return undefined;
  }

  return (allModels as string[]).includes(value) ? (value as ModelProvider) : undefined;
}

async function getRecentHistory(userId: string): Promise<string[]> {
  try {
    const historySnapshot = await adminDb
      .collection('interactions')
      .where('user_id', '==', userId)
      .orderBy('created_at', 'desc')
      .limit(3)
      .get();

    return historySnapshot.docs.map((doc) => doc.data().user_message as string);
  } catch (error) {
    console.warn('Tutor history unavailable:', error);
    return [];
  }
}

async function getLearningStyle(userId: string): Promise<string | undefined> {
  try {
    const prefsSnapshot = await adminDb
      .collection('learning_preferences')
      .where('user_id', '==', userId)
      .limit(1)
      .get();

    if (prefsSnapshot.empty) {
      return undefined;
    }

    return prefsSnapshot.docs[0].data().learning_style;
  } catch (error) {
    console.warn('Tutor preferences unavailable:', error);
    return undefined;
  }
}

async function saveInteraction(input: {
  userId: string;
  question: string;
  answer: string;
  concept?: string;
}) {
  try {
    await adminDb.collection('interactions').add({
      user_id: input.userId,
      type: 'query',
      user_message: input.question,
      ai_response: input.answer,
      concept: input.concept || null,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.warn('Tutor interaction not saved:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = 'mock_user_123';

    const body: TutorRequest = await request.json();
    const { question, concept, explanationLevel = 'detailed', modelProvider, apiKeys } = body;
    const selectedModel = parseModelProvider(modelProvider);

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    const [history, learningStyle] = await Promise.all([
      getRecentHistory(userId),
      getLearningStyle(userId),
    ]);

    // Run multi-agent orchestration
    const result = await orchestrate(question, {
      level: explanationLevel,
      learningStyle,
      history,
      modelProvider: selectedModel,
      apiKeys,
    });

    await saveInteraction({
      userId,
      question,
      answer: result.explanation,
      concept,
    });

    const response: TutorResponse = {
      answer: result.explanation,
      explanationLevel,
      concept: concept || 'general',
      followUp: 'Would you like me to explain this differently?',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Tutor error:', error);
    return NextResponse.json(
      { error: 'Failed to get response from AI' },
      { status: 500 }
    );
  }
}
