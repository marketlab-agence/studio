import * as admin from 'firebase-admin';
import 'dotenv/config';

console.log('--- Initializing Firebase Admin SDK ---');

console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? 'Loaded' : 'MISSING');
console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? 'Loaded' : 'MISSING');
console.log('FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? 'Loaded' : 'MISSING');

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
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(new RegExp(String.fromCharCode(92) + String.fromCharCode(110), 'g'), String.fromCharCode(10)), // Extremely robust privateKey handling
};

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } else {
    console.log('Firebase Admin SDK already initialized.');
  }
} catch (error: any) {
    console.error('CRITICAL: Firebase Admin SDK initialization failed.', error.message);
    throw new Error(`Firebase Admin SDK initialization failed: ${error.message}`);
}

export const db = admin.firestore();
export const auth = admin.auth();