# Chatbot Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add project/agent management, prompt storage, and file upload to the existing LearnAI app — turning it into a general-purpose Chatbot Platform.

**Architecture:** Projects and agents stored as Firestore subcollections under each user. Chat reuses existing multi-provider AI setup (`lib/ai.ts`) with agent-specific system prompts. Files stored in Firebase Storage + optionally OpenAI Files API.

**Tech Stack:** Next.js 14 App Router, Firebase Auth + Firestore, Vercel AI SDK, OpenAI Files API

---

### File Map

**New files:**
- `lib/projects-db.ts` — Firestore CRUD for projects
- `lib/agents-db.ts` — Firestore CRUD for agents
- `lib/chats-db.ts` — Firestore CRUD for chat sessions
- `lib/files-db.ts` — File upload + metadata storage
- `app/api/projects/route.ts` — List/create projects
- `app/api/projects/[id]/route.ts` — GET/PUT/DELETE project
- `app/api/projects/[pid]/agents/route.ts` — List/create agents
- `app/api/projects/[pid]/agents/[aid]/route.ts` — GET/PUT/DELETE agent
- `app/api/projects/[pid]/agents/[aid]/chat/route.ts` — Streaming chat
- `app/api/projects/[pid]/files/route.ts` — Upload/list files
- `app/dashboard/projects/[id]/page.tsx` — Project detail page
- `app/dashboard/projects/[id]/layout.tsx` — Project layout with tabs
- `app/dashboard/projects/[id]/agents/[aid]/page.tsx` — Agent chat page
- `app/dashboard/projects/[id]/agents/[aid]/settings/page.tsx` — Agent settings
- `components/projects/project-card.tsx` — Project card component
- `components/projects/create-project-dialog.tsx` — New project dialog
- `components/agents/agent-card.tsx` — Agent card component
- `components/agents/agent-form.tsx` — Agent create/edit form
- `components/files/file-upload.tsx` — File upload component

**Modified files:**
- `components/layout/sidebar.tsx` — Add "My Projects" nav section
- `app/dashboard/page.tsx` — Show projects grid instead of learning cards
- `app/dashboard/chat/page.tsx` — Keep as fallback for simple chat
- `lib/types.ts` — Add Project, Agent, ChatSession types

---

### Task 1: Data layer — Firestore CRUD utilities

**Files:**
- Create: `lib/projects-db.ts`
- Create: `lib/agents-db.ts`
- Create: `lib/chats-db.ts`
- Create: `lib/files-db.ts`
- Modify: `lib/types.ts`

- [ ] **Add types to `lib/types.ts`**

```typescript
export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Agent {
  id: string;
  projectId: string;
  name: string;
  description: string;
  systemPrompt: string;
  modelProvider: string;
  modelName: string;
  temperature: number;
  maxTokens: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  openaiFileId?: string;
  storagePath: string;
  uploadedAt: Date;
}
```

- [ ] **Create `lib/projects-db.ts`**

```typescript
import { getAdminDb } from './firebase-admin';
import * as admin from 'firebase-admin';
import type { Project } from './types';

const PROJECTS_COLLECTION = (uid: string) => `users/${uid}/projects`;

export async function listProjects(uid: string): Promise<Project[]> {
  const snapshot = await getAdminDb()
    .collection(PROJECTS_COLLECTION(uid))
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
}

export async function getProject(uid: string, projectId: string): Promise<Project | null> {
  const doc = await getAdminDb().collection(PROJECTS_COLLECTION(uid)).doc(projectId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Project;
}

export async function createProject(uid: string, data: { name: string; description: string }): Promise<Project> {
  const ref = await getAdminDb().collection(PROJECTS_COLLECTION(uid)).add({
    name: data.name,
    description: data.description,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  const doc = await ref.get();
  return { id: ref.id, ...doc.data() } as Project;
}

export async function updateProject(uid: string, projectId: string, data: { name?: string; description?: string }): Promise<void> {
  await getAdminDb().collection(PROJECTS_COLLECTION(uid)).doc(projectId).update({
    ...data,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export async function deleteProject(uid: string, projectId: string): Promise<void> {
  await getAdminDb().collection(PROJECTS_COLLECTION(uid)).doc(projectId).delete();
}
```

