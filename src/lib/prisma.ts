import "server-only";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

function getDbUrl(): string {
  const raw = process.env.DATABASE_URL ?? "file:./dev.db";
  // Ensure the path is absolute so it works from any cwd
  if (raw.startsWith("file:") && !raw.startsWith("file:/")) {
    const rel = raw.replace(/^file:/, "");
    return `file:${path.resolve(process.cwd(), rel)}`;
  }
  return raw;
}

function createClient() {
  const adapter = new PrismaBetterSqlite3({ url: getDbUrl() });
  return new PrismaClient({ adapter } as any);
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createClient>;
};

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
