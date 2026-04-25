'use client';

import { ProgressRing } from '@/components/quiz/progress-ring';
import { XpBar, StreakDisplay, AchievementBadge } from '@/components/gamification/xp-display';
import { useProgress } from '@/hooks/use-progress';
import { useStats } from '@/hooks/use-stats';

export default function ProgressPage() {
  const { progress, isLoading: progressLoading, error: progressError } = useProgress();
  const { stats, isLoading: statsLoading, awardXp } = useStats();

  const overallMastery = progress
    ? Math.round(
        progress.masteryMap.reduce((acc, m) => acc + m.level, 0) /
          (progress.masteryMap.length || 1)
      )
    : 0;

  if (progressLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading your progress...</p>
      </div>
    );
  }

  const allAchievements = [
    { id: 'first_quiz', name: 'First Steps', description: 'Complete your first quiz' },
    { id: 'streak_3', name: 'On Fire', description: '3 day streak' },
    { id: 'streak_7', name: 'Week Warrior', description: '7 day streak' },
    { id: 'streak_30', name: 'Unstoppable', description: '30 day streak' },
    { id: 'correct_10', name: 'Perfect 10', description: '10 correct answers' },
    { id: 'correct_50', name: 'Quiz Master', description: '50 correct answers' },
    { id: 'correct_100', name: 'Knowledge Seeker', description: '100 correct answers' },
    { id: 'concepts_5', name: 'Getting Started', description: 'Master 5 concepts' },
    { id: 'concepts_10', name: 'Quick Learner', description: 'Master 10 concepts' },
    { id: 'concepts_25', name: 'Scholar', description: 'Master 25 concepts' },
  ];

  const earnedAchievementIds = new Set(stats?.achievements?.map(a => a.achievement_id) || []);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Your progress</h1>
        <p className="text-gray-600">See how far you&apos;ve come</p>
      </div>

      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-6 rounded-xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm opacity-80">Level {stats?.level || 1}</p>
            <p className="text-3xl font-bold">{stats?.levelTitle || 'Novice Learner'}</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold">{stats?.xp || 0}</p>
            <p className="text-sm opacity-80">Total XP</p>
          </div>
        </div>
        {stats && (
          <div className="mt-4">
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${((stats?.xp || 0) / (stats?.xpToNextLevel || 1)) * 100}%` }}
              />
            </div>
            <p className="text-xs mt-1 text-right">{stats.xp || 0} / {stats.xpToNextLevel || 100} to next level</p>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
          <ProgressRing progress={overallMastery} size={80} />
          <p className="mt-4 text-sm text-gray-600">Overall mastery</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-3xl font-bold text-gray-900">{progress?.totalSessions || 0}</p>
          <p className="text-sm text-gray-600">Sessions completed</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <StreakDisplay
            currentStreak={stats?.currentStreakDays || 0}
            longestStreak={stats?.longestStreakDays || 0}
          />
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-3xl font-bold text-gray-900">{stats?.conceptsMastered || 0}</p>
          <p className="text-sm text-gray-600">Concepts mastered</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Achievements</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {allAchievements.map((achievement) => (
            <AchievementBadge
              key={achievement.id}
              name={achievement.name}
              description={achievement.description}
              earned={earnedAchievementIds.has(achievement.id)}
            />
          ))}
        </div>
      </div>

      {progress?.weakAreas && progress.weakAreas.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Areas to focus on</h2>
          <div className="flex flex-wrap gap-2">
            {progress.weakAreas.map((area) => (
              <span
                key={area}
                className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
              >
                {area}
              </span>
            ))}
          </div>
        </div>
      )}

      {progress?.masteryMap && progress.masteryMap.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Concept mastery</h2>
          <div className="space-y-3">
            {progress.masteryMap.map((item) => (
              <div key={item.concept} className="flex items-center gap-4">
                <span className="w-24 text-sm text-gray-700">{item.concept}</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{ width: `${item.level}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-12">{item.level}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
