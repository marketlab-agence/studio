import * as admin from 'firebase-admin';

// This is a singleton to ensure we only initialize the app once.
let db: admin.firestore.Firestore;

if (!admin.apps.length) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
        throw new Error('Firebase environment variables are not set. Please check your .env.local file.');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error: any) {
    console.error("Firebase Admin SDK initialization error:", error.message);
    // We don't re-throw here so the app can still run,
    // but database operations will fail.
    // The UI should handle the case where db is not available.
  }
}

db = admin.firestore();

export { db };
