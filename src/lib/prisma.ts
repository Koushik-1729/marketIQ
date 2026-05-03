import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  return new PrismaClient();
}

function hasEarningsEventModel(client: PrismaClient) {
  return "earningsEvent" in client;
}

function hasPriceBarModel(client: PrismaClient) {
  return "priceBar" in client;
}

const cachedPrisma = globalForPrisma.prisma;

export const prisma =
  cachedPrisma && hasEarningsEventModel(cachedPrisma) && hasPriceBarModel(cachedPrisma)
    ? cachedPrisma
    : createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
