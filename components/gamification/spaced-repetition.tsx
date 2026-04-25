'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthChange } from '@/lib/auth-client';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  Brain
} from 'lucide-react';

interface SpacedRepetitionStats {
  concepts: Array<{
    concept: string;
    mastery: number;
    lastPracticed: string | null;
    nextReview: string | null;
    dueIn: number | null;
  }>;
  summary: {
    dueToday: number;
    dueThisWeek: number;
    dueLater: number;
    mastered: number;
  };
}

export function useSpacedRepetition() {
  const [data, setData] = useState<SpacedRepetitionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      if (user) fetchSpacedRepetition(user.uid);
      else {
        setError('Not authenticated');
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchSpacedRepetition = async (userId: string) => {
    try {
      setLoading(true);
      const docRef = doc(db, 'learningPath', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const result = docSnap.data();
        const learningPath = result.learningPath || [];
        
        const concepts = learningPath.map((step: { concept: string; action: string }) => ({
          concept: step.concept,
          mastery: step.action === 'review' ? 80 : step.action === 'practice' ? 50 : 20,
          lastPracticed: null,
          nextReview: null,
          dueIn: step.action === 'review' ? 0 : step.action === 'practice' ? 1 : 3,
        }));

        const dueToday = concepts.filter((c: { dueIn: number | null }) => c.dueIn === 0).length;
        const dueThisWeek = concepts.filter((c: { dueIn: number | null }) => c.dueIn !== null && c.dueIn <= 7).length;
        const dueLater = concepts.filter((c: { dueIn: number | null }) => c.dueIn !== null && c.dueIn > 7).length;
        const mastered = concepts.filter((c: { mastery: number }) => c.mastery >= 80).length;

        setData({
          concepts,
          summary: { dueToday, dueThisWeek, dueLater, mastered },
        });
      } else {
        setData({
          concepts: [],
          summary: { dueToday: 0, dueThisWeek: 0, dueLater: 0, mastered: 0 },
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refresh: () => {} };
}

interface SpacedRepetitionCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

function SpacedRepetitionCard({ title, value, icon: Icon, color, bgColor }: SpacedRepetitionCardProps) {
  return (
    <div className={`${bgColor} rounded-lg p-4`}>
      <div className="flex items-center gap-2">
        <Icon className={`w-5 h-5 ${color}`} />
        <span className="text-sm text-gray-600">{title}</span>
      </div>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

export function SpacedRepetitionWidget() {
  const { data, loading, error } = useSpacedRepetition();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  const { summary } = data;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Brain className="w-5 h-5 text-violet-500" />
        <h3 className="font-semibold">Spaced Repetition</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <SpacedRepetitionCard
          title="Due Today"
          value={summary.dueToday}
          icon={AlertCircle}
          color="text-red-600"
          bgColor="bg-red-50"
        />
        <SpacedRepetitionCard
          title="This Week"
          value={summary.dueThisWeek}
          icon={Calendar}
          color="text-amber-600"
          bgColor="bg-amber-50"
        />
        <SpacedRepetitionCard
          title="Later"
          value={summary.dueLater}
          icon={Clock}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <SpacedRepetitionCard
          title="Mastered"
          value={summary.mastered}
          icon={CheckCircle}
          color="text-green-600"
          bgColor="bg-green-50"
        />
      </div>

      {summary.dueToday > 0 && (
        <button className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
          Review Now ({summary.dueToday})
        </button>
      )}
    </div>
  );
}

export function SpacedRepetitionSchedule() {
  const { data, loading } = useSpacedRepetition();

  if (loading) {
    return <div className="animate-pulse h-32 bg-gray-100 rounded-lg" />;
  }

  if (!data?.concepts.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>Start learning to see your schedule!</p>
      </div>
    );
  }

  const timeline = [
    { label: 'Today', items: data.concepts.filter(c => c.dueIn === 0), color: 'bg-red-100 border-red-300' },
    { label: 'Tomorrow', items: data.concepts.filter(c => c.dueIn === 1), color: 'bg-amber-100 border-amber-300' },
    { label: 'This Week', items: data.concepts.filter(c => c.dueIn && c.dueIn > 1 && c.dueIn <= 7), color: 'bg-blue-100 border-blue-300' },
    { label: 'Later', items: data.concepts.filter(c => c.dueIn && c.dueIn > 7), color: 'bg-gray-100 border-gray-300' },
  ];

  return (
    <div className="space-y-4">
      {timeline.map((period) => (
        <div key={period.label} className="space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm">{period.label}</h4>
            {period.items.length > 0 && (
              <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">
                {period.items.length}
              </span>
            )}
          </div>
          <div className="space-y-1">
            {period.items.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Nothing scheduled</p>
            ) : (
              period.items.map(item => (
                <div
                  key={item.concept}
                  className={`px-3 py-2 rounded border ${period.color}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{item.concept}</span>
                    <span className="text-xs text-gray-500">{item.mastery}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}