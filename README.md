# LearnAI - Intelligent Learning Assistant

An AI-powered personalized learning platform that adapts to how each student learns. Built with Next.js, Firebase, Supabase, and multiple AI model providers.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## Overview

**LearnAI** is an intelligent tutoring system designed to provide personalized learning experiences. Unlike traditional one-size-fits-all education platforms, LearnAI:

- Adapts explanations to each learner's preferences
- Uses spaced repetition for optimized memory retention
- Provides interactive quizzes that scale difficulty based on performance
- Tracks progress with gamification elements (XP, streaks, levels)
- Supports multiple AI model providers for flexibility

## Features

| Feature | Description |
|---------|-------------|
| **Adaptive Tutoring** | AI chat that adjusts explanation depth/style based on user preferences |
| **Smart Quizzes** | Questions that get easier/harder based on performance |
| **Learning Paths** | Personalized curriculum based on knowledge gaps |
| **Spaced Repetition** | Scientific review scheduling to maximize retention |
| **Progress Tracking** | Visual analytics showing mastery over time |
| **Gamification** | XP, streaks, levels, and achievements to maintain motivation |

## Architecture

### System Overview

```mermaid
flowchart TB
    subgraph Client["Frontend (Next.js 14)"]
        UI["React UI Components"]
        State["Zustand State"]
        Hooks["Custom Hooks"]
    end

    subgraph Auth["Authentication"]
        Clerk["Clerk Auth"]
        Firebase["Firebase Admin"]
    end

    subgraph Database["Data Layer"]
        Firestore["Firebase Firestore"]
        Supabase["Supabase DB"]
    end

    subgraph AI["AI Services"]
        Google["Google AI"]
        OpenAI["OpenAI"]
        Groq["Groq"]
        OpenRouter["OpenRouter"]
    end

    UI --> Auth
    UI --> Hooks
    Hooks --> State
    State --> AI
    UI --> Firestore
    UI --> Supabase
```

### User Flow

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant Auth
    participant AI
    participant DB

    User->>UI: Visit homepage
    UI->>User: Show landing page
    
    User->>UI: Click "Sign Up"
    UI->>Auth: Redirect to Clerk
    Auth->>User: Registration form
    
    User->>Auth: Submit credentials
    Auth->>DB: Create user record
    DB->>Auth: Confirmation
    Auth->>UI: Redirect to dashboard
    
    UI->>User: Show onboarding
    User->>UI: Set learning preferences
    
    UI->>DB: Save preferences
    DB->>UI: Confirmation
    
    User->>AI: Ask question
    AI->>DB: Fetch user preferences
    AI->>AI: Generate adapted response
    AI->>UI: Personalized answer
    
    UI->>DB: Log interaction
    UI->>User: Update XP/streak
