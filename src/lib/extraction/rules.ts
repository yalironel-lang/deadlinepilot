import fs from "fs/promises";
import path from "path";
import { parse, isValid, addDays } from "date-fns";
import type { ExtractedAssignment } from "@/types";

/**
 * Rules-based extractor — reads PDF or TXT, applies regex patterns.
 * Activated with EXTRACTION_MODE=rules.
 */
export async function extractWithRules(
  storagePath: string,
  filename: string
): Promise<ExtractedAssignment[]> {
  const fullPath = path.join(process.cwd(), "public", storagePath);
  let text = "";

  try {
    const ext = path.extname(filename).toLowerCase();
    if (ext === ".pdf") {
      const pdfParseModule = await import("pdf-parse");
      const pdfParse = (pdfParseModule as any).default ?? pdfParseModule;
      const buffer = await fs.readFile(fullPath);
      const data = await pdfParse(buffer);
      text = data.text;
    } else {
      text = await fs.readFile(fullPath, "utf-8");
    }
  } catch {
    return [];
  }

  return parseText(text);
}

// Date format patterns to try
const DATE_FORMATS = [
  "MMMM d, yyyy",
  "MMMM d yyyy",
  "MMM d, yyyy",
  "MMM d yyyy",
  "MM/dd/yyyy",
  "MM/dd/yy",
  "yyyy-MM-dd",
  "d MMMM yyyy",
];

// Matches lines like "Assignment 2", "Homework 3", "Quiz 1", "Problem Set 2", "Lab Report 3"
const ASSIGNMENT_PATTERN =
  /\b(assignment|homework|hw|quiz|exam|midterm|final|project|lab report|problem set|essay|paper|report|presentation)\s*[:#\-–]?\s*([^\n]{0,80})/gi;

// Matches due-date patterns like "Due: May 10", "Due date: 2026-05-10"
const DUE_DATE_PATTERN =
  /\b(?:due|deadline|submit(?:ted)?|submission)\s*(?:date|by|on)?\s*[:\-–]?\s*([A-Za-z0-9 ,\/\-]+)/gi;

function extractDates(text: string): Date[] {
  const found: Date[] = [];
  let match: RegExpExecArray | null;
  const pattern = new RegExp(DUE_DATE_PATTERN.source, "gi");

  while ((match = pattern.exec(text)) !== null) {
    const raw = match[1].trim().slice(0, 30);
    for (const fmt of DATE_FORMATS) {
      const parsed = parse(raw, fmt, new Date());
      if (isValid(parsed) && parsed > new Date()) {
        found.push(parsed);
        break;
      }
    }
  }
  return found;
}

function extractBulletTasks(block: string): string[] {
  return block
    .split("\n")
    .map((l) => l.replace(/^[\s•\-*–]+/, "").trim())
    .filter((l) => l.length > 10 && l.length < 120);
}

function parseText(text: string): ExtractedAssignment[] {
  const results: ExtractedAssignment[] = [];
  const dates = extractDates(text);
  const seen = new Set<string>();

  let match: RegExpExecArray | null;
  const pattern = new RegExp(ASSIGNMENT_PATTERN.source, "gi");
  let index = 0;

  while ((match = pattern.exec(text)) !== null && index < 6) {
    const rawTitle = (match[2] || match[1]).trim().replace(/[^\w\s\-–]/g, "");
    const title = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
    if (!title || title.length < 3 || seen.has(title.toLowerCase())) continue;
    seen.add(title.toLowerCase());

    const dueDate = dates[index] ?? addDays(new Date(), 7 + index * 3);
    const nearbyText = text.slice(Math.max(0, match.index - 50), match.index + 300);
    const bullets = extractBulletTasks(nearbyText).slice(0, 5);

    const tasks = bullets.map((b, i) => ({ title: b, orderIndex: i, estimatedMinutes: 30 }));
    if (tasks.length === 0) {
      tasks.push({ title: `Complete ${title}`, orderIndex: 0, estimatedMinutes: 60 });
    }

    results.push({
      title,
      dueDate,
      confidence: dates[index] ? 0.72 : 0.48,
      tasks,
    });
    index++;
  }

  return results;
}
