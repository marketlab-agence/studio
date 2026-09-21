
import { getQuizzes } from '@/lib/quiz';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const quizzes = await getQuizzes();
    return NextResponse.json(quizzes);
  } catch (error) {
    console.error("API Error: Failed to fetch quizzes:", error);
    return NextResponse.json({ message: "Failed to fetch quizzes." }, { status: 500 });
  }
}