```

### Data Model

```mermaid
erDiagram
    USERS ||--o{ USER_PREFERENCES : has
    USERS ||--o{ USER_STATS : has
    USERS ||--o{ LEARNING_PATHS : follows
    USERS ||--o{ QUIZ_RESULTS : generates
    USERS ||--o{ CHAT_HISTORY : has
    
    USERS {
        string id PK
        string email
        string name
        timestamp created_at
        timestamp last_active
    }
    
    USER_PREFERENCES {
        string user_id FK
        string explanation_style
        number complexity_level
        array preferred_topics
        boolean use_analogies
        boolean step_by_step
    }
    
    USER_STATS {
        string user_id FK
        number xp
        number level
        number streak_days
        number concepts_mastered
        timestamp last_study
    }
    
    LEARNING_PATHS {
        string id PK
        string user_id FK
        string topic
        string status
        number progress
        array recommended_next
    }
```

### Technical Stack

```mermaid
graph LR
    subgraph Frontend
        Next["Next.js 14"]
        React["React 18"]
        Tailwind["Tailwind CSS"]
        Zustand["Zustand"]
    end

    subgraph Backend
        API["Next.js API Routes"]
        AI["AI SDK"]
    end

    subgraph Services
        Firebase["Firebase Auth"]
        Firestore["Firestore"]
        Supabase["Supabase"]
    end

    subgraph AI_Providers
        GoogleAI["Google AI"]
        OpenAI["OpenAI"]
        Groq["Groq"]
        OpenRouter["OpenRouter"]
    end

    Next --> API
    React --> Tailwind
    React --> Zustand
    API --> AI
    AI --> GoogleAI
    AI --> OpenAI
    AI --> Groq
    AI --> OpenRouter
    API --> Firebase
    API --> Firestore
    API --> Supabase
```

## Project Structure

```
intelligent-learning-assistant/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── learning/             # Learning & assessment
│   │   ├── progress/            # Progress tracking
│   │   ├── stats/             # User statistics
│   │   ├── tutor/             # AI tutor chat
│   │   └── ocr/               # OCR processing
│   ├── dashboard/              # Protected dashboard
│   │   ├── chat/              # AI tutor
│   │   ├── learning-path/     # Learning paths
│   │   ├── progress/          # Progress analytics
│   │   ├── quiz/             # Practice quizzes
│   │   └── settings/          # User settings
│   ├── sign-in/               # Authentication
│   ├── sign-up/
│   ├── onboarding/
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Landing page
│   └── globals.css            # Global styles
│
├── components/                 # React Components
│   ├── chat/                # Chat UI
│   │   ├── chat-window.tsx
│   │   └── message-bubble.tsx
│   ├── gamification/          # Gamification
│   │   ├── spaced-repetition.tsx
│   │   └── xp-display.tsx
│   ├── layout/               # Layout components
│   │   ├── header.tsx
│   │   └── sidebar.tsx
│   └── quiz/                # Quiz components
│       ├── progress-ring.tsx
│       └── quiz-card.tsx
│
├── hooks/                   # Custom React Hooks
│   ├── use-api-keys.ts
│   ├── use-chat.ts
│   ├── use-progress.ts
│   └── use-stats.ts
│
├── lib/                     # Utilities & Configs
│   ├── ai.ts               # AI SDK wrapper
│   ├── api-keys.ts         # API key management
│   ├── auth.ts            # Auth utilities
│   ├── auth-client.ts      # Client auth
│   ├── firebase.ts         # Firebase client
│   ├── firebase-admin.ts   # Firebase admin
│   ├── supabase.ts        # Supabase client
│   ├── types.ts           # TypeScript types
│   └── utils.ts           # Utility functions
│
├── stores/                 # State Management
│   └── chat-store.ts      # Zustand chat store
│
├── .env.example           # Environment template
├── .gitignore            # Git ignore rules
├── next.config.js        # Next.js config
├── package.json         # Dependencies
├── postcss.config.js    # PostCSS config
├── tailwind.config.js  # Tailwind config
└── tsconfig.json      # TypeScript config
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project
- Supabase project
- AI provider API keys (optional)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd intelligent-learning-assistant

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
```

### Environment Variables

```env
# ============================================
# CLERK AUTHENTICATION
# ============================================
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# ============================================
# SUPABASE DATABASE
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# ============================================
# GOOGLE GENERATIVE AI
# ============================================
GOOGLE_API_KEY=AIzaSy...

# ============================================
# OPTIONAL PROVIDERS
# ============================================
# OPENAI_API_KEY=sk-...
# GROQ_API_KEY=gsk_...
# OPENROUTER_API_KEY=sk-or-...
# TAVILY_API_KEY=tv-...
```

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint
```

## API Reference

### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tutor/ask` | POST | AI tutor chat |
| `/api/learning/assess` | POST | Knowledge assessment |
| `/api/learning/path` | GET | Get learning path |
| `/api/learning/preferences` | POST | Save preferences |
| `/api/progress` | GET | Get progress stats |
| `/api/stats` | GET | Get user stats |
| `/api/ocr` | POST | Process image OCR |

### AI Models Supported

```mermaid
graph TD
    A[Model Categories] --> B[Fast]
    A --> C[Balanced]
    A --> D[Powerful]
    A --> E[Free]
    
    B --> B1[gemini-1.5-flash]
    B --> B2[gpt-4o-mini]
    B --> B3[claude-3-haiku]
    B --> B4[llama-3.1-8b]
    
    C --> C1[gemini-1.5-pro]
    C --> C2[gpt-4o]
    C --> C3[claude-3.5-sonnet]
    C --> C4[llama-3.1-70b]
    
    D --> D1[gpt-4-turbo]
    D --> D2[claude-3-opus]
    D --> D3[mistral-large]
    D --> D4[command-r-plus]
    
    E --> E1[qwen-2.5-7b]
    E --> E2[deepseek-chat]
    E --> E3[llama-3.3-8b]
    E --> E4[phi-3.5-mini]
```

## Gamification System

### XP & Levels

```mermaid
stateDiagram-v2
    [*] --> Level1: Just Starting
    Level1 --> Level5: 100 XP
    Level5 --> Level10: 500 XP
    Level10 --> Level15: 1000 XP
    Level15 --> Level20: 2500 XP
    Level20 --> Level25: 5000 XP
    Level25 --> Level30: 10000 XP
    Level30 --> Level40: 20000 XP
    Level40 --> Level50: 50000 XP
    Level50 --> [*]: Master
```

### Level Titles

| Level | Title |
|-------|-------|
| 1 | Just Starting |
| 5 | Getting the Hang of It |
| 10 | Building Momentum |
| 15 | Finding Your Rhythm |
| 20 | Consistent Learner |
| 25 | Knowledge Builder |
| 30 | Quick Study |
| 35 | Dedicated Learner |
| 40 | Learning Machine |
| 45 | Scholar |
| 50 | Master |

## Security

### Secrets Management

```mermaid
flowchart LR
    subgraph Git[Git Repository]
        Repo[Source Code]
    end
    
    subgraph Ignore[.gitignore Protected]
        Env[.env.local]
        Keys[API Keys]
        Creds[Credentials]
    end
    
    subgraph Cloud[Environment]
        Vercel[Vercel Secrets]
        EnvProd[Production Env]
    end
    
    Repo -->|check .gitignore| Ignore
    Ignore -.->|never push| Cloud
```

- **NEVER** commit `.env.local` or real API keys
- All secrets go in `.env.local` (gitignored)
- Use `.env.example` as template for collaborators
- Configure secrets in deployment platform (Vercel)

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Or connect your GitHub repo to Vercel for automatic deployments.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run lint` to check code quality
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Firebase](https://firebase.google.com/) - Authentication & database
- [Supabase](https://supabase.com/) - Database
- [Vercel](https://vercel.com/) - Deployment
- [AI SDK](https://sdk.vercel.ai/) - AI integration