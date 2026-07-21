'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trash2, AlertTriangle } from 'lucide-react';
import { AgentForm } from '@/components/agents/agent-form';
import { onAuthChange, getIdToken } from '@/lib/auth-client';

export default function AgentSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (!user) { router.push('/sign-in'); return; }
      try {
        const token = await getIdToken();
        if (!token) return;
        const res = await fetch(`/api/projects/${params.id}/agents/${params.aid}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAgent(data.agent);
        }
      } catch (err) {
        console.error('Failed to load agent:', err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [params.id, params.aid]);

  const handleUpdate = async (data: any) => {
    const token = await getIdToken();
    if (!token) return;
    const res = await fetch(`/api/projects/${params.id}/agents/${params.aid}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      router.push(`/dashboard/projects/${params.id}/agents/${params.aid}`);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const token = await getIdToken();
      if (!token) return;
      const res = await fetch(`/api/projects/${params.id}/agents/${params.aid}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        router.push(`/dashboard/projects/${params.id}`);
      }
    } catch (err) {
      console.error('Failed to delete agent:', err);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-16rem)]">
        <div className="text-center text-gray-500">
          <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4" />
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-gray-500">Agent not found</p>
        <Link href={`/dashboard/projects/${params.id}`} className="text-violet-600 hover:underline mt-2 inline-block">
          Back to project
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href={`/dashboard/projects/${params.id}/agents/${params.aid}`}
        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to chat
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Agent Settings</h1>

      <AgentForm
        open={true}
        onClose={() => router.push(`/dashboard/projects/${params.id}/agents/${params.aid}`)}
        onSubmit={handleUpdate}
        initial={agent}
      />

      <div className="mt-8 pt-6 border-t border-gray-200">
        {showDeleteConfirm ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
              <AlertTriangle className="w-4 h-4" />
              Delete this agent?
            </div>
            <p className="text-sm text-red-600 mb-4">
              This will permanently delete {agent.name} and all its chat history. This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
              >
                {deleting ? 'Deleting...' : 'Yes, delete permanently'}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <Trash2 className="w-4 h-4" />
            Delete Agent
          </button>
        )}
      </div>
    </div>
  );
}
