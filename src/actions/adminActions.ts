'use server';

import { revalidatePath } from 'next/cache';
import type { AppUser } from '@/lib/users';
import type { AppSettings } from '@/types/settings.types';
import { getSettings, saveSettings } from '@/lib/settings';
import { getCourses } from '@/lib/courses';
import { getTutorials } from '@/lib/tutorials';
import { getRequestScope, getUserProvider } from '@/lib/providers';

export async function getSettingsAction(): Promise<AppSettings> {
    return await getSettings();
}

export async function updateSettingsAction(newSettings: AppSettings) {
    await saveSettings(newSettings);
    revalidatePath('/admin');
    revalidatePath('/certificate');
}

export async function getAdminCoursesAction() {
    try {
        const courses = await getCourses();
        const tutorials = await getTutorials();

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
        const scope = await getRequestScope();
        return await getUserProvider().list(scope);
    } catch(error) {
        console.error("Failed to fetch admin users:", error);
        return [];
    }
}

export async function getAdminUserByIdAction(userId: string): Promise<AppUser | null> {
    try {
        const scope = await getRequestScope();
        return await getUserProvider().getById(scope, userId);
    } catch (error) {
        console.error("Failed to fetch user:", error);
        return null;
    }
}

export async function updateUserRoleAction(userId: string, role: AppUser['role']): Promise<void> {
    try {
        const scope = await getRequestScope();
        await getUserProvider().setRole(scope, userId, role);
        revalidatePath(`/admin/users/${userId}`);
        revalidatePath('/admin/users');
    } catch (error) {
        console.error("Failed to update user role:", error);
        throw new Error("Could not update user role.");
    }
}
