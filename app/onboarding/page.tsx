'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthChange, type AuthUser } from '@/lib/auth-client';
import { 
  Sparkles, 
  BookOpen, 
  Target, 
  Clock, 
  CheckCircle, 
  ArrowRight, 
  Loader2,
  Brain,
  Lightbulb,
  Zap
} from 'lucide-react';

interface OnboardingData {
  preferred_explanation_level: string;
  learning_style: string;
  difficulty_preference: string;
  session_duration_minutes: number;
  topics_of_interest: string[];
}

const EXPLANATION_OPTIONS = [
  { value: 'simple', label: 'Simple', icon: '🌱', description: 'For beginners' },
  { value: 'detailed', label: 'Detailed', icon: '📚', description: 'In-depth explanations' },
  { value: 'analogy', label: 'Analogy', icon: '🔗', description: 'Real-world examples' },
  { value: 'step-by-step', label: 'Step-by-Step', icon: '📋', description: 'Process breakdown' },
];

const STYLE_OPTIONS = [
  { value: 'visual', label: 'Visual', icon: '🎨', description: 'Diagrams & charts' },
  { value: 'examples', label: 'Examples', icon: '💡', description: 'Code & real-world' },
  { value: 'theory-heavy', label: 'Theory', icon: '📖', description: 'Concepts first' },
  { value: 'story-based', label: 'Story', icon: '📚', description: 'Narratives' },
];

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Easy', icon: '🌱', description: 'Foundation building' },
  { value: 'medium', label: 'Medium', icon: '🌿', description: 'Balanced' },
  { value: 'hard', label: 'Hard', icon: '🌲', description: 'Challenge me' },
];

const SESSION_OPTIONS = [
  { value: 10, label: '10 min', icon: '⏱️' },
  { value: 15, label: '15 min', icon: '⏱️' },
  { value: 30, label: '30 min', icon: '⏱️' },
  { value: 45, label: '45 min', icon: '⏱️' },
  { value: 60, label: '1 hour', icon: '⏱️' },
];

