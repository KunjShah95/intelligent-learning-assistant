'use client';

import Link from 'next/link';
import { Bot, MessageCircle, Settings } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

interface AgentCardProps {
  agent: { id: string; name: string; description: string; modelName: string; createdAt: Date };
  projectId: string;
}

export function AgentCard({ agent, projectId }: AgentCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition group">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
          <Bot className="w-5 h-5 text-emerald-600" />
        </div>
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">{agent.name}</h3>
      {agent.description && <p className="text-sm text-gray-500 mb-3 line-clamp-2">{agent.description}</p>}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{agent.modelName}</span>
        <span className="text-xs text-gray-400">{formatRelativeTime(agent.createdAt)}</span>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href={`/dashboard/projects/${projectId}/agents/${agent.id}`}
          className="flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700 font-medium transition"
        >
          <MessageCircle className="w-4 h-4" /> Chat
        </Link>
        <Link
          href={`/dashboard/projects/${projectId}/agents/${agent.id}/settings`}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition"
        >
          <Settings className="w-4 h-4" /> Settings
        </Link>
      </div>
    </div>
  );
}
