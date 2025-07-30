import * as admin from 'firebase-admin';
import 'dotenv/config';

let app: admin.app.App;

async function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    if (!app) {
      app = admin.app();
    }
    return { app, db: admin.firestore(), auth: admin.auth() };
  }

  console.log('--- Initializing Firebase Admin SDK ---');

  if (
    !process.env.FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_PRIVATE_KEY ||
    !process.env.FIREBASE_CLIENT_EMAIL
  ) {
    console.error('CRITICAL: Firebase admin environment variables are missing.');
    throw new Error('Firebase environment variables not set. Please check your .env.local file.');
  }

  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  };

  try {
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error: any) {
    console.error('CRITICAL: Firebase Admin SDK initialization failed.', error.message);
    throw new Error(`Firebase Admin SDK initialization failed: ${error.message}`);
  }
  
  return { app, db: admin.firestore(), auth: admin.auth() };
}

export async function getFirebaseAdmin() {
  if (admin.apps.length > 0 && app) {
    return { app, db: admin.firestore(), auth: admin.auth() };
  }
  return await initializeFirebaseAdmin();
}
