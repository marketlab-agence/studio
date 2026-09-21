import { getTutorials } from '@/lib/tutorials';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  // Extraction asynchrone des paramètres (Obligatoire en Next.js 15)
  const { courseId } = await params;

  try {

    // Récupération des tutoriels
    const allTutorials = await getTutorials();

    // Filtrage par courseId
    const tutorialsForCourse = allTutorials.filter(t => t.courseId === courseId);

    return NextResponse.json(tutorialsForCourse);
  } catch (error) {
    // Utilisation de la variable courseId extraite pour le log
    console.error(`API Error: Failed to fetch tutorials for course ${courseId}:`, error);

    return NextResponse.json(
      { message: "Failed to fetch tutorials for course." },
      { status: 500 }
    );
  }
}