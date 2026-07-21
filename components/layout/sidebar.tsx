'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  MessageCircle,
  CheckSquare,
  BarChart3,
  Map,
  Settings,
  FolderKanban,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'My Projects', icon: FolderKanban },
  { href: '/dashboard/chat', label: 'Quick Chat', icon: MessageCircle },
  { href: '/dashboard/quiz', label: 'Practice', icon: CheckSquare },
  { href: '/dashboard/progress', label: 'Progress', icon: BarChart3 },
  { href: '/dashboard/learning-path', label: 'Learning Path', icon: Map },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname.startsWith('/dashboard/projects');
    }
    return pathname === href;
  };

  return (
    <aside className="hidden w-64 shrink-0 bg-white border-r border-gray-200 p-4 lg:flex lg:flex-col">
      <div className="mb-8 px-2">
        <Link href="/dashboard" className="text-xl font-bold text-violet-600 hover:text-violet-700 transition">
          LearnAI
        </Link>
        <p className="text-xs text-gray-400 mt-0.5">AI Learning Platform</p>
      </div>
      <nav className="space-y-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg transition text-sm',
                active
                  ? 'bg-violet-50 text-violet-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className={cn('w-5 h-5', active ? 'text-violet-600' : 'text-gray-400')} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
