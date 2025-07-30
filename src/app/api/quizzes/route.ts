
import { getQuizzes } from '@/lib/quiz';
import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const { db } = await getFirebaseAdmin();
    const quizzes = await getQuizzes(db);
    return NextResponse.json(quizzes);
  } catch (error) {
    console.error("API Error: Failed to fetch quizzes:", error);
    return NextResponse.json({ message: "Failed to fetch quizzes." }, { status: 500 });
  }
}