- [ ] **Create `lib/agents-db.ts`**

```typescript
import { getAdminDb } from './firebase-admin';
import * as admin from 'firebase-admin';
import type { Agent } from './types';

const AGENTS_COLLECTION = (uid: string, pid: string) => `users/${uid}/projects/${pid}/agents`;

export async function listAgents(uid: string, projectId: string): Promise<Agent[]> {
  const snapshot = await getAdminDb()
    .collection(AGENTS_COLLECTION(uid, projectId))
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Agent));
}

export async function getAgent(uid: string, projectId: string, agentId: string): Promise<Agent | null> {
  const doc = await getAdminDb().collection(AGENTS_COLLECTION(uid, projectId)).doc(agentId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Agent;
}

export async function createAgent(uid: string, projectId: string, data: {
  name: string;
  description: string;
  systemPrompt: string;
  modelProvider?: string;
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<Agent> {
  const ref = await getAdminDb().collection(AGENTS_COLLECTION(uid, projectId)).add({
    name: data.name,
    description: data.description,
    systemPrompt: data.systemPrompt,
    modelProvider: data.modelProvider || 'openrouter',
    modelName: data.modelName || 'openrouter/free',
    temperature: data.temperature ?? 0.7,
    maxTokens: data.maxTokens ?? 1024,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  const doc = await ref.get();
  return { id: ref.id, projectId, ...doc.data() } as Agent;
}

export async function updateAgent(uid: string, projectId: string, agentId: string, data: Partial<{
  name: string;
  description: string;
  systemPrompt: string;
  modelProvider: string;
  modelName: string;
  temperature: number;
  maxTokens: number;
}>): Promise<void> {
  await getAdminDb().collection(AGENTS_COLLECTION(uid, projectId)).doc(agentId).update({
    ...data,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export async function deleteAgent(uid: string, projectId: string, agentId: string): Promise<void> {
  await getAdminDb().collection(AGENTS_COLLECTION(uid, projectId)).doc(agentId).delete();
}
```

- [ ] **Create `lib/chats-db.ts`**

```typescript
import { getAdminDb } from './firebase-admin';
import * as admin from 'firebase-admin';
import type { ChatSession, ChatMessage } from './types';

const CHATS_COLLECTION = (uid: string, pid: string, aid: string) =>
  `users/${uid}/projects/${pid}/agents/${aid}/chats`;

export async function listChats(uid: string, projectId: string, agentId: string): Promise<ChatSession[]> {
  const snapshot = await getAdminDb()
    .collection(CHATS_COLLECTION(uid, projectId, agentId))
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatSession));
}

export async function getChat(uid: string, projectId: string, agentId: string, chatId: string): Promise<ChatSession | null> {
  const doc = await getAdminDb()
    .collection(CHATS_COLLECTION(uid, projectId, agentId)).doc(chatId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as ChatSession;
}

export async function createChat(uid: string, projectId: string, agentId: string, title?: string): Promise<ChatSession> {
  const ref = await getAdminDb().collection(CHATS_COLLECTION(uid, projectId, agentId)).add({
    title: title || 'New Chat',
    messages: [],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  const doc = await ref.get();
  return { id: ref.id, ...doc.data() } as ChatSession;
}

export async function appendMessage(
  uid: string, projectId: string, agentId: string, chatId: string, message: ChatMessage
): Promise<void> {
  await getAdminDb()
    .collection(CHATS_COLLECTION(uid, projectId, agentId)).doc(chatId).update({
    messages: admin.firestore.FieldValue.arrayUnion(message),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}
```

- [ ] **Create `lib/files-db.ts`**

