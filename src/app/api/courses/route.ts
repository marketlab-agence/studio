
import { getCourses } from '@/lib/courses';
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin'; // Import db

export async function GET() {
  try {
    const courses = await getCourses(db); // Pass db
    return NextResponse.json(courses);
  } catch (error) {
    console.error("API Error: Failed to fetch courses:", error);
    return NextResponse.json({ message: "Failed to fetch courses." }, { status: 500 });
  }
}
