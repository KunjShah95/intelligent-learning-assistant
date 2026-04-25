import { NextResponse, NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

type XpEventType =
  | 'quiz_correct'
  | 'quiz_streak'
  | 'session_complete'
  | 'concept_mastered'
  | 'daily_login'
  | 'achievement';

const XP_EVENT_VALUES: Record<XpEventType, number> = {
  quiz_correct: 10,
  quiz_streak: 25,
  session_complete: 50,
  concept_mastered: 100,
  daily_login: 5,
  achievement: 25,
};

const ACHIEVEMENT_CONFIG: Record<string, { xp: number; name: string; description: string }> = {
  first_quiz: { xp: 50, name: 'First Steps', description: 'Complete your first quiz' },
  streak_3: { xp: 100, name: 'On Fire', description: '3 day streak' },
  streak_7: { xp: 250, name: 'Week Warrior', description: '7 day streak' },
  streak_30: { xp: 1000, name: 'Unstoppable', description: '30 day streak' },
  correct_10: { xp: 100, name: 'Perfect 10', description: '10 correct answers in a row' },
  correct_50: { xp: 500, name: 'Quiz Master', description: '50 correct answers' },
  correct_100: { xp: 1000, name: 'Knowledge Seeker', description: '100 correct answers' },
  concepts_5: { xp: 200, name: 'Getting Started', description: 'Master 5 concepts' },
  concepts_10: { xp: 500, name: 'Quick Learner', description: 'Master 10 concepts' },
  concepts_25: { xp: 1500, name: 'Scholar', description: 'Master 25 concepts' },
};

const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 750, 1100, 1500, 2000, 2600, 3300, 4100, 5000, 6000, 7100, 8300, 9600, 11000,
  12500, 14100, 15800, 17600, 19500, 21500, 23600, 25800, 28100, 30500, 33000, 35600, 38300, 41100,
  44000, 47000, 50100, 53300, 56600, 60000, 63500, 67100, 70800, 74600, 78500, 82500, 86600, 90800,
  95100, 99500, 104000, 108600, 113300, 118100, 123000,
];

function calculateLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

function getLevelTitle(level: number): string {
  if (level <= 5) return 'Novice Learner';
  if (level <= 10) return 'Apprentice';
  if (level <= 20) return 'Journeyman';
  if (level <= 35) return 'Expert';
  if (level <= 50) return 'Master';
  if (level <= 75) return 'Grandmaster';
  return 'Legend';
}

type UserStatsData = {
  user_id: string;
  xp: number;
  level: number;
  total_xp_earned: number;
  current_streak_days: number;
  longest_streak_days: number;
  questions_answered: number;
  correct_answers: number;
  concepts_mastered: number;
  last_activity_date: string | null;
};

async function ensureUserStats(userId: string): Promise<{ ref: admin.firestore.DocumentReference; data: UserStatsData }> {
  const statsRef = adminDb.collection('user_stats').doc(userId);
  const statsSnap = await statsRef.get();

  if (statsSnap.exists) {
    return { ref: statsRef, data: statsSnap.data() as UserStatsData };
  }

  const defaultStats: UserStatsData = {
    user_id: userId,
    xp: 0,
    level: 1,
    total_xp_earned: 0,
    current_streak_days: 0,
    longest_streak_days: 0,
    questions_answered: 0,
    correct_answers: 0,
    concepts_mastered: 0,
    last_activity_date: null,
  };
  await statsRef.set(defaultStats);
  return { ref: statsRef, data: defaultStats };
}

async function calculateStreakBonus(
  stats: UserStatsData
): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  if (stats.last_activity_date === today) return 0;
  return Math.min(stats.current_streak_days * 2, 10);
}

