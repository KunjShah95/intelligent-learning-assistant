import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type DateInput =
  | Date
  | string
  | number
  | null
  | undefined
  | { seconds?: number; _seconds?: number; toDate?: () => Date };

/**
 * Coerce the many shapes a timestamp can arrive as into a Date.
 * Firestore admin serverTimestamp() serializes over JSON as
 * { _seconds, _nanoseconds } (or { seconds, nanoseconds }), which is
 * neither a Date nor a string — calling .getTime() on it throws.
 * Returns null when the value can't be parsed into a valid date.
 */
export function toDate(value: DateInput): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === 'object') {
    if (typeof value.toDate === 'function') {
      const d = value.toDate();
      return isNaN(d.getTime()) ? null : d;
    }
    const seconds = value._seconds ?? value.seconds;
    if (typeof seconds === 'number') return new Date(seconds * 1000);
  }
  return null;
}

export function formatDate(date: DateInput): string {
  const d = toDate(date);
  if (!d) return '';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatRelativeTime(date: DateInput): string {
  const d = toDate(date);
  if (!d) return '';
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}