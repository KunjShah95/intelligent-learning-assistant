import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getAgent, updateAgent, deleteAgent } from '@/lib/agents-db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; aid: string }> }) {
  const uid = await verifyAuth(request);
  if (!uid) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  const { id, aid } = await params;
  const agent = await getAgent(uid, id, aid);
  if (!agent) return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
  return NextResponse.json({ agent });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; aid: string }> }) {
  const uid = await verifyAuth(request);
  if (!uid) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  const { id, aid } = await params;
  const body = await request.json();
  await updateAgent(uid, id, aid, body);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; aid: string }> }) {
  const uid = await verifyAuth(request);
  if (!uid) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  const { id, aid } = await params;
  await deleteAgent(uid, id, aid);
  return NextResponse.json({ success: true });
}