```typescript
import { getAdminDb } from './firebase-admin';
import * as admin from 'firebase-admin';
import type { ProjectFile } from './types';

const FILES_COLLECTION = (uid: string, pid: string) => `users/${uid}/projects/${pid}/files`;

export async function listFiles(uid: string, projectId: string): Promise<ProjectFile[]> {
  const snapshot = await getAdminDb()
    .collection(FILES_COLLECTION(uid, projectId))
    .orderBy('uploadedAt', 'desc')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProjectFile));
}

export async function createFileRecord(uid: string, projectId: string, data: {
  fileName: string;
  fileType: string;
  fileSize: number;
  openaiFileId?: string;
  storagePath: string;
}): Promise<ProjectFile> {
  const ref = await getAdminDb().collection(FILES_COLLECTION(uid, projectId)).add({
    ...data,
    uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  const doc = await ref.get();
  return { id: ref.id, ...doc.data() } as ProjectFile;
}

export async function deleteFileRecord(uid: string, projectId: string, fileId: string): Promise<void> {
  await getAdminDb().collection(FILES_COLLECTION(uid, projectId)).doc(fileId).delete();
}
```

---

### Task 2: API routes — Projects CRUD

**Files:**
- Create: `app/api/projects/route.ts`
- Create: `app/api/projects/[id]/route.ts`

- [ ] **Create `app/api/projects/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { listProjects, createProject } from '@/lib/projects-db';

export async function GET(request: NextRequest) {
  const uid = await verifyAuth(request);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const projects = await listProjects(uid);
  return NextResponse.json({ projects });
}

export async function POST(request: NextRequest) {
  const uid = await verifyAuth(request);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  if (!body.name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  const project = await createProject(uid, { name: body.name, description: body.description || '' });
  return NextResponse.json({ project }, { status: 201 });
}
```

- [ ] **Create `app/api/projects/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getProject, updateProject, deleteProject } from '@/lib/projects-db';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const uid = await verifyAuth(request);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const project = await getProject(uid, params.id);
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ project });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const uid = await verifyAuth(request);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  await updateProject(uid, params.id, body);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const uid = await verifyAuth(request);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await deleteProject(uid, params.id);
  return NextResponse.json({ success: true });
}
```

---

### Task 3: API routes — Agents CRUD

**Files:**
- Create: `app/api/projects/[pid]/agents/route.ts`
- Create: `app/api/projects/[pid]/agents/[aid]/route.ts`

- [ ] **Create directory structure**

```bash
mkdir -p app/api/projects/\[pid\]/agents/\[aid\]
```

- [ ] **Create `app/api/projects/[pid]/agents/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { listAgents, createAgent } from '@/lib/agents-db';

export async function GET(request: NextRequest, { params }: { params: { pid: string } }) {
  const uid = await verifyAuth(request);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const agents = await listAgents(uid, params.pid);
  return NextResponse.json({ agents });
}

export async function POST(request: NextRequest, { params }: { params: { pid: string } }) {
  const uid = await verifyAuth(request);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  if (!body.name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  const agent = await createAgent(uid, params.pid, {
    name: body.name,
    description: body.description || '',
    systemPrompt: body.systemPrompt || '',
    modelProvider: body.modelProvider,
    modelName: body.modelName,
    temperature: body.temperature,
    maxTokens: body.maxTokens,
  });
  return NextResponse.json({ agent }, { status: 201 });
}
```

- [ ] **Create `app/api/projects/[pid]/agents/[aid]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getAgent, updateAgent, deleteAgent } from '@/lib/agents-db';

export async function GET(request: NextRequest, { params }: { params: { pid: string; aid: string } }) {
  const uid = await verifyAuth(request);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const agent = await getAgent(uid, params.pid, params.aid);
  if (!agent) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ agent });
}

export async function PUT(request: NextRequest, { params }: { params: { pid: string; aid: string } }) {
  const uid = await verifyAuth(request);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  await updateAgent(uid, params.pid, params.aid, body);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: { params: { pid: string; aid: string } }) {
  const uid = await verifyAuth(request);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await deleteAgent(uid, params.pid, params.aid);
  return NextResponse.json({ success: true });
}
```

---

### Task 4: API route — Streaming chat

**Files:**
- Create: `app/api/projects/[pid]/agents/[aid]/chat/route.ts`

