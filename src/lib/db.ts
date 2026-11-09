import { PrismaClient } from "@prisma/client";

/**
 * Single PrismaClient across hot reloads — without this, `next dev` exhausts the
 * Postgres connection pool on every recompile.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
