'use client';

import { useState, useEffect, useCallback } from 'react';
import { onAuthChange, type AuthUser } from '@/lib/auth-client';
import { 
  saveUserApiKeys, 
  getUserApiKeys, 
  getLocalApiKeys, 
  setLocalApiKeys, 
  clearLocalApiKeys,
  type UserApiKeys 
} from '@/lib/api-keys';
import { setUserApiKeys, clearUserApiKeys, type ModelProvider } from '@/lib/ai';

const defaultApiKeys: UserApiKeys & { defaultModel: string } = {
  openai: '',
  google: '',
  groq: '',
  mistral: '',
  openrouter: '',
  tavily: '',
  defaultModel: 'gemini-1.5-flash',
};

export function useApiKeys() {
  const [apiKeys, setApiKeys] = useState<UserApiKeys>(defaultApiKeys);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (authUser) => {
      setUser(authUser);
      
      if (authUser) {
        try {
          const storedKeys = await getUserApiKeys(authUser.uid);
          if (storedKeys) {
            setApiKeys(storedKeys);
            setLocalApiKeys(storedKeys);
            setUserApiKeys({
              openai: storedKeys.openai,
              google: storedKeys.google,
              groq: storedKeys.groq,
              mistral: storedKeys.mistral,
              openrouter: storedKeys.openrouter,
              tavily: storedKeys.tavily,
            });
          } else {
            const localKeys = getLocalApiKeys();
            if (localKeys) {
              setApiKeys(localKeys);
              await saveUserApiKeys(authUser.uid, localKeys);
              setUserApiKeys({
                openai: localKeys.openai,
                google: localKeys.google,
                groq: localKeys.groq,
                mistral: localKeys.mistral,
                openrouter: localKeys.openrouter,
                tavily: localKeys.tavily,
              });
            }
          }
        } catch (error) {
          console.error('Error loading API keys:', error);
          const localKeys = getLocalApiKeys();
          if (localKeys) {
            setApiKeys(localKeys);
            setUserApiKeys({
              openai: localKeys.openai,
              google: localKeys.google,
              groq: localKeys.groq,
              mistral: localKeys.mistral,
              openrouter: localKeys.openrouter,
              tavily: localKeys.tavily,
            });
          }
        }
      } else {
        const localKeys = getLocalApiKeys();
        if (localKeys) {
          setApiKeys(localKeys);
        } else {
          setApiKeys(defaultApiKeys);
        }
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const updateKey = useCallback((provider: keyof UserApiKeys, value: string) => {
    setApiKeys(prev => ({ ...prev, [provider]: value }));
    setIsSaved(false);
  }, []);

  const saveKeys = useCallback(async () => {
    const keysForAI = {
      openai: apiKeys.openai,
      google: apiKeys.google,
      groq: apiKeys.groq,
      mistral: apiKeys.mistral,
      openrouter: apiKeys.openrouter,
      tavily: apiKeys.tavily,
    };
    setUserApiKeys(keysForAI);
    
    if (!user) {
      setLocalApiKeys({ ...apiKeys } as UserApiKeys);
      setIsSaved(true);
      return;
    }
    
    try {
      await saveUserApiKeys(user.uid, apiKeys as UserApiKeys);
      setLocalApiKeys(apiKeys as UserApiKeys);
      setIsSaved(true);
    } catch (error) {
      console.error('Error saving API keys:', error);
      throw error;
    }
  }, [user, apiKeys]);

  const clearKeys = useCallback(async () => {
    clearUserApiKeys();
    
    if (user) {
      try {
        const clearedKeys: UserApiKeys = {
          openai: '',
          google: '',
          groq: '',
          mistral: '',
          openrouter: '',
          tavily: '',
        };
        
        await saveUserApiKeys(user.uid, clearedKeys);
      } catch (error) {
        console.error('Error clearing API keys:', error);
      }
    }
    
    clearLocalApiKeys();
    setApiKeys(defaultApiKeys);
    setIsSaved(false);
  }, [user]);

  return {
    apiKeys,
    loading,
    user,
    isSaved,
    updateKey,
    saveKeys,
    clearKeys,
  };
}

export function getApiKey(provider: string, apiKeys: UserApiKeys): string {
  switch (provider) {
    case 'openai':
      return apiKeys.openai || process.env.OPENAI_API_KEY || '';
    case 'google':
      return apiKeys.google || process.env.GOOGLE_API_KEY || '';
    case 'groq':
      return apiKeys.groq || process.env.GROQ_API_KEY || '';
    case 'mistral':
      return apiKeys.mistral || process.env.MISTRAL_API_KEY || '';
    case 'openrouter':
      return apiKeys.openrouter || process.env.OPENROUTER_API_KEY || '';
    case 'tavily':
      return apiKeys.tavily || process.env.TAVILY_API_KEY || '';
    default:
      return '';
  }
}
