'use server';

import { COURSES } from '@/lib/courses';
import { TUTORIALS } from '@/lib/tutorials';
import { SETTINGS, type AppSettings } from '@/lib/settings';
import { revalidatePath } from 'next/cache';
import { MOCK_USERS } from '@/lib/users';

async function saveSettings() {
  // In a real production environment, you would save this to a database.
  // For this prototype, settings are only saved in-memory for the session.
  console.log("Simulating settings save. Data is in-memory only.");
}

export async function getSettings() {
    return SETTINGS;
}

export async function updateSettings(newSettings: AppSettings) {
    SETTINGS.instructorName = newSettings.instructorName;
    await saveSettings();
    revalidatePath('/admin');
    revalidatePath('/certificate');
}

export async function getAdminCourses() {
    const coursesData = COURSES.map(course => ({
        id: course.id,
        title: course.title,
        lessonsCount: TUTORIALS.filter(t => t.courseId === course.id).reduce((acc, chap) => acc + chap.lessons.length, 0),
        status: course.status,
    }));
    
    return coursesData;
}

export async function getAdminUsers() {
    // In a real app, you would fetch this from a database.
    // We also might not want to send all user data to the client.
    return MOCK_USERS.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
        status: user.status
    }));
}
