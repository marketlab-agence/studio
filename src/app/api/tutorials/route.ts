
import { getTutorials } from '@/lib/tutorials';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const tutorials = await getTutorials();
    return NextResponse.json(tutorials);
  } catch (error) {
    console.error("API Error: Failed to fetch tutorials:", error);
    return NextResponse.json({ message: "Failed to fetch tutorials." }, { status: 500 });
  }
}
