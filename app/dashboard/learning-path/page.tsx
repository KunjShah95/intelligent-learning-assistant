'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthChange } from '@/lib/auth-client';
import { Trophy, Target, Clock, BookOpen, CheckCircle, ArrowRight } from 'lucide-react';

interface LearningPathStep {
  concept: string;
  action: 'review' | 'practice' | 'learn';
  reason: string;
  priority: number;
}

interface LearningPathData {
  learningPath: LearningPathStep[];
  stats: {
    totalConcepts: number;
    averageMastery: number;
    mastered: number;
    needsWork: number;
  };
  historySummary: {
    recentTopics: string[];
    avgQuality: number;
  };
}

function useLearningPathData() {
  const [data, setData] = useState<LearningPathData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      if (user) fetchLearningPath(user.uid);
      else {
        setError('Not authenticated');
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchLearningPath = async (userId: string) => {
    try {
      setLoading(true);
      const docRef = doc(db, 'learningPath', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setData(docSnap.data() as LearningPathData);
      } else {
        setData({
          learningPath: [],
          stats: { totalConcepts: 0, averageMastery: 0, mastered: 0, needsWork: 0 },
          historySummary: { recentTopics: [], avgQuality: 0 },
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

const actionConfig = {
  review: { label: 'Review', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: CheckCircle },
  practice: { label: 'Practice', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Target },
  learn: { label: 'Learn', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: BookOpen },
};

export default function LearningPathPage() {
  const { data, loading, error } = useLearningPathData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Building your path...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        {error}
      </div>
    );
  }

  const { learningPath, stats, historySummary } = data || {};

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Your learning path</h1>
        <p className="text-gray-600 mt-1">What to focus on next, based on how you&apos;re doing</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span className="text-sm text-gray-600">Got it</span>
          </div>
          <p className="text-2xl font-bold mt-1 text-gray-900">{stats?.mastered || 0}</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-red-500" />
            <span className="text-sm text-gray-600">Needs work</span>
          </div>
          <p className="text-2xl font-bold mt-1 text-gray-900">{stats?.needsWork || 0}</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-orange-500" />
            <span className="text-sm text-gray-600">Total</span>
          </div>
          <p className="text-2xl font-bold mt-1 text-gray-900">{stats?.totalConcepts || 0}</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-600">Avg. mastery</span>
          </div>
          <p className="text-2xl font-bold mt-1 text-gray-900">{stats?.averageMastery || 0}%</p>
        </div>
      </div>

      {/* Learning Path */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold text-gray-900">Recommended next steps</h2>
        </div>
        
        {learningPath && learningPath.length > 0 ? (
          <div className="divide-y">
            {learningPath.map((step, index) => {
              const config = actionConfig[step.action];
              const Icon = config.icon;
              
              return (
                <div key={step.concept} className="px-6 py-4 flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-medium text-sm">
                    {index + 1}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{step.concept}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full border ${config.color}`}>
                        <Icon className="w-3 h-3 inline mr-1" />
                        {config.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{step.reason}</p>
                  </div>
                  
                  <button className="p-2 rounded-lg hover:bg-gray-100 transition">
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-6 py-8 text-center">
            <p className="text-gray-500">Start learning to see your personalized path!</p>
          </div>
        )}
      </div>

      {historySummary && historySummary.recentTopics.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-3">Recently studied</h2>
          <div className="flex flex-wrap gap-2">
            {historySummary.recentTopics.map((topic) => (
              <span key={topic} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}