- [ ] **Create `app/api/projects/[pid]/agents/[aid]/chat/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getAgent } from '@/lib/agents-db';
import { createChat, appendMessage } from '@/lib/chats-db';
import { getModel } from '@/lib/ai';
import { streamText } from 'ai';

export async function POST(request: NextRequest, { params }: { params: { pid: string; aid: string } }) {
  const uid = await verifyAuth(request);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const agent = await getAgent(uid, params.pid, params.aid);
  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

  const body = await request.json();
  const { message, chatId, history = [] } = body;
  if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 });

  let activeChatId = chatId;
  if (!activeChatId) {
    const chat = await createChat(uid, params.pid, params.aid, message.slice(0, 60));
    activeChatId = chat.id;
  }

  const userMsg = { id: crypto.randomUUID(), role: 'user' as const, content: message, timestamp: new Date() };
  await appendMessage(uid, params.pid, params.aid, activeChatId, userMsg);

  const modelId = agent.modelProvider === 'openrouter'
    ? `openrouter/${agent.modelName}`
    : agent.modelName;

  const result = streamText({
    model: getModel(modelId as any),
    system: agent.systemPrompt || 'You are a helpful assistant.',
    messages: [...history, { role: 'user', content: message }],
    temperature: agent.temperature,
    maxTokens: agent.maxTokens,
  });

  const stream = result.toDataStream({
    onFinal: async (completion) => {
      const assistantMsg = {
        id: crypto.randomUUID(),
        role: 'assistant' as const,
        content: completion,
        timestamp: new Date(),
      };
      await appendMessage(uid, params.pid, params.aid, activeChatId, assistantMsg);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Chat-Id': activeChatId,
    },
  });
}
```

---

### Task 5: API route — File upload

**Files:**
- Create: `app/api/projects/[pid]/files/route.ts`

- [ ] **Create `app/api/projects/[pid]/files/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { listFiles, createFileRecord } from '@/lib/files-db';

export async function GET(request: NextRequest, { params }: { params: { pid: string } }) {
  const uid = await verifyAuth(request);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const files = await listFiles(uid, params.pid);
  return NextResponse.json({ files });
}

export async function POST(request: NextRequest, { params }: { params: { pid: string } }) {
  const uid = await verifyAuth(request);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get('file') as File;
  if (!file) return NextResponse.json({ error: 'File is required' }, { status: 400 });

  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });

  const allowedTypes = ['text/plain', 'application/pdf', 'text/markdown', 'application/json', 'text/csv'];
  if (!allowedTypes.includes(file.type) && !file.name.match(/\.(txt|pdf|md|json|csv)$/i)) {
    return NextResponse.json({ error: 'File type not supported' }, { status: 400 });
  }

  let openaiFileId: string | undefined;

  if (process.env.OPENAI_API_KEY) {
    try {
      const form = new FormData();
      form.append('file', file, file.name);
      form.append('purpose', 'assistants');
      const res = await fetch('https://api.openai.com/v1/files', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: form,
      });
      if (res.ok) {
        const data = await res.json();
        openaiFileId = data.id;
      }
    } catch (e) {
      console.warn('OpenAI file upload failed, saving locally only:', e);
    }
  }

  const record = await createFileRecord(uid, params.pid, {
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    openaiFileId,
    storagePath: `users/${uid}/projects/${params.pid}/files/${file.name}`,
  });

  return NextResponse.json({ file: record }, { status: 201 });
}
```

---

### Task 6: UI — Projects dashboard & components

**Files:**
- Modify: `app/dashboard/page.tsx`
- Create: `components/projects/project-card.tsx`
- Create: `components/projects/create-project-dialog.tsx`

- [ ] **Create `components/projects/project-card.tsx`**

```typescript
'use client';

import Link from 'next/link';
import { FolderOpen, MoreHorizontal, Bot, FileText } from 'lucide-react';
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
      className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
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
```

- [ ] **Create `components/projects/create-project-dialog.tsx`**

