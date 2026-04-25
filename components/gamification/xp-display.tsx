import { cn } from '@/lib/utils';

interface XpBarProps {
  currentXp: number;
  level: number;
  xpToNextLevel: number;
  className?: string;
}

export function XpBar({ currentXp, level, xpToNextLevel, className }: XpBarProps) {
  const progress = xpToNextLevel > 0 ? (currentXp / xpToNextLevel) * 100 : 0;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex justify-between text-sm">
        <span className="font-medium">Level {level}</span>
        <span className="text-muted-foreground">{currentXp} / {xpToNextLevel} XP</span>
      </div>
      <div className="h-3 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  );
}

interface LevelBadgeProps {
  level: number;
  title: string;
}

export function LevelBadge({ level, title }: LevelBadgeProps) {
  const getLevelColor = (level: number) => {
    if (level <= 5) return 'bg-slate-500';
    if (level <= 10) return 'bg-green-500';
    if (level <= 20) return 'bg-blue-500';
    if (level <= 35) return 'bg-purple-500';
    if (level <= 50) return 'bg-orange-500';
    if (level <= 75) return 'bg-red-500';
    return 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500';
  };

  return (
    <div className="flex items-center gap-2">
      <span className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white font-bold', getLevelColor(level))}>
        {level}
      </span>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">Level {level}</p>
      </div>
    </div>
  );
}

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
}

export function StreakDisplay({ currentStreak, longestStreak }: StreakDisplayProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🔥</span>
        <div>
          <p className="text-2xl font-bold">{currentStreak}</p>
          <p className="text-xs text-muted-foreground">Day Streak</p>
        </div>
      </div>
      {longestStreak > 0 && (
        <div className="flex items-center gap-2 border-l pl-4">
          <span className="text-2xl">🏆</span>
          <div>
            <p className="text-xl font-bold">{longestStreak}</p>
            <p className="text-xs text-muted-foreground">Best</p>
          </div>
        </div>
      )}
    </div>
  );
}

interface AchievementBadgeProps {
  name: string;
  description: string;
  earned: boolean;
}

export function AchievementBadge({ name, description, earned }: AchievementBadgeProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg border',
        earned ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200 opacity-50'
      )}
    >
      <span className={cn('text-lg', !earned && 'grayscale')}>🏅</span>
      <div>
        <p className={cn('font-medium text-sm', !earned && 'text-gray-500')}>{name}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

interface XpNotificationProps {
  xpEarned: number;
  isNewLevel?: boolean;
  level?: number;
}

export function XpNotification({ xpEarned, isNewLevel, level }: XpNotificationProps) {
  if (xpEarned <= 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
        <span className="text-2xl">⭐</span>
        <div>
          <p className="font-bold">+{xpEarned} XP</p>
          {isNewLevel && (
            <p className="text-sm">🎉 Level {level}!</p>
          )}
        </div>
      </div>
    </div>
  );
}