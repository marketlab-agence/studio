'use server';

import { revalidatePath } from 'next/cache';
import { MOCK_USERS } from '@/lib/users';
import type { AppSettings } from '@/types/settings.types';
import { SETTINGS } from '@/lib/settings';
import { COURSES } from '@/lib/courses';
import { TUTORIALS } from '@/lib/tutorials';

export async function getSettings(): Promise<AppSettings> {
    // Return settings from the local file
    return SETTINGS;
}

export async function updateSettings(newSettings: AppSettings) {
    // This is an in-memory update for the prototype. It won't persist across server restarts.
    Object.assign(SETTINGS, newSettings);
    console.log('Settings updated in-memory:', SETTINGS);
    revalidatePath('/admin');
    revalidatePath('/certificate');
}

export async function getAdminCourses() {
    try {
        const coursesData = COURSES.map(course => {
            const lessonsCount = TUTORIALS.filter(t => t.courseId === course.id).reduce((acc, tutorial) => acc + (tutorial.lessons?.length || 0), 0);
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