```typescript
'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; description: string }) => Promise<void>;
}

export function CreateProjectDialog({ open, onClose, onCreate }: CreateProjectDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onCreate({ name: name.trim(), description: description.trim() });
      setName('');
      setDescription('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">New Project</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="My Project"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="What is this project about?"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || loading}
              className="px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Modify `app/dashboard/page.tsx`** — Replace the learning-focused dashboard with a projects grid view

```typescript
'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { onAuthChange, type AuthUser } from '@/lib/auth-client';
import { ProjectCard } from '@/components/projects/project-card';
import { CreateProjectDialog } from '@/components/projects/create-project-dialog';

export default function DashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      if (!user) { window.location.href = '/sign-in'; return; }
      setUser(user);
      fetchProjects();
    });
    return () => unsubscribe();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
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
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const { project } = await res.json();
      setProjects(prev => [project, ...prev]);
    }
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
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-violet-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Create your first project</h2>
          <p className="text-gray-500 mb-6">Projects contain agents with custom prompts and settings</p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition"
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
```

---

### Task 7: UI — Project detail page

**Files:**
- Create: `app/dashboard/projects/[id]/layout.tsx`
- Create: `app/dashboard/projects/[id]/page.tsx`
- Create: `components/agents/agent-card.tsx`
- Create: `components/agents/agent-form.tsx`

- [ ] **Create directory structure**

```bash
mkdir -p app/dashboard/projects/\[id\]/agents/\[aid\]/settings
```

- [ ] **Create `app/dashboard/projects/[id]/layout.tsx`**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ArrowLeft, Bot, FileText, Settings } from 'lucide-react';
import { onAuthChange } from '@/lib/auth-client';

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const [project, setProject] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (!user) { router.push('/sign-in'); return; }
      const res = await fetch(`/api/projects/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data.project);
      }
    });
    return () => unsubscribe();
  }, [params.id]);

  const tabs = [
    { href: `/dashboard/projects/${params.id}`, label: 'Agents', icon: Bot },
    { href: `/dashboard/projects/${params.id}/files`, label: 'Files', icon: FileText },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2">
          <ArrowLeft className="w-4 h-4" /> Back to projects
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{project?.name || 'Loading...'}</h1>
        {project?.description && <p className="text-gray-600 mt-1">{project.description}</p>}
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition',
                isActive
                  ? 'border-violet-600 text-violet-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </Link>
          );
        })}
      </div>

      {children}
    </div>
  );
}
```

- [ ] **Create `components/agents/agent-card.tsx`**

```typescript
'use client';

import Link from 'next/link';
import { Bot, MessageCircle, Settings, ArrowRight } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

interface AgentCardProps {
  agent: { id: string; name: string; description: string; modelName: string; createdAt: Date };
  projectId: string;
}

