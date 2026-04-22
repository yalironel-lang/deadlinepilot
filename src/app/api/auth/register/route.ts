import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { createSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name: name?.trim() || null, email: email.toLowerCase(), passwordHash },
    });

    await createSession({ userId: user.id, email: user.email, name: user.name });
    return NextResponse.json({ userId: user.id, onboardingCompleted: false });
  } catch (err) {
    console.error("register error", err);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
