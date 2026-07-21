'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ArrowLeft, Bot, FileText, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { onAuthChange, getIdToken } from '@/lib/auth-client';

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const fetchProject = async () => {
    try {
      const res = await authFetch(`/api/projects/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data.project);
      }
    } catch (err) {
      console.error('Failed to load project:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (!user) { router.push('/sign-in'); return; }
      fetchProject();
    });
    return () => unsubscribe();
  }, [params.id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await authFetch(`/api/projects/${params.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.push('/dashboard');
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete project');
      }
    } catch (err) {
      console.error('Delete failed:', err);
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const tabs = [
    { href: `/dashboard/projects/${params.id}`, label: 'Agents', icon: Bot },
    { href: `/dashboard/projects/${params.id}/files`, label: 'Files', icon: FileText },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to projects
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {loading ? (
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            ) : (
              <>
                <h1 className="text-2xl font-bold text-gray-900 truncate">{project?.name || 'Project'}</h1>
                {project?.description && <p className="text-gray-600 mt-1">{project.description}</p>}
              </>
            )}
          </div>
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition shrink-0"
            title="Delete project"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition',
                isActive
                  ? 'border-violet-600 text-violet-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </Link>
          );
        })}
      </div>

      {children}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Delete Project</h2>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-700">
                You are about to delete <strong>{project?.name || 'this project'}</strong>. This will permanently remove:
              </p>
              <ul className="text-sm text-red-600 mt-2 space-y-1 list-disc list-inside">
                <li>All AI agents in this project</li>
                <li>All chat history with those agents</li>
                <li>All uploaded files</li>
              </ul>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteDialog(false)}
                disabled={deleting}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Project
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
