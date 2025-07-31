import * as admin from 'firebase-admin';
import 'dotenv/config';

let app: admin.app.App;

async function initializeFirebaseAdmin() {
  if (!admin.apps.length) {
    console.log('--- Initializing Firebase Admin SDK ---');

    if (
      !process.env.FIREBASE_PROJECT_ID ||
      !process.env.FIREBASE_PRIVATE_KEY ||
      !process.env.FIREBASE_CLIENT_EMAIL
    ) {
      console.error('CRITICAL: Firebase admin environment variables are missing.');
      throw new Error('Firebase environment variables not set. Please check your .env.local file.');
    }

    // This is the robust way to handle the private key, especially in different environments.
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    };

    try {
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      });
      console.log('Firebase Admin SDK initialized successfully.');

      const db = app.firestore();
      db.settings({
        ignoreUndefinedProperties: true,
      });
      console.log('Firestore settings updated: ignoreUndefinedProperties enabled.');

    } catch (error: any) {
      console.error('CRITICAL: Firebase Admin SDK initialization failed.', error.message);
      throw new Error(`Firebase Admin SDK initialization failed: ${error.message}`);
    }
  } else {
    app = admin.apps[0]!;
    console.log('Firebase Admin SDK already initialized.');
  }
}

let firebaseAdminPromise: Promise<void> | null = null;

export async function getFirebaseAdmin() {
    if (!firebaseAdminPromise) {
        firebaseAdminPromise = initializeFirebaseAdmin();
    }
    await firebaseAdminPromise;
    
    return {
        db: app.firestore(),
        auth: app.auth(),
    };
}
