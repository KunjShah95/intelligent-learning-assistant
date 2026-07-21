import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { listProjects, createProject } from '@/lib/projects-db';

export async function GET(request: NextRequest) {
  const uid = await verifyAuth(request);
  if (!uid) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  const projects = await listProjects(uid);
  return NextResponse.json({ projects });
}

export async function POST(request: NextRequest) {
  const uid = await verifyAuth(request);
  if (!uid) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  const body = await request.json();
  if (!body.name) return NextResponse.json({ error: 'Name is required', code: 'VALIDATION_ERROR' }, { status: 400 });
  const project = await createProject(uid, { name: body.name, description: body.description || '' });
  return NextResponse.json({ project }, { status: 201 });
}
