import { generateText } from 'ai';
import { getModel, hasApiKeyForModel, webSearch, type ModelProvider, type UserApiKeys } from './ai';
import type { ExplanationLevel } from './types';

export type AgentRole = 'tutor' | 'profiler' | 'assessor' | 'content' | 'engagement' | 'researcher';

const AGENT_PROMPTS: Record<AgentRole, string> = {
  tutor: `You are an adaptive learning tutor with expertise in explaining complex concepts clearly.
Your role:
- Break down complex topics into digestible pieces
- Check for understanding through questions
- Adapt explanations based on learner level
- Use analogies and real-world examples
- Provide step-by-step guidance when needed`,
  
  profiler: `You are a learning profile analyzer.
Analyze learner patterns and output a JSON object with:
- level: "beginner" | "intermediate" | "advanced"
- learningStyle: "visual" | "auditory" | "reading" | "kinesthetic" | "mixed"
- interests: array of topics
- strengths: array of areas where learner excels
- weakAreas: array of areas needing improvement
- recommendedApproach: string describing best learning strategy`,
  
  assessor: `You are a quiz generation specialist.
Create effective quiz questions that:
- Test understanding, not just memorization
- Have clear, unambiguous correct answers
- Include plausible distractors for multiple choice
- Vary difficulty appropriately
- Provide helpful explanations for answers`,
  
  content: `You are an educational content generator.
Create learning content that:
- Matches the learner's level and style
- Includes practical examples
- Has clear structure with headings
- Uses bullet points for key concepts
- Provides practice opportunities`,
  
  engagement: `You are a learning motivation specialist.
Enhance engagement by:
- Celebrating progress and achievements
- Using gamification elements
- Providing encouraging feedback
- Creating a positive learning atmosphere
- Suggesting next steps`,
  
  researcher: `You are a research assistant specialized in finding and synthesizing information.
Your role:
- Search the web for relevant information
- Synthesize findings into clear summaries
- Cite sources properly
- Provide balanced perspectives on topics`,
};

export interface AgentContext {
  level?: ExplanationLevel;
  learningStyle?: string;
  history?: string[];
  userId?: string;
  apiKeys?: UserApiKeys;
}

export async function runAgent(
  role: AgentRole,
  input: string,
  context?: AgentContext,
  modelProvider?: ModelProvider
): Promise<string> {
  const selectedModel = modelProvider || 'gemini-1.5-flash';

  if (!hasApiKeyForModel(selectedModel, context?.apiKeys)) {
    return 'AI provider is not configured. Add the matching API key in Settings, save it, then ask again.';
  }

  const model = getModel(selectedModel, context?.apiKeys);
  
  const systemPrompt = AGENT_PROMPTS[role];
  const contextStr = context ? JSON.stringify(context) : '';
  
  try {
    const result = await generateText({
      model,
      system: systemPrompt,
      prompt: `Context: ${contextStr}\n\nTask: ${input}`,
      temperature: 0.7,
      maxOutputTokens: 1024,
    });
    
    return result.text;
  } catch (error) {
    console.error(`Agent ${role} error:`, error);
    return 'I could not get a live response. Check that the API key is valid and that the selected model is available for your provider.';
  }
}

function fallback(role: AgentRole, input: string): string {
  const fallbacks: Record<AgentRole, string> = {
    tutor: `Here's an explanation of that concept: ${input.slice(0, 100)}...`,
    profiler: '{"level": "intermediate", "learningStyle": "examples", "interests": [], "strengths": [], "weakAreas": [], "recommendedApproach": "Start with fundamentals"}',
    assessor: `Question: What is a key aspect of "${input.slice(0, 30)}"?`,
    content: 'Here is educational content about the topic.',
    engagement: 'Great progress! Keep learning!',
    researcher: 'I couldn\'t find specific information about this topic.',
  };
  return fallbacks[role];
}

export function createAgent(role: AgentRole) {
  return (input: string, context?: AgentContext, modelProvider?: ModelProvider) =>
    runAgent(role, input, context, modelProvider);
}

export async function orchestrate(
  question: string,
  options: {
    level?: ExplanationLevel;
    learningStyle?: string;
    history?: string[];
    modelProvider?: ModelProvider;
    apiKeys?: UserApiKeys;
  } = {}
) {
  const { 
    level = 'detailed', 
    learningStyle, 
    history = [],
    modelProvider,
    apiKeys,
  } = options;
  
  const context: AgentContext = { level, learningStyle, history, apiKeys };

  const [tutor, assessor, content] = await Promise.all([
    runAgent('tutor', question, context, modelProvider),
    runAgent('assessor', question, { ...context }, modelProvider),
    runAgent('content', question, context, modelProvider),
  ]);

  const engagement = await runAgent(
    'engagement',
    `Tutor: ${tutor}\nQuiz: ${assessor}\nContent: ${content}`,
    context,
    modelProvider
  );

  return {
    explanation: tutor,
    quizQuestion: assessor,
    additionalContent: content,
    engagement,
  };
}

export async function researchWithWebSearch(query: string, modelProvider?: ModelProvider) {
  const searchResults = await webSearch(query);
  
  if (searchResults.error || searchResults.results.length === 0) {
    return { 
      summary: 'No search results found.', 
      sources: [],
      error: searchResults.error 
    };
  }

  const context = searchResults.results
    .slice(0, 3)
    .map((r: { title: string; content: string }) => `## ${r.title}\n${r.content}`)
    .join('\n\n');

  const summary = await runAgent(
    'researcher',
    `Synthesize this information into a concise summary:\n\n${context}`,
    {},
    modelProvider
  );

  return {
    summary,
    sources: searchResults.results.map((r: { url: string; title: string }) => ({
      url: r.url,
      title: r.title,
    })),
    error: null,
  };
}

export async function searchAndLearn(query: string, modelProvider?: ModelProvider) {
  return researchWithWebSearch(query, modelProvider);
}

export function adaptExplanation(level: ExplanationLevel): string {
  const adaptations: Record<ExplanationLevel, string> = {
    simple: 'Use simple language. One idea per sentence. Define all terms.',
    detailed: 'Comprehensive coverage. Examples, edge cases, depth.',
    analogy: 'Use real-world examples. Compare to everyday concepts.',
    'step-by-step': 'Number each step. Show the process. Explain each stage.',
  };
  return adaptations[level] || adaptations.detailed;
}

export function getSystemPrompt(role: AgentRole): string {
  return AGENT_PROMPTS[role];
}

const agents = {
  createAgent,
  runAgent,
  orchestrate,
  searchAndLearn,
  researchWithWebSearch,
  adaptExplanation,
  getSystemPrompt,
  AGENT_PROMPTS,
};

export default agents;
