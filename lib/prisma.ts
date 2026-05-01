import "@/lib/env"; // Validate env vars first
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  pool: pg.Pool | undefined;
};

function createPool(): pg.Pool {
  const isProduction = process.env.NODE_ENV === "production";

  return new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isProduction ? { rejectUnauthorized: false } : undefined,
  });
}

const pool = globalForPrisma.pool ?? createPool();

if (process.env.NODE_ENV !== "production") globalForPrisma.pool = pool;

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
