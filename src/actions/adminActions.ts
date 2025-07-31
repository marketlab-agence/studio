
'use server';

import { revalidatePath } from 'next/cache';
import type { AppUser } from '@/lib/users';
import type { AppSettings } from '@/types/settings.types';
import { getSettings, saveSettings } from '@/lib/settings';
import { getCourses } from '@/lib/courses';
import { getTutorials } from '@/lib/tutorials';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function getSettingsAction(): Promise<AppSettings> {
    return await getSettings();
}

export async function updateSettingsAction(newSettings: AppSettings) {
    await saveSettings(newSettings);
    console.log('Settings updated:', newSettings);
    revalidatePath('/admin');
    revalidatePath('/certificate');
}

export async function getAdminCoursesAction() {
    try {
        const { db } = await getFirebaseAdmin();
        const courses = await getCourses(db);
        const tutorials = await getTutorials(db);

        const coursesData = courses.map(course => {
            const lessonsCount = tutorials.filter(t => t.courseId === course.id).reduce((acc, tutorial) => acc + (tutorial.lessons?.length || 0), 0);
            return {
                id: course.id,
                title: course.title,
                lessonsCount: lessonsCount,
                status: course.status || 'Brouillon',
            };
        });
        return coursesData;
    } catch(error) {
        console.error("Failed to fetch admin courses:", error);
        return [];
    }
}

export async function getAdminUsersAction(): Promise<AppUser[]> {
    try {
        const { db } = await getFirebaseAdmin();
        const usersSnapshot = await db.collection('users').get();
        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppUser));
        return users;
    } catch(error) {
        console.error("Failed to fetch admin users:", error);
        return [];
    }
}

export async function getAdminUserByIdAction(userId: string): Promise<AppUser | null> {
    try {
        const { db } = await getFirebaseAdmin();
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return null;
        }
        return { id: userDoc.id, ...userDoc.data() } as AppUser;
    } catch (error) {
        console.error("Failed to fetch user:", error);
        return null;
    }
}

export async function updateUserRoleAction(userId: string, role: AppUser['role']): Promise<void> {
    try {
        const { db } = await getFirebaseAdmin();
        await db.collection('users').doc(userId).update({ role });
        revalidatePath(`/admin/users/${userId}`);
        revalidatePath('/admin/users');
    } catch (error) {
        console.error("Failed to update user role:", error);
        throw new Error("Could not update user role.");
    }
}

