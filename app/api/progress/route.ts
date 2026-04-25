import { NextResponse, NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import type { UserProgress } from '@/lib/types';

const demoProgress: UserProgress = {
  totalSessions: 1,
  currentStreak: 1,
  conceptsMastered: 0,
  weakAreas: ['algebra'],
  masteryMap: [
    { concept: 'algebra', level: 25 },
    { concept: 'linear equations', level: 40 },
    { concept: 'fractions', level: 55 },
  ],
};

export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch knowledge states
    const knowledgeSnapshot = await adminDb
      .collection('knowledge_states')
      .where('user_id', '==', userId)
      .orderBy('mastery_level', 'asc')
      .limit(10)
      .get();

    if (knowledgeSnapshot.empty) {
      return NextResponse.json(demoProgress);
    }

    const knowledgeStates = knowledgeSnapshot.docs.map(doc => doc.data());

    // Fetch completed sessions count
    const sessionsSnapshot = await adminDb
      .collection('sessions')
      .where('user_id', '==', userId)
      .where('status', '==', 'completed')
      .get();

    const masteryMap = knowledgeStates.map((ks) => ({
      concept: ks.concept as string,
      level: ks.mastery_level as number,
    }));

    const weakAreas = masteryMap
      .filter((m) => m.level < 30)
      .map((m) => m.concept);

    const progress: UserProgress = {
      totalSessions: sessionsSnapshot.size,
      currentStreak: 5,
      conceptsMastered: masteryMap.filter((m) => m.level >= 80).length,
      weakAreas,
      masteryMap,
    };

    return NextResponse.json(progress);
  } catch (error) {
    console.error('Progress error:', error);
    return NextResponse.json({ error: 'Failed to get progress' }, { status: 500 });
  }
}
