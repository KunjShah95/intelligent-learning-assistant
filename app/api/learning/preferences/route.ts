import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

const defaultPreferences = {
  preferred_explanation_level: 'detailed',
  learning_style: 'examples',
  difficulty_preference: 'medium',
  session_duration_minutes: 15,
  topics_of_interest: [] as string[],
};

export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const snapshot = await adminDb
      .collection('learning_preferences')
      .where('user_id', '==', userId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({
        hasPreferences: false,
        preferences: defaultPreferences,
      });
    }

    return NextResponse.json({
      hasPreferences: true,
      preferences: snapshot.docs[0].data(),
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      preferred_explanation_level,
      learning_style,
      difficulty_preference,
      session_duration_minutes,
      topics_of_interest,
    } = body;

    const prefsData = {
      user_id: userId,
      preferred_explanation_level: preferred_explanation_level || 'detailed',
      learning_style: learning_style || 'examples',
      difficulty_preference: difficulty_preference || 'medium',
      session_duration_minutes: session_duration_minutes || 15,
      topics_of_interest: topics_of_interest || [],
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Upsert: check if document exists first
    const snapshot = await adminDb
      .collection('learning_preferences')
      .where('user_id', '==', userId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      const docRef = await adminDb.collection('learning_preferences').add(prefsData);
      const saved = await docRef.get();
      return NextResponse.json({ success: true, preferences: saved.data() });
    } else {
      await snapshot.docs[0].ref.update(prefsData);
      const updated = await snapshot.docs[0].ref.get();
      return NextResponse.json({ success: true, preferences: updated.data() });
    }
  } catch (error) {
    console.error('Save preferences error:', error);
    return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 });
  }
}