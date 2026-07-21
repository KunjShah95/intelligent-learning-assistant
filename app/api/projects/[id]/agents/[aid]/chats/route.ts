import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { listChats, createChat } from '@/lib/chats-db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; aid: string }> }) {
  const uid = await verifyAuth(request);
  if (!uid) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  const { id, aid } = await params;
  const chats = await listChats(uid, id, aid);
  return NextResponse.json({ chats });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; aid: string }> }) {
  const uid = await verifyAuth(request);
  if (!uid) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  const { id, aid } = await params;
  const body = await request.json();
  const chat = await createChat(uid, id, aid, body.title);
  return NextResponse.json({ chat }, { status: 201 });
}
