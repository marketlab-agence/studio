
'use server';

import { revalidatePath } from 'next/cache';
import { MOCK_USERS } from '@/lib/users';
import type { AppSettings } from '@/types/settings.types';
import { getSettings, saveSettings } from '@/lib/settings';
import { getCourses } from '@/lib/courses';
import { getTutorials } from '@/lib/tutorials';

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

export async function getAdminUsersAction() {
    return MOCK_USERS.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
        status: user.status
    }));
}
