import { getAdminDb } from './firebase-admin';
import * as admin from 'firebase-admin';
import type { Agent } from './types';

const AGENTS_COLLECTION = (uid: string, pid: string) => `users/${uid}/projects/${pid}/agents`;

export async function listAgents(uid: string, projectId: string): Promise<Agent[]> {
  const snapshot = await getAdminDb()
    .collection(AGENTS_COLLECTION(uid, projectId))
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Agent));
}

export async function getAgent(uid: string, projectId: string, agentId: string): Promise<Agent | null> {
  const doc = await getAdminDb().collection(AGENTS_COLLECTION(uid, projectId)).doc(agentId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Agent;
}

export async function createAgent(uid: string, projectId: string, data: {
  name: string;
  description: string;
  systemPrompt: string;
  modelProvider?: string;
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<Agent> {
  const ref = await getAdminDb().collection(AGENTS_COLLECTION(uid, projectId)).add({
    name: data.name,
    description: data.description,
    systemPrompt: data.systemPrompt,
    modelProvider: data.modelProvider || 'openrouter',
    modelName: data.modelName || 'openrouter/free',
    temperature: data.temperature ?? 0.7,
    maxTokens: data.maxTokens ?? 1024,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  const doc = await ref.get();
  return { id: ref.id, projectId, ...doc.data() } as Agent;
}

export async function updateAgent(uid: string, projectId: string, agentId: string, data: Partial<{
  name: string;
  description: string;
  systemPrompt: string;
  modelProvider: string;
  modelName: string;
  temperature: number;
  maxTokens: number;
}>): Promise<void> {
  await getAdminDb().collection(AGENTS_COLLECTION(uid, projectId)).doc(agentId).update({
    ...data,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export async function deleteAgent(uid: string, projectId: string, agentId: string): Promise<void> {
  await getAdminDb().collection(AGENTS_COLLECTION(uid, projectId)).doc(agentId).delete();
}
