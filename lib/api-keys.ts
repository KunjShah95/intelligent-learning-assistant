import { db } from './firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

export interface UserApiKeys {
  openai?: string;
  google?: string;
  groq?: string;
  mistral?: string;
  openrouter?: string;
  tavily?: string;
  defaultModel?: string;
  updatedAt?: string;
}

const STORAGE_KEY = 'user_api_keys';

export async function saveUserApiKeys(
  userId: string,
  keys: UserApiKeys
): Promise<void> {
  try {
    const docRef = doc(db, 'user_api_keys', userId);
    await setDoc(docRef, {
      ...keys,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error saving API keys:', error);
    throw error;
  }
}

export async function getUserApiKeys(userId: string): Promise<UserApiKeys | null> {
  try {
    const docRef = doc(db, 'user_api_keys', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as UserApiKeys;
    }
    return null;
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return null;
  }
}

export async function deleteUserApiKeys(userId: string): Promise<void> {
  try {
    const docRef = doc(db, 'user_api_keys', userId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting API keys:', error);
    throw error;
  }
}

export function setLocalApiKeys(keys: UserApiKeys): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  }
}

export function getLocalApiKeys(): UserApiKeys | null {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function clearLocalApiKeys(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export async function loadAndSyncApiKeys(userId: string): Promise<UserApiKeys> {
  const localKeys = getLocalApiKeys();
  const storedKeys = await getUserApiKeys(userId);
  
  const mergedKeys = { ...localKeys, ...storedKeys };
  
  if (storedKeys) {
    setLocalApiKeys(storedKeys);
  } else if (localKeys) {
    await saveUserApiKeys(userId, localKeys);
  }
  
  return mergedKeys;
}
