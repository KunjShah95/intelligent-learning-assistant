import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

interface ConceptNode {
  concept: string;
  mastery: number;
  lastPracticed: string | null;
  nextReview: string | null;
}

interface LearningPathStep {
  concept: string;
  action: 'review' | 'practice' | 'learn';
  reason: string;
  priority: number;
}

function calculateNextReview(lastPracticed: string | null, mastery: number): boolean {
  if (!lastPracticed) return true;
  const daysSince = (Date.now() - new Date(lastPracticed).getTime()) / (1000 * 60 * 60 * 24);
  const interval = Math.pow(2, mastery / 20);
  return daysSince >= interval;
}

function generateLearningPath(concepts: ConceptNode[]): LearningPathStep[] {
  const path: LearningPathStep[] = [];

  const sorted = concepts.sort((a, b) => {
    const aDue = calculateNextReview(a.lastPracticed, a.mastery);
    const bDue = calculateNextReview(b.lastPracticed, b.mastery);
    if (aDue && !bDue) return -1;
    if (!aDue && bDue) return 1;
    return a.mastery - b.mastery;
  });

  for (const concept of sorted) {
    const isDue = calculateNextReview(concept.lastPracticed, concept.mastery);
    const mastery = concept.mastery || 0;

    if (mastery >= 80) {
      path.push({ concept: concept.concept, action: 'review', reason: 'Maintain mastery', priority: 1 });
    } else if (mastery >= 50 && isDue) {
      path.push({ concept: concept.concept, action: 'practice', reason: 'Strengthen understanding', priority: 2 });
    } else if (mastery < 30) {
      path.push({ concept: concept.concept, action: 'learn', reason: 'Needs foundation building', priority: 3 });
    }
  }

  return path.slice(0, 5);
}

export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get knowledge states
    const ksSnapshot = await adminDb
      .collection('knowledge_states')
      .where('user_id', '==', userId)
      .get();

    // Get learning preferences (for weak_concepts)
    const prefsSnapshot = await adminDb
      .collection('learning_preferences')
      .where('user_id', '==', userId)
      .limit(1)
      .get();

    // Get recent learning history
    const historySnapshot = await adminDb
      .collection('learning_history')
      .where('user_id', '==', userId)
      .orderBy('created_at', 'desc')
      .limit(20)
      .get();

    const concepts: ConceptNode[] = ksSnapshot.docs.map(doc => {
      const d = doc.data();
      return {
        concept: d.concept as string,
        mastery: (d.mastery_level as number) || 0,
        lastPracticed: (d.last_practiced as string) || null,
        nextReview: (d.next_review as string) || null,
      };
    });

    const weakConcepts: string[] = prefsSnapshot.empty
      ? []
      : ((prefsSnapshot.docs[0].data().weak_concepts as string[]) || []);

    for (const weak of weakConcepts) {
      if (!concepts.find(c => c.concept === weak)) {
        concepts.push({ concept: weak, mastery: 0, lastPracticed: null, nextReview: null });
      }
    }

    const learningPath = generateLearningPath(concepts);
    const avgMastery = concepts.length > 0
      ? Math.round(concepts.reduce((sum, c) => sum + c.mastery, 0) / concepts.length)
      : 0;

    const history = historySnapshot.docs.map(doc => doc.data());

    return NextResponse.json({
      learningPath,
      stats: {
        totalConcepts: concepts.length,
        averageMastery: avgMastery,
        mastered: concepts.filter(c => c.mastery >= 80).length,
        needsWork: concepts.filter(c => c.mastery < 30).length,
      },
      historySummary: {
        recentTopics: Array.from(new Set(history.map(h => h.concept as string))).slice(0, 5),
        avgQuality: history.length
          ? Math.round(history.reduce((sum, h) => sum + ((h.quality_score as number) || 3), 0) / history.length)
          : 3,
      },
    });
  } catch (error) {
    console.error('Learning path error:', error);
    return NextResponse.json({ error: 'Failed to generate learning path' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { concept, interactionType, content, qualityScore, timeSpent } = body;

    await adminDb.collection('learning_history').add({
      user_id: userId,
      concept,
      interaction_type: interactionType,
      content: typeof content === 'string' ? content.slice(0, 1000) : content,
      quality_score: qualityScore,
      time_spent_seconds: timeSpent,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update knowledge state for quiz interactions
    if (interactionType === 'quiz' && qualityScore) {
      const masteryChange = qualityScore >= 4 ? 10 : qualityScore >= 3 ? 5 : -5;

      const ksSnapshot = await adminDb
        .collection('knowledge_states')
        .where('user_id', '==', userId)
        .where('concept', '==', concept)
        .limit(1)
        .get();

      const now = new Date().toISOString();
      if (ksSnapshot.empty) {
        await adminDb.collection('knowledge_states').add({
          user_id: userId,
          concept,
          mastery_level: Math.max(0, masteryChange),
          last_practiced: now,
        });
      } else {
        const currentMastery = (ksSnapshot.docs[0].data().mastery_level as number) || 0;
        await ksSnapshot.docs[0].ref.update({
          mastery_level: Math.min(100, Math.max(0, currentMastery + masteryChange)),
          last_practiced: now,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Learning history error:', error);
    return NextResponse.json({ error: 'Failed to record interaction' }, { status: 500 });
  }
}