
import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getPlans } from '@/lib/plans';

export async function GET() {
  try {
    const { db } = await getFirebaseAdmin();
    const plans = await getPlans(db);
    return NextResponse.json(plans);
  } catch (error) {
    console.error("API Error: Failed to fetch plans:", error);
    return NextResponse.json({ message: "Failed to fetch plans." }, { status: 500 });
  }
}
