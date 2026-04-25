import { NextRequest } from 'next/server';
import { adminAuth } from './firebase-admin';

export async function verifyAuth(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const idToken = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      return decodedToken.uid;
    } catch (error) {
      console.error('Error verifying Firebase ID token:', error);
      return null;
    }
  }

  // Fallback for search parameters (optional, but good for testing)
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  if (token) {
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      return decodedToken.uid;
    } catch (error) {
      console.error('Error verifying Firebase ID token from URL:', error);
      return null;
    }
  }

  return null;
}
