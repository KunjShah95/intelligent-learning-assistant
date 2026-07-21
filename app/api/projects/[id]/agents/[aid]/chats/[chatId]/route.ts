import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getChat } from '@/lib/chats-db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; aid: string; chatId: string }> }) {
  const uid = await verifyAuth(request);
  if (!uid) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  const { id, aid, chatId } = await params;
  const chat = await getChat(uid, id, aid, chatId);
  if (!chat) return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
  return NextResponse.json({ chat });
}
