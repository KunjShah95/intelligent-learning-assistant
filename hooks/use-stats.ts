import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface UserStats {
  xp: number;
  level: number;
  levelTitle: string;
  totalXpEarned: number;
  xpToNextLevel: number;
  currentStreakDays: number;
  longestStreakDays: number;
  questionsAnswered: number;
  correctAnswers: number;
  conceptsMastered: number;
  achievements: Array<{
    id: string;
    achievement_id: string;
    name: string;
    description: string;
    xp_reward: number;
    earned_at: string;
  }>;
  recentEvents: Array<{
    id: string;
    event_type: string;
    xp_amount: number;
    created_at: string;
  }>;
}

interface UseStatsReturn {
  stats: UserStats | null;
  isLoading: boolean;
  error: string | null;
  awardXp: (action: string, data?: Record<string, unknown>) => Promise<{ success: boolean; xpAwarded?: number; newLevel?: number }>;
  refreshStats: () => Promise<void>;
}

export function useStats(): UseStatsReturn {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/stats', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const awardXp = useCallback(
    async (action: string, data: Record<string, unknown> = {}) => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          return { success: false };
        }

        const response = await fetch('/api/stats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action, ...data }),
        });

        if (!response.ok) {
          throw new Error('Failed to award XP');
        }

        const result = await response.json();
        await fetchStats();
        return result;
      } catch (err) {
        console.error('awardXp error:', err);
        return { success: false };
      }
    },
    [fetchStats]
  );

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, isLoading: loading, error, awardXp, refreshStats: fetchStats };
}

export function calculateXpProgress(currentXp: number, level: number): number {
  const thresholds = [
    0, 100, 250, 500, 750, 1100, 1500, 2000, 2600, 3300, 4100, 5000, 6000, 7100, 8300, 9600, 11000, 12500, 14100, 15800,
    17600, 19500, 21500, 23600, 25800, 28100, 30500, 33000, 35600, 38300,
  ];

  const currentThreshold = thresholds[level - 1] || 0;
  const nextThreshold = thresholds[level] || currentThreshold + 1000;
  const progress = ((currentXp - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
  return Math.min(Math.max(progress, 0), 100);
}