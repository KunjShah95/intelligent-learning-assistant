import { getAdminDb } from './firebase-admin';
import * as admin from 'firebase-admin';
import type { Project } from './types';

const PROJECTS_COLLECTION = (uid: string) => `users/${uid}/projects`;

export async function listProjects(uid: string): Promise<Project[]> {
  const snapshot = await getAdminDb()
    .collection(PROJECTS_COLLECTION(uid))
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
}

export async function getProject(uid: string, projectId: string): Promise<Project | null> {
  const doc = await getAdminDb().collection(PROJECTS_COLLECTION(uid)).doc(projectId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Project;
}

export async function createProject(uid: string, data: { name: string; description: string }): Promise<Project> {
  const ref = await getAdminDb().collection(PROJECTS_COLLECTION(uid)).add({
    name: data.name,
    description: data.description,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  const doc = await ref.get();
  return { id: ref.id, ...doc.data() } as Project;
}

export async function updateProject(uid: string, projectId: string, data: { name?: string; description?: string }): Promise<void> {
  await getAdminDb().collection(PROJECTS_COLLECTION(uid)).doc(projectId).update({
    ...data,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export async function deleteProject(uid: string, projectId: string): Promise<void> {
  await getAdminDb().collection(PROJECTS_COLLECTION(uid)).doc(projectId).delete();
}
