import { getAdminDb } from './firebase-admin';
import * as admin from 'firebase-admin';
import type { ProjectFile } from './types';

const FILES_COLLECTION = (uid: string, pid: string) => `users/${uid}/projects/${pid}/files`;

export async function listFiles(uid: string, projectId: string): Promise<ProjectFile[]> {
  const snapshot = await getAdminDb()
    .collection(FILES_COLLECTION(uid, projectId))
    .orderBy('uploadedAt', 'desc')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProjectFile));
}

export async function createFileRecord(uid: string, projectId: string, data: {
  fileName: string;
  fileType: string;
  fileSize: number;
  openaiFileId?: string;
  storagePath: string;
  content?: string;
}): Promise<ProjectFile> {
  const ref = await getAdminDb().collection(FILES_COLLECTION(uid, projectId)).add({
    ...data,
    uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  const doc = await ref.get();
  return { id: ref.id, ...doc.data() } as ProjectFile;
}

export async function getFile(uid: string, projectId: string, fileId: string): Promise<ProjectFile | null> {
  const doc = await getAdminDb().collection(FILES_COLLECTION(uid, projectId)).doc(fileId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as ProjectFile;
}

export async function deleteFileRecord(uid: string, projectId: string, fileId: string): Promise<void> {
  await getAdminDb().collection(FILES_COLLECTION(uid, projectId)).doc(fileId).delete();
}
