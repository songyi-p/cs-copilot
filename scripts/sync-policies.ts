import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { syncPolicies } from "../src/server/policy-sync";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL 또는 DIRECT_URL이 필요합니다.");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
syncPolicies(prisma)
  .then(({ policyCount, sectionCount }) => console.info(`${policyCount}개 정책, ${sectionCount}개 섹션을 동기화했습니다.`))
  .finally(() => prisma.$disconnect());
