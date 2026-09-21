
'use server';

import { savePlanAction } from '@/actions/courseActions';
import { buildCourseFromPlanAction } from '@/actions/courseActions';
import { generateLessonContentAction } from '@/actions/courseActions';
import type { CreateCourseOutput, CreateCourseInput } from '@/ai/flows/create-course-flow';

export async function startFullCourseGenerationAction(plan: CreateCourseOutput, params: CreateCourseInput): Promise<{ courseId: string; status: string; error?: string }> {
    let courseId: string | undefined;
    try {
        console.log('Starting full course generation workflow...');

        // Step 1: Save the initial plan to get a stable courseId
        console.log('Step 1: Saving initial plan...');
        const savePlanResult = await savePlanAction(plan, params);
        courseId = savePlanResult.courseId;
        console.log(`Plan saved, courseId: ${courseId}`);

        // Step 2: Build the basic course structure
        console.log(`Step 2: Building course structure for ${courseId}...`);
        await buildCourseFromPlanAction(courseId);
        console.log('Course structure built.');

        // Step 3 (NEW): Generate content for all lessons sequentially
        console.log('Step 3: Generating content for all lessons...');
        if (plan.chapters) {
            for (let i = 0; i < plan.chapters.length; i++) {
                const chapter = plan.chapters[i];
                if (chapter.lessons) {
                    for (let j = 0; j < chapter.lessons.length; j++) {
                        console.log(`Generating content for Chapter ${i + 1}, Lesson ${j + 1}...`);
                        await generateLessonContentAction(courseId, i, j);
                    }
                }
            }
        }
        console.log('All lesson content generated.');
        console.log('Full course generation workflow completed successfully.');

        return { courseId, status: 'success' };

    } catch (error: any) {
        console.error('Error during full course generation workflow:', error);
        return { courseId: courseId || '', status: 'error', error: error.message };
    }
}
