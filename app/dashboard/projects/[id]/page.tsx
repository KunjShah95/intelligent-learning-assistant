'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Plus, Bot } from 'lucide-react';
import { getIdToken } from '@/lib/auth-client';
import { AgentCard } from '@/components/agents/agent-card';
import { AgentForm } from '@/components/agents/agent-form';

export default function ProjectDetailPage() {
  const params = useParams();
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

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

  const fetchAgents = async () => {
    try {
      const res = await authFetch(`/api/projects/${params.id}/agents`);
      if (res.ok) {
        const data = await res.json();
        setAgents(data.agents || []);
      }
    } catch (err) {
      console.error('Failed to load agents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAgents(); }, [params.id]);

  const handleCreate = async (data: any) => {
    const res = await authFetch(`/api/projects/${params.id}/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const { agent } = await res.json();
      setAgents(prev => [agent, ...prev]);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Agents</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition"
        >
          <Plus className="w-4 h-4" /> New Agent
        </button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="w-10 h-10 bg-gray-100 rounded-lg mb-3 animate-pulse" />
              <div className="h-5 w-32 bg-gray-100 rounded mb-2 animate-pulse" />
              <div className="h-4 w-full bg-gray-50 rounded mb-1 animate-pulse" />
              <div className="h-4 w-3/4 bg-gray-50 rounded mb-3 animate-pulse" />
              <div className="h-5 w-20 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bot className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No agents yet</h3>
          <p className="text-gray-500 mb-6">Create your first agent with a custom prompt and model</p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition"
          >
            Create Agent
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map(agent => (
            <AgentCard key={agent.id} agent={agent} projectId={params.id as string} />
          ))}
        </div>
      )}

      <AgentForm open={showCreate} onClose={() => setShowCreate(false)} onSubmit={handleCreate} />
    </div>
  );
}
