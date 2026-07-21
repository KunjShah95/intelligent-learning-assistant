'use client';

import { useEffect, useState } from 'react';
import { Plus, FolderKanban } from 'lucide-react';
import { onAuthChange, getIdToken } from '@/lib/auth-client';
import { ProjectCard } from '@/components/projects/project-card';
import { CreateProjectDialog } from '@/components/projects/create-project-dialog';

export default function DashboardPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      if (!user) { window.location.href = '/sign-in'; return; }
      fetchProjects();
    });
    return () => unsubscribe();
  }, []);

  const authFetch = async (url: string, options: RequestInit = {}) => {
    const token = await getIdToken();
    if (!token) throw new Error('Not authenticated');
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  };

  const fetchProjects = async () => {
    try {
      const res = await authFetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: { name: string; description: string }) => {
    const res = await authFetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      const detail =
        res.status === 401
          ? 'Not authorized — the server could not verify your session (check Firebase admin credentials).'
          : errData?.error || `Request failed (${res.status})`;
      throw new Error(detail);
    }
    const { project } = await res.json();
    setProjects(prev => [project, ...prev]);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
          <p className="text-gray-600 mt-1">Create and manage your AI agents</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="w-10 h-10 bg-gray-100 rounded-lg mb-3 animate-pulse" />
              <div className="h-5 w-40 bg-gray-100 rounded mb-2 animate-pulse" />
              <div className="h-4 w-full bg-gray-50 rounded mb-1 animate-pulse" />
              <div className="h-4 w-3/4 bg-gray-50 rounded mb-3 animate-pulse" />
              <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderKanban className="w-8 h-8 text-violet-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Create your first project</h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Projects contain agents with custom prompts, model settings, and files. Build your own AI assistant.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition shadow-sm"
          >
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <CreateProjectDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
