import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getVerifiedSession } from "@/lib/session";

export async function PATCH(req: NextRequest) {
  const session = await getVerifiedSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, email, onboardingCompleted } = await req.json();

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name?.trim() || null;
  if (email !== undefined) data.email = email.toLowerCase();
  if (onboardingCompleted !== undefined) data.onboardingCompleted = onboardingCompleted;

  const user = await prisma.user.update({ where: { id: session.userId }, data });
  return NextResponse.json({ id: user.id, name: user.name, email: user.email, onboardingCompleted: user.onboardingCompleted });
}

export async function GET() {
  const session = await getVerifiedSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true, name: true, email: true, onboardingCompleted: true } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}
