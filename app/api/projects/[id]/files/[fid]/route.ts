import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { deleteFileRecord } from '@/lib/files-db';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; fid: string }> }) {
  const uid = await verifyAuth(request);
  if (!uid) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  const { id, fid } = await params;
  await deleteFileRecord(uid, id, fid);
  return NextResponse.json({ success: true });
}
