import { getAdminDb } from './firebase-admin';
import * as admin from 'firebase-admin';
import type { ChatSession, ChatMessage } from './types';

const CHATS_COLLECTION = (uid: string, pid: string, aid: string) =>
  `users/${uid}/projects/${pid}/agents/${aid}/chats`;

export async function listChats(uid: string, projectId: string, agentId: string): Promise<ChatSession[]> {
  const snapshot = await getAdminDb()
    .collection(CHATS_COLLECTION(uid, projectId, agentId))
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatSession));
}

export async function getChat(uid: string, projectId: string, agentId: string, chatId: string): Promise<ChatSession | null> {
  const doc = await getAdminDb()
    .collection(CHATS_COLLECTION(uid, projectId, agentId)).doc(chatId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as ChatSession;
}

export async function createChat(uid: string, projectId: string, agentId: string, title?: string): Promise<ChatSession> {
  const ref = await getAdminDb().collection(CHATS_COLLECTION(uid, projectId, agentId)).add({
    title: title || 'New Chat',
    messages: [],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  const doc = await ref.get();
  return { id: ref.id, ...doc.data() } as ChatSession;
}

export async function appendMessage(
  uid: string, projectId: string, agentId: string, chatId: string, message: ChatMessage
): Promise<void> {
  await getAdminDb()
    .collection(CHATS_COLLECTION(uid, projectId, agentId)).doc(chatId).update({
    messages: admin.firestore.FieldValue.arrayUnion(message),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}
