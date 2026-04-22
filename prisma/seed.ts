import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import { addDays, subDays, startOfDay } from "date-fns";
import path from "path";

const dbUrl = `file:${path.resolve(process.cwd(), "dev.db")}`;
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  await prisma.task.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.document.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();

  const now = startOfDay(new Date());

  // Stable ID: keeps JWTs valid across db:reset so the browser never needs to re-login
  const DEMO_USER_ID = "cmo901pc50000fb1v7ign9co1";

  const user = await prisma.user.create({
    data: {
      id: DEMO_USER_ID,
      email: "demo@deadlinepilot.dev",
      passwordHash: await bcrypt.hash("password123", 10),
      name: "Alex Chen",
      onboardingCompleted: true,
    },
  });

  const cs401 = await prisma.course.create({
    data: { userId: user.id, name: "CS401 — Algorithms" },
  });

  const eng302 = await prisma.course.create({
    data: { userId: user.id, name: "ENG302 — Technical Writing" },
  });

  // Simulate a completed extraction
  const doc1 = await prisma.document.create({
    data: {
      userId: user.id,
      courseId: cs401.id,
      filename: "CS401_syllabus.pdf",
      storagePath: "/uploads/demo/cs401_syllabus.pdf",
      extractionStatus: "done",
      extractionConfidence: 0.82,
    },
  });

  // Assignment 1: HIGH RISK — due in 2 days, not started
  const a1 = await prisma.assignment.create({
    data: {
      userId: user.id,
      courseId: cs401.id,
      documentId: doc1.id,
      title: "Graph Algorithms Problem Set",
      description: "Solve 5 problems on Dijkstra, BFS, and topological sort.",
      dueDate: addDays(now, 2),
      status: "not_started",
      riskScore: 0.88,
      extractionConfidence: 0.82,
      reviewed: true,
      tasks: {
        create: [
          { title: "Read problem statements", orderIndex: 0, estimatedMinutes: 20 },
          { title: "Solve Dijkstra problems (Q1–Q2)", orderIndex: 1, estimatedMinutes: 45 },
          { title: "Solve BFS/DFS problems (Q3–Q4)", orderIndex: 2, estimatedMinutes: 45 },
          { title: "Topological sort (Q5)", orderIndex: 3, estimatedMinutes: 30 },
          { title: "Review and write up solutions", orderIndex: 4, estimatedMinutes: 30 },
        ],
      },
    },
  });

  // Assignment 2: MEDIUM RISK — due in 6 days, in progress
  const a2 = await prisma.assignment.create({
    data: {
      userId: user.id,
      courseId: eng302.id,
      title: "Technical Report Draft",
      description: "1500-word technical report on a software architecture pattern.",
      dueDate: addDays(now, 6),
      status: "in_progress",
      riskScore: 0.52,
      extractionConfidence: 0.91,
      reviewed: true,
      tasks: {
        create: [
          { title: "Choose architecture pattern", orderIndex: 0, status: "done", estimatedMinutes: 15 },
          { title: "Outline the report structure", orderIndex: 1, status: "done", estimatedMinutes: 20 },
          { title: "Write introduction section", orderIndex: 2, estimatedMinutes: 30 },
          { title: "Write main body sections", orderIndex: 3, estimatedMinutes: 60 },
          { title: "Write conclusion and references", orderIndex: 4, estimatedMinutes: 30 },
          { title: "Proofread and submit", orderIndex: 5, estimatedMinutes: 20 },
        ],
      },
    },
  });

  // Assignment 3: LOW RISK — due in 18 days, not started
  await prisma.assignment.create({
    data: {
      userId: user.id,
      courseId: cs401.id,
      title: "Dynamic Programming Final Project",
      description: "Implement 3 classic DP problems and analyse time complexity.",
      dueDate: addDays(now, 18),
      status: "not_started",
      riskScore: 0.18,
      reviewed: true,
      tasks: {
        create: [
          { title: "Research DP problem options", orderIndex: 0, estimatedMinutes: 30 },
          { title: "Implement problem 1", orderIndex: 1, estimatedMinutes: 60 },
          { title: "Implement problem 2", orderIndex: 2, estimatedMinutes: 60 },
          { title: "Implement problem 3", orderIndex: 3, estimatedMinutes: 60 },
          { title: "Write complexity analysis", orderIndex: 4, estimatedMinutes: 45 },
        ],
      },
    },
  });

  // Assignment 4: OVERDUE — past due, not done
  await prisma.assignment.create({
    data: {
      userId: user.id,
      courseId: eng302.id,
      title: "Peer Review Submission",
      description: "Submit peer review for classmate's report.",
      dueDate: subDays(now, 1),
      status: "not_started",
      riskScore: 0.98,
      reviewed: true,
      tasks: {
        create: [
          { title: "Read assigned report", orderIndex: 0, estimatedMinutes: 30 },
          { title: "Complete review form", orderIndex: 1, estimatedMinutes: 20 },
          { title: "Submit via portal", orderIndex: 2, estimatedMinutes: 5 },
        ],
      },
    },
  });

  // Assignment 5: DONE
  await prisma.assignment.create({
    data: {
      userId: user.id,
      courseId: cs401.id,
      title: "Sorting Algorithms Quiz",
      dueDate: subDays(now, 5),
      status: "done",
      riskScore: 0,
      reviewed: true,
      tasks: {
        create: [
          { title: "Review merge sort", orderIndex: 0, status: "done" },
          { title: "Review quicksort", orderIndex: 1, status: "done" },
          { title: "Take quiz", orderIndex: 2, status: "done" },
        ],
      },
    },
  });

  console.log("✅ Seed complete");
  console.log("   Login: demo@deadlinepilot.dev / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
