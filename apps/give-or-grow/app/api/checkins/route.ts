import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateUser } from "@/lib/whop-sdk";

// POST /api/checkins — log a daily check-in
export async function POST(request: NextRequest) {
  const user = await validateUser(request);
  const userId = user?.userId ?? request.headers.get("x-whop-user-id") ?? "demo-user";

  let body: { challengeId?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { challengeId } = body;

  if (!challengeId) {
    return NextResponse.json(
      { error: "challengeId is required" },
      { status: 400 }
    );
  }

  // Verify challenge belongs to user
  const challenge = await db.challenge.findFirst({
    where: { id: challengeId, userId, status: "active" },
    include: { checkIns: true },
  });

  if (!challenge) {
    return NextResponse.json(
      { error: "Active challenge not found" },
      { status: 404 }
    );
  }

  // Check if already checked in today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const existingToday = await db.checkIn.findFirst({
    where: {
      challengeId,
      date: { gte: today, lt: tomorrow },
    },
  });

  if (existingToday) {
    return NextResponse.json(
      { error: "Already checked in today" },
      { status: 409 }
    );
  }

  // Create check-in
  const checkIn = await db.checkIn.create({
    data: { challengeId },
  });

  // Check if challenge is now complete (30 check-ins)
  const totalCheckIns = challenge.checkIns.length + 1;
  if (totalCheckIns >= 30) {
    await db.challenge.update({
      where: { id: challengeId },
      data: { status: "completed" },
    });
    return NextResponse.json({
      checkIn,
      completed: true,
      message: "Challenge completed! Congratulations!",
    });
  }

  // Check if challenge has expired without completion
  const now = new Date();
  if (now > new Date(challenge.endDate) && totalCheckIns < 30) {
    await db.challenge.update({
      where: { id: challengeId },
      data: { status: "failed" },
    });
  }

  return NextResponse.json({
    checkIn,
    completed: false,
    totalCheckIns,
    remaining: 30 - totalCheckIns,
  });
}

// GET /api/checkins — get check-in history for a challenge
export async function GET(request: NextRequest) {
  const user = await validateUser(request);
  const userId = user?.userId ?? request.headers.get("x-whop-user-id") ?? "demo-user";

  const { searchParams } = new URL(request.url);
  const challengeId = searchParams.get("challengeId");

  if (!challengeId) {
    return NextResponse.json(
      { error: "challengeId is required" },
      { status: 400 }
    );
  }

  // Verify ownership
  const challenge = await db.challenge.findFirst({
    where: { id: challengeId, userId },
  });

  if (!challenge) {
    return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  }

  const checkIns = await db.checkIn.findMany({
    where: { challengeId },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ checkIns });
}
