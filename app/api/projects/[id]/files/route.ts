import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { listFiles, createFileRecord } from '@/lib/files-db';
import { extractPdfText } from '@/lib/pdf-extract';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const uid = await verifyAuth(request);
  if (!uid) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  const { id } = await params;
  const files = await listFiles(uid, id);
  return NextResponse.json({ files });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const uid = await verifyAuth(request);
  if (!uid) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  const { id } = await params;

  const formData = await request.formData();
  const file = formData.get('file') as File;
  if (!file) return NextResponse.json({ error: 'File is required', code: 'VALIDATION_ERROR' }, { status: 400 });

  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) return NextResponse.json({ error: 'File too large (max 10MB)', code: 'FILE_TOO_LARGE' }, { status: 400 });

  const allowedTypes = ['text/plain', 'application/pdf', 'text/markdown', 'application/json', 'text/csv'];
  if (!allowedTypes.includes(file.type) && !file.name.match(/\.(txt|pdf|md|json|csv)$/i)) {
    return NextResponse.json({ error: 'File type not supported', code: 'UNSUPPORTED_FILE_TYPE' }, { status: 400 });
  }

  let openaiFileId: string | undefined;

  if (process.env.OPENAI_API_KEY) {
    try {
      const form = new FormData();
      form.append('file', file, file.name);
      form.append('purpose', 'assistants');
      const res = await fetch('https://api.openai.com/v1/files', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: form,
      });
      if (res.ok) {
        const data = await res.json();
        openaiFileId = data.id;
      }
    } catch (e) {
      console.warn('OpenAI file upload failed, saving locally only:', e);
    }
  }

  // Read text content for supported file types
  let content: string | undefined;
  const textTypes = ['text/plain', 'text/markdown', 'application/json', 'text/csv'];
  const isPdf = file.type === 'application/pdf' || file.name.match(/\.pdf$/i);

  if (isPdf) {
    content = (await extractPdfText(file)) ?? undefined;
  } else if (textTypes.includes(file.type) || file.name.match(/\.(txt|md|json|csv)$/i)) {
    try {
      content = await file.text();
    } catch (e) {
      console.warn('Could not read file content:', e);
    }
  }

  const record = await createFileRecord(uid, id, {
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    openaiFileId,
    storagePath: `users/${uid}/projects/${id}/files/${file.name}`,
    content,
  });

  return NextResponse.json({ file: record }, { status: 201 });
}
