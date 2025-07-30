
import { getTutorials } from '@/lib/tutorials';
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin'; // Import db

export async function GET(request: Request, { params }: { params: { courseId: string } }) {
  try {
    const { courseId } = params;
    const allTutorials = await getTutorials(db); // Pass db
    const tutorialsForCourse = allTutorials.filter(t => t.courseId === courseId);
    return NextResponse.json(tutorialsForCourse);
  } catch (error) {
    console.error(`API Error: Failed to fetch tutorials for course ${params.courseId}:`, error);
    return NextResponse.json({ message: "Failed to fetch tutorials for course." }, { status: 500 });
  }
}
