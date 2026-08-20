import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

function resolveConnectionString(url: string) {
  if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
    return url;
  }

  const parsed = new URL(url);
  const apiKey = parsed.searchParams.get("api_key");
  const payloadSegment = apiKey?.split(".")[1];
  if (!payloadSegment) {
    return url;
  }

  const padded =
    payloadSegment.replace(/-/g, "+").replace(/_/g, "/") +
    "=".repeat((4 - (payloadSegment.length % 4)) % 4);
  const payload = JSON.parse(Buffer.from(padded, "base64").toString("utf8")) as {
    databaseUrl?: string;
  };

  if (!payload.databaseUrl) {
    throw new Error("DATABASE_URL is missing a direct Postgres connection string");
  }

  return payload.databaseUrl;
}

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const adapter = new PrismaPg({
    connectionString: resolveConnectionString(databaseUrl),
  });

  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
