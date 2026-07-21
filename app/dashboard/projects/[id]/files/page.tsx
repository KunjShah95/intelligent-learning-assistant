'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { FileText, Upload, Trash2, ExternalLink } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { getIdToken } from '@/lib/auth-client';

export default function ProjectFilesPage() {
  const params = useParams();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

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

  const fetchFiles = async () => {
    try {
      const res = await authFetch(`/api/projects/${params.id}/files`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      } else {
        console.error('Failed to load files:', res.status);
      }
    } catch (err) {
      console.error('Failed to load files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFiles(); }, [params.id]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = await getIdToken();
      if (!token) throw new Error('Not authenticated');
      const res = await fetch(`/api/projects/${params.id}/files`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setFiles(prev => [data.file, ...prev]);
      } else {
        const errData = await res.json().catch(() => null);
        console.error('Upload failed:', res.status, errData);
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('Delete this file?')) return;
    try {
      const token = await getIdToken();
      if (!token) throw new Error('Not authenticated');
      const res = await fetch(`/api/projects/${params.id}/files/${fileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setFiles(prev => prev.filter(f => f.id !== fileId));
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('json')) return '📋';
    if (type.includes('csv')) return '📊';
    if (type.includes('markdown') || type.includes('md')) return '📝';
    return '📄';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Files</h2>
        <label className="flex items-center gap-1 px-3 py-1.5 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition cursor-pointer">
          <Upload className="w-4 h-4" />
          {uploading ? 'Uploading...' : 'Upload File'}
          <input
            type="file"
            className="hidden"
            onChange={handleUpload}
            accept=".txt,.pdf,.md,.json,.csv"
            disabled={uploading}
          />
        </label>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="h-5 w-48 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No files yet</h3>
          <p className="text-gray-500 mb-6">Upload a file to use it in your agent prompts</p>
          <label className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition cursor-pointer inline-block">
            Upload File
            <input
              type="file"
              className="hidden"
              onChange={handleUpload}
              accept=".txt,.pdf,.md,.json,.csv"
              disabled={uploading}
            />
          </label>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((file: any) => (
            <div key={file.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between hover:border-gray-300 transition">
              <div className="flex items-center gap-3">
                <span className="text-xl">{getFileIcon(file.fileType)}</span>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{file.fileName}</p>
                  <p className="text-xs text-gray-500">
                    {(file.fileSize / 1024).toFixed(1)} KB &middot; {formatRelativeTime(file.uploadedAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {file.openaiFileId && (
                  <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">OpenAI</span>
                )}
                <button
                  onClick={() => handleDelete(file.id)}
                  className="text-gray-400 hover:text-red-500 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
