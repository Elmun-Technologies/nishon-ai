import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateUser } from "@/lib/whop-sdk";

// GET /api/challenges — list all active challenges for the current user
export async function GET(request: NextRequest) {
  const user = await validateUser(request);
  const userId = user?.userId ?? request.headers.get("x-whop-user-id") ?? "demo-user";

  const challenges = await db.challenge.findMany({
    where: { userId },
    include: { checkIns: { orderBy: { date: "desc" } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ challenges });
}

// POST /api/challenges — create a new challenge
export async function POST(request: NextRequest) {
  const user = await validateUser(request);
  const userId = user?.userId ?? request.headers.get("x-whop-user-id") ?? "demo-user";

  let body: {
    courseName?: string;
    courseUrl?: string;
    platform?: string;
    deposit?: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { courseName, courseUrl, platform, deposit } = body;

  if (!courseName || !platform || !deposit) {
    return NextResponse.json(
      { error: "courseName, platform, and deposit are required" },
      { status: 400 }
    );
  }

  if (![10, 25, 50, 100].includes(deposit)) {
    return NextResponse.json(
      { error: "Deposit must be $10, $25, $50, or $100" },
      { status: 400 }
    );
  }

  // Check for existing active challenge
  const existing = await db.challenge.findFirst({
    where: { userId, status: "active" },
  });

  if (existing) {
    return NextResponse.json(
      { error: "You already have an active challenge" },
      { status: 409 }
    );
  }

  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);

  const challenge = await db.challenge.create({
    data: {
      userId,
      courseName,
      courseUrl: courseUrl || null,
      platform,
      deposit,
      endDate,
      status: "active",
    },
  });

  return NextResponse.json({ challenge }, { status: 201 });
}

// PATCH /api/challenges — update challenge status
export async function PATCH(request: NextRequest) {
  const user = await validateUser(request);
  const userId = user?.userId ?? request.headers.get("x-whop-user-id") ?? "demo-user";

  let body: { challengeId?: string; status?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { challengeId, status } = body;

  if (!challengeId || !status) {
    return NextResponse.json(
      { error: "challengeId and status are required" },
      { status: 400 }
    );
  }

  if (!["active", "completed", "failed"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const challenge = await db.challenge.findFirst({
    where: { id: challengeId, userId },
  });

  if (!challenge) {
    return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  }

  const updated = await db.challenge.update({
    where: { id: challengeId },
    data: { status },
  });

  return NextResponse.json({ challenge: updated });
}
