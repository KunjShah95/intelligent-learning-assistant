'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthChange, type AuthUser } from '@/lib/auth-client';
import { 
  MessageCircle, 
  CheckSquare, 
  TrendingUp, 
  BookOpen, 
  Target,
  Flame,
  Trophy,
  Map,
  Sparkles,
  Clock,
  Brain,
  ArrowRight,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SpacedRepetitionWidget } from '@/components/gamification/spaced-repetition';

interface DashboardStats {
  totalSessions: number;
  currentStreak: number;
  conceptsMastered: number;
  xp: number;
  level: number;
}

const levelTitles: Record<number, string> = {
  1: 'Just Starting',
  5: 'Getting the Hang of It',
  10: 'Building Momentum',
  15: 'Finding Your Rhythm',
  20: 'Consistent Learner',
  25: 'Knowledge Builder',
  30: 'Quick Study',
  35: 'Dedicated Learner',
  40: 'Learning Machine',
  45: 'Scholar',
  50: 'Master',
};

function getLevelTitle(level: number): string {
  const tiers = Object.keys(levelTitles).map(Number).sort((a, b) => b - a);
  for (const tier of tiers) {
    if (level >= tier) return levelTitles[tier];
  }
  return 'Just Starting';
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (!user) {
        window.location.href = '/sign-in';
        return;
      }
      setUser(user);
      await fetchDashboardData(user.uid);
    });
    return () => unsubscribe();
  }, []);

  const fetchDashboardData = async (userId: string) => {
    try {
      setLoading(true);
      const docRef = doc(db, 'stats', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStats({
          totalSessions: data.questionsAnswered || 0,
          currentStreak: data.currentStreakDays || 0,
          conceptsMastered: data.conceptsMastered || 0,
          xp: data.xp || 0,
          level: data.level || 1,
        });
      } else {
        setStats({ totalSessions: 0, currentStreak: 0, conceptsMastered: 0, xp: 0, level: 1 });
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      setStats({ totalSessions: 0, currentStreak: 0, conceptsMastered: 0, xp: 0, level: 1 });
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total XP', value: stats?.xp || 0, icon: Sparkles, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Level', value: stats?.level || 1, icon: Trophy, color: 'text-violet-500', bg: 'bg-violet-50', subtitle: getLevelTitle(stats?.level || 1) },
    { label: 'Streak', value: stats?.currentStreak || 0, icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50', subtitle: 'days in a row' },
    { label: 'Mastered', value: stats?.conceptsMastered || 0, icon: CheckSquare, color: 'text-green-500', bg: 'bg-green-50', subtitle: 'concepts' },
  ];

  const quickActions = [
    { label: 'Ask the Tutor', href: '/dashboard/chat', icon: MessageCircle, desc: 'Stuck on something? Ask.' },
    { label: 'Practice Quiz', href: '/dashboard/quiz', icon: CheckSquare, desc: 'Test what you know' },
    { label: 'My Path', href: '/dashboard/learning-path', icon: Map, desc: 'What to learn next' },
    { label: 'Progress', href: '/dashboard/progress', icon: TrendingUp, desc: 'See how far you\'ve come' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {stats?.xp && stats.xp > 0 ? `Nice to see you back` : `Let's get started`}
        </h1>
        <p className="text-gray-600 mt-1">
          {stats?.currentStreak && stats.currentStreak > 0 
            ? `${stats.currentStreak} day streak — don't break it now`
            : `Ready to learn something new today?`
          }
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`${stat.bg} p-5 rounded-xl`}>
              <Icon className={cn('w-7 h-7 mb-2', stat.color)} />
              <p className="text-2xl font-bold text-gray-900">
                {stat.label === 'Streak' ? `${stat.value}` : stat.value}
                {stat.label === 'Level' && stat.subtitle && <span className="text-sm font-normal text-gray-500 ml-1">({stat.subtitle})</span>}
              </p>
              <p className="text-sm text-gray-600">
                {stat.subtitle || stat.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm border border-gray-100 transition hover:border-gray-200 hover:shadow-md group"
              >
                <Icon className="w-8 h-8 text-violet-600 group-hover:text-violet-700" />
                <div>
                  <p className="font-medium text-gray-900">{action.label}</p>
                  <p className="text-sm text-gray-500">{action.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-violet-500" />
              <h3 className="font-semibold text-gray-900">Review queue</h3>
            </div>
            <Link href="/dashboard/learning-path" className="text-sm text-violet-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <SpacedRepetitionWidget />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900">Recent activity</h3>
          </div>
          <div className="space-y-3">
            {[
              { action: 'Completed quiz', concept: 'Algebra basics', time: '2 hours ago' },
              { action: 'Asked a question', concept: 'Quadratic equations', time: '5 hours ago' },
              { action: 'Earned XP', concept: '+10 for correct answer', time: 'Yesterday' },
            ].map((activity, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium text-sm text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.concept}</p>
                </div>
                <p className="text-xs text-gray-400">{activity.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-xl font-bold">Ready to learn?</h3>
            <p className="opacity-90">Pick up where you left off or try something new</p>
          </div>
          <Link 
            href="/dashboard/chat" 
            className="px-6 py-3 bg-white text-violet-600 rounded-lg font-medium hover:bg-gray-100 transition flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Start learning
          </Link>
        </div>
      </div>
    </div>
  );
}