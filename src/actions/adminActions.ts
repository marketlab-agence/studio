
'use server';

import { COURSES } from '@/lib/courses';
import { TUTORIALS } from '@/lib/tutorials';

export async function getAdminCourses() {
    const coursesData = COURSES.map(course => ({
        id: course.id,
        title: course.title,
        lessonsCount: TUTORIALS.filter(t => t.courseId === course.id).reduce((acc, chap) => acc + chap.lessons.length, 0),
        status: course.status,
    }));
    
    return coursesData;
}
