
require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
const fs = require('fs').promises;
const path = require('path');

if (
  !process.env.FIREBASE_PROJECT_ID ||
  !process.env.FIREBASE_PRIVATE_KEY ||
  !process.env.FIREBASE_CLIENT_EMAIL
) {
  throw new Error('Firebase environment variables not set. Please check your .env file.');
}

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(new RegExp(String.fromCharCode(92) + String.fromCharCode(110), 'g'), String.fromCharCode(10)), // Extremely robust privateKey handling
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function migrateJsonToFirestore(jsonFileName, collectionName) {
  try {
    console.log(`Migrating ${jsonFileName}...`);
    const jsonPath = path.resolve(__dirname, '..', 'src', 'data', jsonFileName);
    const fileContent = await fs.readFile(jsonPath, 'utf8');
    const data = JSON.parse(fileContent);

    if (Array.isArray(data)) {
        const collectionRef = db.collection(collectionName);
        const batchSize = 500;
        let batch = db.batch();
        for (let i = 0; i < data.length; i++) {
          const item = data[i];
          const docRef = item.id ? collectionRef.doc(String(item.id)) : collectionRef.doc();
          batch.set(docRef, item);
          if ((i + 1) % batchSize === 0 || i === data.length - 1) {
            await batch.commit();
            batch = db.batch();
          }
        }
        console.log(`✅ Successfully migrated ${data.length} documents from ${jsonFileName}.`);
    } else if (typeof data === 'object' && data !== null) {
        // Handle object data (like quizzes.json)
        const collectionRef = db.collection(collectionName);
        const batch = db.batch();
        const entries = Object.entries(data);
        for (let i = 0; i < entries.length; i++) {
            const [id, item] = entries[i];
            const docRef = collectionRef.doc(id);
            batch.set(docRef, item);
            if ((i + 1) % 500 === 0 || i === entries.length - 1) {
                await batch.commit();
                batch = db.batch();
            }
        }
        console.log(`✅ Successfully migrated ${entries.length} documents from object ${jsonFileName}.`);
    } else {
        await db.collection(collectionName).doc('default').set(data);
        console.log(`✅ Migrated single document ${jsonFileName}.`);
    }
  } catch (error) {
    console.error(`❌ Error migrating ${jsonFileName}:`, error);
  }
}

async function runAllMigrations() {
  console.log("Starting all migrations...");
  await migrateJsonToFirestore('courses.json', 'courses');
  await migrateJsonToFirestore('quizzes.json', 'quizzes');
  await migrateJsonToFirestore('tutorials.json', 'tutorials');
  await migrateJsonToFirestore('settings.json', 'settings');
  await migrateJsonToFirestore('users.json', 'users');
  console.log("All migrations finished.");
}

runAllMigrations().catch(console.error);
