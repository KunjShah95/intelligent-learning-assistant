'use client';

import { useEffect, useState } from 'react';
import type { UserProgress } from '@/lib/types';

export function useProgress() {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchProgress() {
      try {
        const response = await fetch('/api/progress');

        if (!response.ok) {
          throw new Error('Failed to load progress');
        }

        const data: UserProgress = await response.json();

        if (isMounted) {
          setProgress(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load progress');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchProgress();

    return () => {
      isMounted = false;
    };
  }, []);

  return { progress, isLoading, error };
}
