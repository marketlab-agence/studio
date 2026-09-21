
import { getCourses } from '@/lib/courses';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const courses = await getCourses();
    return NextResponse.json(courses);
  } catch (error) {
    console.error("API Error: Failed to fetch courses:", error);
    return NextResponse.json({ message: "Failed to fetch courses." }, { status: 500 });
  }
}
