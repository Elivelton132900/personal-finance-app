import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const globalPrisma = globalThis as unknown as { prisma: PrismaClient };

let prisma: PrismaClient;

if (globalPrisma.prisma) {
  prisma = globalPrisma.prisma;
} else {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);

  prisma = new PrismaClient({ adapter });
}

if (process.env.NODE_ENV !== "production") {
  globalPrisma.prisma = prisma;
}

export default prisma;
