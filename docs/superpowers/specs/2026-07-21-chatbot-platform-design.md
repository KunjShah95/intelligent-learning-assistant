# Chatbot Platform — Design Spec

## Overview

Expand the existing LearnAI (Intelligent Learning Assistant) application with project/agent management, prompt storage, and file upload capabilities — transforming it into a general-purpose Chatbot Platform while retaining the existing learning features.

## Architecture

### Data Model (Firebase Firestore)

All data is nested under the user document for clear ownership and simple Firestore security rules.

```
users/{userId}/
├── projects/{projectId}/
│   ├── name: string
│   ├── description: string
│   ├── createdAt: Timestamp
│   ├── updatedAt: Timestamp
│   ├── agents/{agentId}/
│   │   ├── name: string
│   │   ├── description: string
│   │   ├── systemPrompt: string
│   │   ├── modelProvider: ModelProvider
│   │   ├── modelName: string
│   │   ├── temperature: number (0-2, default 0.7)
│   │   ├── maxTokens: number (default 1024)
│   │   ├── createdAt: Timestamp
│   │   ├── updatedAt: Timestamp
│   │   └── chats/{chatId}/
│   │       ├── title: string
│   │       ├── messages: ChatMessage[]
│   │       ├── createdAt: Timestamp
│   │       └── updatedAt: Timestamp
│   └── files/{fileId}/
│       ├── fileName: string
│       ├── fileType: string
│       ├── fileSize: number
│       ├── openaiFileId: string (if uploaded to OpenAI)
│       ├── storagePath: string (Firebase Storage path)
│       └── uploadedAt: Timestamp
```

### Pages / Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/dashboard` | DashboardPage | Show projects grid (replace learning cards) |
| `/dashboard/projects/new` | NewProjectPage | Create new project |
| `/dashboard/projects/[id]` | ProjectDetailPage | Project detail with agents list, files tab |
| `/dashboard/projects/[id]/agents/new` | NewAgentPage | Create new agent |
| `/dashboard/projects/[id]/agents/[aid]` | AgentChatPage | Chat with agent |
| `/dashboard/projects/[id]/agents/[aid]/settings` | AgentSettingsPage | Edit prompt, model, params |

### API Routes

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/projects` | List user's projects |
| POST | `/api/projects` | Create new project |
| GET | `/api/projects/[id]` | Get project details |
| PUT | `/api/projects/[id]` | Update project |
| DELETE | `/api/projects/[id]` | Delete project |
| POST | `/api/projects/[pid]/agents` | Create agent under project |
| GET | `/api/projects/[pid]/agents` | List agents in project |
| GET | `/api/projects/[pid]/agents/[aid]` | Get agent details |
| PUT | `/api/projects/[pid]/agents/[aid]` | Update agent (prompt, model, etc.) |
| DELETE | `/api/projects/[pid]/agents/[aid]` | Delete agent |
| POST | `/api/projects/[pid]/agents/[aid]/chat` | Streaming chat with agent |
| GET | `/api/projects/[pid]/agents/[aid]/chats` | List chat sessions |
| POST | `/api/projects/[pid]/agents/[aid]/chats` | Create new chat session |
| POST | `/api/projects/[pid]/files` | Upload file (Firebase Storage + OpenAI Files API) |
| GET | `/api/projects/[pid]/files` | List project files |

### Chat Flow

1. Client sends `POST /api/projects/[pid]/agents/[aid]/chat`
2. Server reads agent config (systemPrompt, modelProvider, modelName, temperature)
3. Server creates/updates chat session in Firestore
4. Server calls `streamText` from `lib/ai.ts` with agent's config
5. Streams response back via `AIStream` / ReadableStream
6. On completion, saves full exchange to Firestore

### File Upload Flow

1. Client uploads file to Firebase Storage for persistence
2. Server copies file to OpenAI Files API for model access
3. File metadata saved in `users/{uid}/projects/{pid}/files/{fid}`
4. Files can be referenced in agent system prompts or chat context

### UI Components (New / Modified)

| Component | Status |
|-----------|--------|
| `components/projects/project-card.tsx` | New |
| `components/projects/project-list.tsx` | New |
| `components/projects/create-project-dialog.tsx` | New |
| `components/agents/agent-card.tsx` | New |
| `components/agents/agent-form.tsx` | New |
| `components/agents/agent-settings.tsx` | New |
| `components/chat/chat-window.tsx` | Modify — accept agent config |
| `components/chat/message-bubble.tsx` | Keep as-is |
| `components/files/file-upload.tsx` | New |
| `components/files/file-list.tsx` | New |
| `components/layout/sidebar.tsx` | Modify — add project nav |

### What Stays Unchanged

- Firebase Auth (email/password + Google) — `lib/auth.ts`, `lib/auth-client.ts`
- AI provider system — `lib/ai.ts` (multi-provider reused directly)
- Firebase config — `lib/firebase.ts`, `lib/firebase-admin.ts`
- Existing dashboard layout shell
- Existing chat components (adapted, not replaced)

### Security

- All API routes verify Firebase ID token via `verifyAuth` middleware
- Firestore rules restrict reads/writes to own subcollections
- File uploads validate type and size server-side
- No API keys exposed client-side

### Error Handling

- API routes return structured JSON errors (`{ error: string, code: string }`)
- Chat streaming handles model failures gracefully (fallback message)
- File upload validates before persisting

### Performance

- Chat streaming uses Vercel AI SDK's `streamText` for low latency
- Firestore subcollections naturally partition data per user
- Minimal data fetched — project/agent names only in list views
