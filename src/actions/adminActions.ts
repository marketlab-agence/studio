
'use server';

import { revalidatePath } from 'next/cache';
import { MOCK_USERS } from '@/lib/users';
import type { AppSettings } from '@/types/settings.types';
import { db } from '@/lib/firebase-admin';

// Re-importing original data for seeding purposes
import { COURSES as localCourses } from '@/lib/courses';
import { TUTORIALS as localTutorials } from '@/lib/tutorials';
import { QUIZZES as localQuizzes } from '@/lib/quiz';
import { SETTINGS as localSettings } from '@/lib/settings';

export async function initializeDatabase() {
  try {
    const batch = db.batch();

    // Check for existing data
    const coursesSnapshot = await db.collection('courses').limit(1).get();
    if (!coursesSnapshot.empty) {
      return { success: false, message: 'La base de données contient déjà des données. L\'initialisation a été annulée pour éviter de dupliquer les informations.' };
    }

    // Seed Courses
    localCourses.forEach(course => {
      const { id, ...courseData } = course;
      const courseRef = db.collection('courses').doc(id);
      batch.set(courseRef, courseData);
    });

    // Seed Tutorials
    localTutorials.forEach(tutorial => {
      const { id, ...tutorialData } = tutorial;
      const tutorialRef = db.collection('tutorials').doc(id);
      batch.set(tutorialRef, tutorialData);
    });

    // Seed Quizzes
    Object.keys(localQuizzes).forEach(quizId => {
      const quizRef = db.collection('quizzes').doc(quizId);
      batch.set(quizRef, localQuizzes[quizId]);
    });
    
    // Seed Settings
    const settingsRef = db.collection('settings').doc('app');
    batch.set(settingsRef, localSettings);

    await batch.commit();
    revalidatePath('/admin');
    return { success: true, message: 'La base de données a été peuplée avec succès avec les données de démonstration.' };
  } catch (error: any) {
    console.error('Database initialization failed:', error);
    if(error.message.includes('Could not load the default credentials')) {
        return { success: false, message: `La connexion à Firebase a échoué. Veuillez vérifier que les variables d'environnement FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, et FIREBASE_PRIVATE_KEY sont correctement définies dans votre fichier .env.local et que vous avez redémarré le serveur.` };
    }
    return { success: false, message: `Une erreur est survenue: ${error.message}` };
  }
}

export async function getSettings(): Promise<AppSettings> {
    const settingsDoc = await db.collection('settings').doc('app').get();
    if (!settingsDoc.exists) {
        return { instructorName: 'Instructeur par défaut' };
    }
    return settingsDoc.data() as AppSettings;
}

export async function updateSettings(newSettings: AppSettings) {
    const settingsRef = db.collection('settings').doc('app');
    await settingsRef.set(newSettings, { merge: true });
    revalidatePath('/admin');
    revalidatePath('/certificate');
}

export async function getAdminCourses() {
    try {
        const coursesSnapshot = await db.collection('courses').get();
        if (coursesSnapshot.empty) {
            return [];
        }
        
        const coursesData = await Promise.all(coursesSnapshot.docs.map(async doc => {
            const course = doc.data();
            const tutorialsSnapshot = await db.collection('tutorials').where('courseId', '==', doc.id).get();
            const lessonsCount = tutorialsSnapshot.docs.reduce((acc, tutorialDoc) => {
                const tutorialData = tutorialDoc.data();
                return acc + (tutorialData.lessons?.length || 0);
            }, 0);

            return {
                id: doc.id,
                title: course.title,
                lessonsCount: lessonsCount,
                status: course.status || 'Brouillon',
            };
        }));
        
        return coursesData;
    } catch(error) {
        console.error("Failed to fetch admin courses:", error);
        // Return empty array on error to prevent crashing pages
        return [];
    }
}

export async function getAdminUsers() {
    return MOCK_USERS.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
        status: user.status
    }));
}