const TOPIC_SUGGESTIONS = [
  'Python', 'JavaScript', 'React', 'Machine Learning', 'Data Science',
  'Algorithms', 'Databases', 'Web Development', 'System Design', 'DevOps',
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [data, setData] = useState<OnboardingData>({
    preferred_explanation_level: 'detailed',
    learning_style: 'examples',
    difficulty_preference: 'medium',
    session_duration_minutes: 15,
    topics_of_interest: [],
  });
  const [customTopic, setCustomTopic] = useState('');

  const checkExistingPreferences = useCallback(async (userId: string) => {
    try {
      const docRef = doc(db, 'preferences', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Check preferences error:', error);
    }
  }, [router]);

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      if (!user) {
        router.push('/sign-in');
      } else {
        setUser(user);
        checkExistingPreferences(user.uid);
      }
    });
    return () => unsubscribe();
  }, [checkExistingPreferences, router]);

  const updateData = (key: keyof OnboardingData, value: unknown) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const toggleTopic = (topic: string) => {
    const current = data.topics_of_interest;
    if (current.includes(topic)) {
      updateData('topics_of_interest', current.filter(t => t !== topic));
    } else {
      updateData('topics_of_interest', [...current, topic]);
    }
  };

  const addCustomTopic = () => {
    if (customTopic.trim() && !data.topics_of_interest.includes(customTopic.trim())) {
      toggleTopic(customTopic.trim());
      setCustomTopic('');
    }
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const savePreferences = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const docRef = doc(db, 'preferences', user.uid);
      await setDoc(docRef, data as unknown as Record<string, unknown>);
      router.push('/dashboard');
    } catch (error) {
      console.error('Save preferences error:', error);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    // Step 0: Welcome
    <div key="welcome" className="text-center space-y-6">
      <div className="flex justify-center">
        <Sparkles className="w-16 h-16 text-orange-500" />
      </div>
        <h2 className="text-2xl font-bold text-gray-900">Let&apos;s get you set up</h2>
      <p className="text-gray-600 max-w-md mx-auto">
        A few quick questions so we can make this actually useful for you. Takes about 2 minutes.
      </p>
      <button
        onClick={nextStep}
        className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium"
      >
        Let&apos;s go <ArrowRight className="w-5 h-5 inline ml-2" />
      </button>
    </div>,

    // Step 1: Explanation Level
    <div key="explanation" className="space-y-6">
      <div className="text-center">
        <Lightbulb className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900">How do you like explanations?</h2>
        <p className="text-gray-500 text-sm mt-1">We&apos;ll adapt to your style</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {EXPLANATION_OPTIONS.map(option => (
          <button
            key={option.value}
            onClick={() => { updateData('preferred_explanation_level', option.value); nextStep(); }}
            className={`p-4 rounded-lg border-2 text-left transition ${
              data.preferred_explanation_level === option.value
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="text-2xl">{option.icon}</span>
            <div className="font-medium mt-2 text-gray-900">{option.label}</div>
            <div className="text-sm text-gray-500">{option.description}</div>
          </button>
        ))}
      </div>
    </div>,

    // Step 2: Learning Style
    <div key="style" className="space-y-6">
      <div className="text-center">
        <Brain className="w-12 h-12 text-blue-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900">What helps you learn best?</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {STYLE_OPTIONS.map(option => (
          <button
            key={option.value}
            onClick={() => { updateData('learning_style', option.value); nextStep(); }}
            className={`p-4 rounded-lg border-2 text-left transition ${
              data.learning_style === option.value
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="text-2xl">{option.icon}</span>
            <div className="font-medium mt-2 text-gray-900">{option.label}</div>
            <div className="text-sm text-gray-500">{option.description}</div>
          </button>
        ))}
      </div>
    </div>,

    // Step 3: Difficulty
    <div key="difficulty" className="space-y-6">
      <div className="text-center">
        <Zap className="w-12 h-12 text-orange-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900">What&apos;s your current level?</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {DIFFICULTY_OPTIONS.map(option => (
          <button
            key={option.value}
            onClick={() => { updateData('difficulty_preference', option.value); nextStep(); }}
            className={`p-4 rounded-lg border-2 text-center transition ${
              data.difficulty_preference === option.value
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="text-3xl">{option.icon}</span>
            <div className="font-medium mt-2 text-gray-900">{option.label}</div>
            <div className="text-sm text-gray-500">{option.description}</div>
          </button>
        ))}
      </div>
    </div>,

    // Step 4: Session Duration
    <div key="duration" className="space-y-6">
      <div className="text-center">
        <Clock className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900">How long do you like sessions?</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-5">
        {SESSION_OPTIONS.map(option => (
          <button
            key={option.value}
            onClick={() => { updateData('session_duration_minutes', option.value); nextStep(); }}
            className={`p-3 rounded-lg border-2 text-center transition ${
              data.session_duration_minutes === option.value
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="text-xl">{option.icon}</span>
            <div className="font-medium text-sm mt-1 text-gray-900">{option.label}</div>
          </button>
        ))}
      </div>
    </div>,

    // Step 5: Topics
    <div key="topics" className="space-y-6">
      <div className="text-center">
        <BookOpen className="w-12 h-12 text-purple-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900">What do you want to learn?</h2>
        <p className="text-gray-500 text-sm">Pick a few to get started</p>
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {TOPIC_SUGGESTIONS.map(topic => (
          <button
            key={topic}
            onClick={() => toggleTopic(topic)}
            className={`px-4 py-2 rounded-full border transition ${
              data.topics_of_interest.includes(topic)
                ? 'bg-orange-500 text-white border-orange-500'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
            }`}
          >
            {topic}
          </button>
        ))}
      </div>
      <div className="flex gap-2 max-w-md mx-auto">
        <input
          type="text"
          value={customTopic}
          onChange={e => setCustomTopic(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addCustomTopic()}
          placeholder="Add something else..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <button
          onClick={addCustomTopic}
          disabled={!customTopic.trim()}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
        >
          Add
        </button>
      </div>
      <button
        onClick={savePreferences}
        disabled={loading}
        className="block mx-auto px-8 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition font-medium"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Start Learning →'}
      </button>
    </div>,
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full border border-gray-100">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition ${
                i <= step ? 'bg-orange-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        {steps[step]}
      </div>
    </div>
  );
}
