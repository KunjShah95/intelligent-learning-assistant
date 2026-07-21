'use client';

import Link from 'next/link';
import { FolderOpen, Bot, FileText } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

interface ProjectCardProps {
  project: { id: string; name: string; description: string; createdAt: Date };
  agentCount?: number;
  fileCount?: number;
}

export function ProjectCard({ project, agentCount = 0, fileCount = 0 }: ProjectCardProps) {
  return (
    <Link
      href={`/dashboard/projects/${project.id}`}
      className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center group-hover:bg-violet-200 transition-colors">
          <FolderOpen className="w-5 h-5 text-violet-600" />
        </div>
      </div>
      <h3 className="font-semibold text-gray-900 mb-1 truncate">{project.name}</h3>
      {project.description && (
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{project.description}</p>
      )}
      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1"><Bot className="w-3 h-3" />{agentCount} agents</span>
        <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{fileCount} files</span>
        <span>{formatRelativeTime(project.createdAt)}</span>
      </div>
    </Link>
  );
}
