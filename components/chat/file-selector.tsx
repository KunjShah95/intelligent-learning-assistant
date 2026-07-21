'use client';

import { useEffect, useState, useRef } from 'react';
import { FileText, Check, ChevronDown, Paperclip, X, FileJson, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getIdToken } from '@/lib/auth-client';

interface ProjectFileInfo {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  content?: string;
}

interface SelectedFile {
  id: string;
  fileName: string;
}

interface FileSelectorProps {
  projectId: string;
  selectedFiles: SelectedFile[];
  onSelectionChange: (files: SelectedFile[]) => void;
}

export function FileSelector({ projectId, selectedFiles, onSelectionChange }: FileSelectorProps) {
  const [files, setFiles] = useState<ProjectFileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const token = await getIdToken();
        if (!token) { setLoading(false); return; }
        const res = await fetch(`/api/projects/${projectId}/files`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setFiles(data.files || []);
        }
      } catch (err) {
        console.error('Failed to load files:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFiles();
  }, [projectId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleFile = (file: ProjectFileInfo) => {
    const isSelected = selectedFiles.some(f => f.id === file.id);
    if (isSelected) {
      onSelectionChange(selectedFiles.filter(f => f.id !== file.id));
    } else {
      onSelectionChange([...selectedFiles, { id: file.id, fileName: file.fileName }]);
    }
  };

  const getFileIcon = (type: string, name: string) => {
    if (name.match(/\.json$/i)) return <FileJson className="w-4 h-4" />;
    if (name.match(/\.csv$/i)) return <FileSpreadsheet className="w-4 h-4" />;
    if (name.match(/\.(md|txt)$/i)) return <FileText className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const selectedCount = selectedFiles.length;
  const hasContent = (file: ProjectFileInfo) => !!file.content;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition shrink-0',
          selectedCount > 0
            ? 'bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100'
            : 'bg-white border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300'
        )}
        title={selectedCount > 0 ? `${selectedCount} file(s) selected` : 'Attach files'}
      >
        <Paperclip className="w-4 h-4" />
        {selectedCount > 0 && (
          <span className="text-xs font-medium tabular-nums">{selectedCount}</span>
        )}
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 max-h-80 overflow-y-auto">
          <div className="px-3 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wide">
            Project Files
          </div>

          {loading ? (
            <div className="px-4 py-3 space-y-2">
              {[1, 2].map(i => (
                <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : files.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-500">No files uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {files.map(file => {
                const isSelected = selectedFiles.some(f => f.id === file.id);
                const canUse = hasContent(file);
                return (
                  <button
                    key={file.id}
                    onClick={() => canUse && toggleFile(file)}
                    disabled={!canUse}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 text-sm transition',
                      isSelected
                        ? 'bg-violet-50 text-violet-700'
                        : canUse
                          ? 'text-gray-700 hover:bg-gray-50'
                          : 'text-gray-400 cursor-not-allowed'
                    )}
                    title={!canUse ? 'File content not available (binary or unsupported format)' : file.fileName}
                  >
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                      isSelected ? 'bg-violet-100' : 'bg-gray-100'
                    )}>
                      {getFileIcon(file.fileType, file.fileName)}
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="text-sm truncate font-medium">{file.fileName}</p>
                      <p className="text-xs text-gray-400">{formatSize(file.fileSize)}</p>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-violet-600 shrink-0" />
                    )}
                    {!canUse && (
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">N/A</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {selectedCount > 0 && (
            <div className="border-t border-gray-100 mt-1 pt-1 px-2">
              <button
                onClick={() => onSelectionChange([])}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <X className="w-4 h-4" />
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
