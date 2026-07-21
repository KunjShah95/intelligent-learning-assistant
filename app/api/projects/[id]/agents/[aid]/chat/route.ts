import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getAgent } from '@/lib/agents-db';
import { getFile } from '@/lib/files-db';
import { createChat, appendMessage } from '@/lib/chats-db';
import { getModel } from '@/lib/ai';
import { streamText } from 'ai';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; aid: string }> }) {
  const uid = await verifyAuth(request);
  if (!uid) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const { id, aid } = await params;
  const agent = await getAgent(uid, id, aid);
  if (!agent) return NextResponse.json({ error: 'Agent not found', code: 'NOT_FOUND' }, { status: 404 });

  const body = await request.json();
  const { message, chatId, history = [], selectedFileIds = [] } = body;
  if (!message) return NextResponse.json({ error: 'Message is required', code: 'VALIDATION_ERROR' }, { status: 400 });

  let activeChatId = chatId;
  if (!activeChatId) {
    const chat = await createChat(uid, id, aid, message.slice(0, 60));
    activeChatId = chat.id;
  }

  const userMsg = { id: crypto.randomUUID(), role: 'user' as const, content: message, timestamp: new Date() };
  await appendMessage(uid, id, aid, activeChatId, userMsg);

  // Build system prompt with file references
  let systemPrompt = agent.systemPrompt || 'You are a helpful assistant.';
  if (selectedFileIds.length > 0) {
    const fileContents: string[] = [];
    for (const fileId of selectedFileIds) {
      const file = await getFile(uid, id, fileId);
      if (file?.content) {
        fileContents.push(`--- File: ${file.fileName} ---\n${file.content}\n--- End of ${file.fileName} ---`);
      } else if (file) {
        fileContents.push(`--- File: ${file.fileName} (content not available) ---`);
      }
    }
    if (fileContents.length > 0) {
      systemPrompt += `\n\nYou have access to the following files. Use their contents to answer questions when relevant:\n\n${fileContents.join('\n\n')}`;
    }
  }

  const result = streamText({
    model: getModel(agent.modelName as any),
    system: systemPrompt,
    messages: [...history, { role: 'user', content: message }],
    temperature: agent.temperature,
    maxOutputTokens: agent.maxTokens,
    onFinish: async ({ text }) => {
      const assistantMsg = {
        id: crypto.randomUUID(),
        role: 'assistant' as const,
        content: text,
        timestamp: new Date(),
      };
      await appendMessage(uid, id, aid, activeChatId, assistantMsg);
    },
  });

  return result.toTextStreamResponse({
    headers: {
      'X-Chat-Id': activeChatId,
    },
  });
}
