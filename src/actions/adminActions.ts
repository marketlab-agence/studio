
'use server';

import { COURSES } from '@/lib/courses';
import { TUTORIALS } from '@/lib/tutorials';
import { SETTINGS, type AppSettings } from '@/lib/settings';
import { revalidatePath } from 'next/cache';

async function saveSettings() {
  const fs = require('fs');
  const path = require('path');
  const dataDirectory = path.join(process.cwd(), 'src/data');
  const settingsFilePath = path.join(dataDirectory, 'settings.json');

  if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory, { recursive: true });
  }
  fs.writeFileSync(settingsFilePath, JSON.stringify(SETTINGS, null, 2));
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