async function awardXp(
  userId: string,
  eventType: XpEventType,
  statsRef: admin.firestore.DocumentReference,
  stats: UserStatsData,
  metadata: Record<string, unknown> = {}
) {
  const xpAmount = XP_EVENT_VALUES[eventType] || 10;
  const newTotalXp = stats.total_xp_earned + xpAmount;
  const newLevel = calculateLevel(newTotalXp);
  const streakBonus = eventType === 'quiz_correct' ? await calculateStreakBonus(stats) : 0;
  const totalXpAwarded = xpAmount + streakBonus;

  await statsRef.update({
    xp: stats.xp + totalXpAwarded,
    total_xp_earned: newTotalXp,
    level: newLevel,
    last_activity_date: new Date().toISOString().split('T')[0],
  });

  await adminDb.collection('xp_events').add({
    user_id: userId,
    event_type: eventType,
    xp_amount: totalXpAwarded,
    metadata,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { xpAwarded: totalXpAwarded, streakBonus, newLevel };
}

async function checkAchievements(
  userId: string,
  stats: UserStatsData
): Promise<string[]> {
  const earned: string[] = [];

  const checks: Array<{ condition: boolean; achievement: string }> = [
    { condition: stats.correct_answers >= 1, achievement: 'first_quiz' },
    { condition: stats.current_streak_days >= 3, achievement: 'streak_3' },
    { condition: stats.current_streak_days >= 7, achievement: 'streak_7' },
    { condition: stats.current_streak_days >= 30, achievement: 'streak_30' },
    { condition: stats.correct_answers >= 10, achievement: 'correct_10' },
    { condition: stats.correct_answers >= 50, achievement: 'correct_50' },
    { condition: stats.correct_answers >= 100, achievement: 'correct_100' },
    { condition: stats.concepts_mastered >= 5, achievement: 'concepts_5' },
    { condition: stats.concepts_mastered >= 10, achievement: 'concepts_10' },
    { condition: stats.concepts_mastered >= 25, achievement: 'concepts_25' },
  ];

  for (const check of checks) {
    if (!check.condition) continue;

    const existing = await adminDb
      .collection('achievements')
      .where('user_id', '==', userId)
      .where('achievement_id', '==', check.achievement)
      .limit(1)
      .get();

    if (existing.empty) {
      const config = ACHIEVEMENT_CONFIG[check.achievement];
      await adminDb.collection('achievements').add({
        user_id: userId,
        achievement_id: check.achievement,
        name: config.name,
        description: config.description,
        xp_reward: config.xp,
        earned_at: admin.firestore.FieldValue.serverTimestamp(),
      });
      // Re-fetch stats for XP award
      const { ref, data } = await ensureUserStats(userId);
      await awardXp(userId, 'achievement', ref, data, { achievement: check.achievement });
      earned.push(check.achievement);
    }
  }

  return earned;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: stats } = await ensureUserStats(userId);

    const achievementsSnap = await adminDb
      .collection('achievements')
      .where('user_id', '==', userId)
      .orderBy('earned_at', 'desc')
      .get();

    const recentEventsSnap = await adminDb
      .collection('xp_events')
      .where('user_id', '==', userId)
      .orderBy('created_at', 'desc')
      .limit(10)
      .get();

    return NextResponse.json({
      xp: stats.xp,
      level: stats.level,
      levelTitle: getLevelTitle(stats.level),
      totalXpEarned: stats.total_xp_earned,
      xpToNextLevel: LEVEL_THRESHOLDS[stats.level] || 0,
      currentStreakDays: stats.current_streak_days,
      longestStreakDays: stats.longest_streak_days,
      questionsAnswered: stats.questions_answered,
      correctAnswers: stats.correct_answers,
      conceptsMastered: stats.concepts_mastered,
      achievements: achievementsSnap.docs.map(d => d.data()),
      recentEvents: recentEventsSnap.docs.map(d => d.data()),
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { action, ...data } = body;

    const { ref: statsRef, data: stats } = await ensureUserStats(userId);

    switch (action) {
      case 'quiz_correct': {
        const result = await awardXp(userId, 'quiz_correct', statsRef, stats, { concept: data.concept });
        await statsRef.update({
          questions_answered: stats.questions_answered + 1,
          correct_answers: stats.correct_answers + 1,
        });
        const { data: newStats } = await ensureUserStats(userId);
        await checkAchievements(userId, newStats);
        return NextResponse.json({ success: true, xpAwarded: result?.xpAwarded || 0, newLevel: result?.newLevel });
      }

      case 'quiz_incorrect': {
        await statsRef.update({ questions_answered: stats.questions_answered + 1 });
        return NextResponse.json({ success: true });
      }

      case 'session_complete': {
        const result = await awardXp(userId, 'session_complete', statsRef, stats, { duration: data.duration });
        return NextResponse.json({ success: true, xpAwarded: result?.xpAwarded || 0, newLevel: result?.newLevel });
      }

      case 'concept_mastered': {
        const result = await awardXp(userId, 'concept_mastered', statsRef, stats, { concept: data.concept });
        await statsRef.update({ concepts_mastered: stats.concepts_mastered + 1 });
        return NextResponse.json({ success: true, xpAwarded: result?.xpAwarded || 0, newLevel: result?.newLevel });
      }

      case 'daily_login': {
        const today = new Date().toISOString().split('T')[0];
        const lastActivity = stats.last_activity_date;

        if (lastActivity !== today) {
          let newStreak = stats.current_streak_days;
          if (lastActivity) {
            const diffDays = Math.floor(
              (new Date(today).getTime() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)
            );
            if (diffDays === 1) newStreak += 1;
            else if (diffDays > 1) newStreak = 1;
          } else {
            newStreak = 1;
          }

          const longestStreak = Math.max(newStreak, stats.longest_streak_days);
          const result = await awardXp(userId, 'daily_login', statsRef, stats, { streak: newStreak });

          await statsRef.update({
            current_streak_days: newStreak,
            longest_streak_days: longestStreak,
            last_activity_date: today,
          });

          return NextResponse.json({
            success: true,
            xpAwarded: result?.xpAwarded || 0,
            newStreak,
            isNewRecord: newStreak > stats.longest_streak_days,
          });
        }
        return NextResponse.json({ success: true, alreadyLoggedIn: true });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Stats POST error:', error);
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}