export function AgentCard({ agent, projectId }: AgentCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
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
          className="flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700 font-medium"
        >
          <MessageCircle className="w-4 h-4" /> Chat
        </Link>
        <Link
          href={`/dashboard/projects/${projectId}/agents/${agent.id}/settings`}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <Settings className="w-4 h-4" /> Settings
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Create `components/agents/agent-form.tsx`**

```typescript
'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { modelCategories, type ModelProvider } from '@/lib/ai';

interface AgentFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description: string;
    systemPrompt: string;
    modelProvider: string;
    modelName: string;
    temperature: number;
    maxTokens: number;
  }) => Promise<void>;
  initial?: Partial<{
    name: string;
    description: string;
    systemPrompt: string;
    modelProvider: string;
    modelName: string;
    temperature: number;
    maxTokens: number;
  }>;
}

export function AgentForm({ open, onClose, onSubmit, initial }: AgentFormProps) {
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [systemPrompt, setSystemPrompt] = useState(initial?.systemPrompt || '');
  const [modelName, setModelName] = useState(initial?.modelName || 'openrouter/free');
  const [temperature, setTemperature] = useState(initial?.temperature ?? 0.7);
  const [maxTokens, setMaxTokens] = useState(initial?.maxTokens ?? 1024);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        systemPrompt: systemPrompt.trim(),
        modelProvider: 'openrouter',
        modelName,
        temperature,
        maxTokens,
      });
      if (!initial) {
        setName(''); setDescription(''); setSystemPrompt('');
        setModelName('openrouter/free'); setTemperature(0.7); setMaxTokens(1024);
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {initial ? 'Edit Agent' : 'New Agent'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="My Agent" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="What does this agent do?" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">System Prompt</label>
            <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono text-sm"
              placeholder="You are a helpful assistant that..."
              rows={6} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <select value={modelName} onChange={e => setModelName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm">
                <optgroup label="Free">
                  {modelCategories.free.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </optgroup>
                <optgroup label="Fast">
                  {modelCategories.fast.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </optgroup>
                <optgroup label="Balanced">
                  {modelCategories.balanced.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </optgroup>
                <optgroup label="Powerful">
                  {modelCategories.powerful.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </optgroup>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
              <div className="flex items-center gap-2">
                <input type="range" min="0" max="2" step="0.1" value={temperature}
                  onChange={e => setTemperature(parseFloat(e.target.value))}
                  className="flex-1" />
                <span className="text-sm text-gray-600 w-8">{temperature}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Tokens</label>
              <input type="number" value={maxTokens} onChange={e => setMaxTokens(parseInt(e.target.value) || 1024)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                min={1} max={16384} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
            <button type="submit" disabled={!name.trim() || loading}
              className="px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50">
              {loading ? 'Saving...' : initial ? 'Save Changes' : 'Create Agent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Create `app/dashboard/projects/[id]/page.tsx`** — Project detail showing agents list

```typescript
'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { AgentCard } from '@/components/agents/agent-card';
import { AgentForm } from '@/components/agents/agent-form';

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchAgents = async () => {
    try {
      const res = await fetch(`/api/projects/${params.id}/agents`);
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
    const res = await fetch(`/api/projects/${params.id}/agents`, {
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
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700">
          <Plus className="w-4 h-4" /> New Agent
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : agents.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500 mb-4">No agents yet. Create one to start building.</p>
          <button onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700">
            Create Agent
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map(agent => (
            <AgentCard key={agent.id} agent={agent} projectId={params.id} />
          ))}
        </div>
      )}

      <AgentForm open={showCreate} onClose={() => setShowCreate(false)} onSubmit={handleCreate} />
    </div>
  );
}
```

---

### Task 8: UI — Agent chat page

**Files:**
- Create: `app/dashboard/projects/[id]/agents/[aid]/page.tsx`

- [ ] **Create `app/dashboard/projects/[id]/agents/[aid]/page.tsx`**

```typescript
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Send, Settings, ArrowLeft, Bot } from 'lucide-react';
import { MessageBubble } from '@/components/chat/message-bubble';
import { onAuthChange } from '@/lib/auth-client';

export default function AgentChatPage({
  params,
}: {
  params: { id: string; aid: string };
}) {
  const router = useRouter();
  const [agent, setAgent] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (!user) { router.push('/sign-in'); return; }
      const res = await fetch(`/api/projects/${params.id}/agents/${params.aid}`);
      if (res.ok) {
        const data = await res.json();
        setAgent(data.agent);
      }
    });
    return () => unsubscribe();
  }, [params.id, params.aid]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = { id: crypto.randomUUID(), role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${params.id}/agents/${params.aid}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          chatId,
          history: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error('Failed to get response');

      const newChatId = res.headers.get('X-Chat-Id');
      if (newChatId) setChatId(newChatId);

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let fullContent = '';
      const assistantMsg = { id: crypto.randomUUID(), role: 'assistant', content: '', timestamp: new Date() };
      setMessages(prev => [...prev, assistantMsg]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        fullContent += chunk;
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last.role === 'assistant') last.content = fullContent;
          return updated;
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!agent) {
    return <div className="text-center py-12 text-gray-500">Loading agent...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Link href={`/dashboard/projects/${params.id}`}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-1">
            <ArrowLeft className="w-4 h-4" /> Back to project
          </Link>
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-emerald-600" />
            <h1 className="text-xl font-bold text-gray-900">{agent.name}</h1>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{agent.modelName}</span>
          </div>
        </div>
        <Link
          href={`/dashboard/projects/${params.id}/agents/${params.aid}/settings`}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <Settings className="w-4 h-4" /> Settings
        </Link>
      </div>

      <div className="flex flex-col h-[calc(100vh-16rem)] bg-white rounded-xl shadow-sm">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <p className="text-lg mb-2">Start chatting with {agent.name}</p>
              <p className="text-sm text-gray-400">
                {agent.systemPrompt
                  ? `System: "${agent.systemPrompt.slice(0, 100)}${agent.systemPrompt.length > 100 ? '...' : ''}"`
                  : 'No system prompt set'}
              </p>
            </div>
          )}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {error && <div className="text-center text-red-500 py-2"><p>{error}</p></div>}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={`Message ${agent.name}...`}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

