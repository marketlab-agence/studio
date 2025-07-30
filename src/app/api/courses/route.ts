
import { getCourses } from '@/lib/courses';
import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const { db } = await getFirebaseAdmin();
    const courses = await getCourses(db);
    return NextResponse.json(courses);
  } catch (error) {
    console.error("API Error: Failed to fetch courses:", error);
    return NextResponse.json({ message: "Failed to fetch courses." }, { status: 500 });
  }
}
