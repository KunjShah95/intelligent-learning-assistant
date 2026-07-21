import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { listAgents, createAgent } from '@/lib/agents-db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const uid = await verifyAuth(request);
  if (!uid) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  const { id } = await params;
  const agents = await listAgents(uid, id);
  return NextResponse.json({ agents });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const uid = await verifyAuth(request);
  if (!uid) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  if (!body.name) return NextResponse.json({ error: 'Name is required', code: 'VALIDATION_ERROR' }, { status: 400 });
  const agent = await createAgent(uid, id, {
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
