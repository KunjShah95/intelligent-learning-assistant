import * as admin from 'firebase-admin';

let adminApp: admin.app.App | null = null;
let adminDbInstance: admin.firestore.Firestore | null = null;
let adminAuthInstance: admin.auth.Auth | null = null;

function initializeAdminApp() {
  if (adminApp && adminDbInstance && adminAuthInstance) {
    return { app: adminApp, db: adminDbInstance, auth: adminAuthInstance };
  }
  
  if (!admin.apps.length) {
    try {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

      if (projectId && clientEmail && privateKey) {
        adminApp = admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
        adminDbInstance = admin.firestore();
        adminAuthInstance = admin.auth();
      } else {
        console.warn('Firebase admin credentials not configured');
        return null;
      }
    } catch (error) {
      console.error('Firebase admin initialization error', error);
      return null;
    }
  } else {
    adminApp = admin.apps[0] || null;
    if (adminApp) {
      adminDbInstance = adminApp.firestore();
      adminAuthInstance = adminApp.auth();
    }
  }
  
  if (adminApp && adminDbInstance && adminAuthInstance) {
    return { app: adminApp, db: adminDbInstance, auth: adminAuthInstance };
  }
  
  return null;
}

export function getAdminDb(): admin.firestore.Firestore {
  const initialized = initializeAdminApp();
  if (!initialized) {
    throw new Error('Firebase admin not initialized - check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables');
  }
  return initialized.db;
}

export function getAdminAuth(): admin.auth.Auth {
  const initialized = initializeAdminApp();
  if (!initialized) {
    throw new Error('Firebase admin not initialized - check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables');
  }
  return initialized.auth;
}

export const adminDb = {
  collection: (name: string) => {
    const db = getAdminDb();
    return db.collection(name);
  }
};

export const adminAuth = {
  verifyIdToken: async (token: string) => {
    const auth = getAdminAuth();
    return auth.verifyIdToken(token);
  }
};