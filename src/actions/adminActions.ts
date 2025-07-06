
'use server';

import { revalidatePath } from 'next/cache';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AppSettings } from '@/lib/settings';
import type { CourseInfo } from '@/types/course.types';
import type { MockUser } from '@/lib/users';

async function saveSettings() {
  // Cette fonction n'est plus nécessaire car les écritures se font directement.
}

export async function getSettings(): Promise<AppSettings> {
    const settingsRef = doc(db, 'settings', 'app');
    const settingsSnap = await getDoc(settingsRef);
    if (settingsSnap.exists()) {
        return settingsSnap.data() as AppSettings;
    }
    // Valeurs par défaut si les paramètres n'existent pas
    return { instructorName: 'Instructeur par Défaut' };
}

export async function updateSettings(newSettings: AppSettings) {
    const settingsRef = doc(db, 'settings', 'app');
    await setDoc(settingsRef, newSettings, { merge: true });
    revalidatePath('/admin');
    revalidatePath('/certificate');
}

export async function getAdminCourses(): Promise<CourseInfo[]> {
    const coursesCol = collection(db, 'courses');
    const coursesSnap = await getDocs(coursesCol);
    const coursesData = coursesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CourseInfo));
    return coursesData;
}

export async function getAdminUsers(): Promise<MockUser[]> {
    const usersCol = collection(db, 'users');
    const usersSnap = await getDocs(usersCol);
    const usersData = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MockUser));
    return usersData;
}