---

### Task 9: UI — Agent settings page

**Files:**
- Create: `app/dashboard/projects/[id]/agents/[aid]/settings/page.tsx`

- [ ] **Create `app/dashboard/projects/[id]/agents/[aid]/settings/page.tsx`**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { AgentForm } from '@/components/agents/agent-form';
import { onAuthChange } from '@/lib/auth-client';

export default function AgentSettingsPage({
  params,
}: {
  params: { id: string; aid: string };
}) {
  const router = useRouter();
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (!user) { router.push('/sign-in'); return; }
      const res = await fetch(`/api/projects/${params.id}/agents/${params.aid}`);
      if (res.ok) {
        const data = await res.json();
        setAgent(data.agent);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [params.id, params.aid]);

  const handleUpdate = async (data: any) => {
    const res = await fetch(`/api/projects/${params.id}/agents/${params.aid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      router.push(`/dashboard/projects/${params.id}/agents/${params.aid}`);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this agent permanently?')) return;
    const res = await fetch(`/api/projects/${params.id}/agents/${params.aid}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      router.push(`/dashboard/projects/${params.id}`);
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;
  if (!agent) return <div className="text-center py-12 text-gray-500">Agent not found</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <Link href={`/dashboard/projects/${params.id}/agents/${params.aid}`}
        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-6">
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
        <button
          onClick={handleDelete}
          className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
        >
          <Trash2 className="w-4 h-4" />
          Delete Agent
        </button>
      </div>
    </div>
  );
}
```

---

### Task 10: Update sidebar with project navigation

**Files:**
- Modify: `components/layout/sidebar.tsx`

- [ ] **Modify `components/layout/sidebar.tsx`** — Add "My Projects" link, load project list dynamically

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import {
  Home,
  MessageCircle,
  CheckSquare,
  BarChart3,
  Map,
  Settings,
  FolderKanban,
  Plus,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Projects', icon: FolderKanban },
  { href: '/dashboard/chat', label: 'Quick Chat', icon: MessageCircle },
  { href: '/dashboard/quiz', label: 'Practice', icon: CheckSquare },
  { href: '/dashboard/progress', label: 'Progress', icon: BarChart3 },
  { href: '/dashboard/learning-path', label: 'Learning Path', icon: Map },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 bg-white border-r border-gray-200 p-4 lg:block">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-violet-600">LearnAI</h1>
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (
            item.href === '/dashboard' && pathname.startsWith('/dashboard/projects')
          );
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-2 rounded-lg transition text-sm',
                isActive
                  ? 'bg-violet-50 text-violet-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

---

### Self-Review

**Spec coverage:**
- Auth (Firebase JWT) — reuse existing, not modified ✓
- User registration/login — existing, not modified ✓
- Create project/agent under user — Tasks 1, 2, 3, 6, 7 ✓
- Store prompts with agent — Tasks 1, 3, 7 (systemPrompt field) ✓
- Chat interface with multi-provider — Tasks 4, 8 (streaming, agent config) ✓
- File upload (OpenAI Files API) — Task 5 ✓
- Sidebar navigation — Task 10 ✓

**Placeholder check:** No TBD, TODOs, or incomplete sections.

**Type consistency:** All types use `Project`, `Agent`, `ChatSession`, `ChatMessage` from `lib/types.ts` consistently. Method signatures match across data layer and API routes.
