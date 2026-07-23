import { auth } from "@/auth";
import { prisma, requireDatabaseConfig } from "@/server/prisma";
import { ServerError } from "@/server/errors";

export type CurrentAgent = {
  agentId: string;
  name: string;
  role: "AGENT" | "ADMIN";
};

export async function requireCurrentAgent(): Promise<CurrentAgent> {
  const session = await auth();

  if (!session?.user.agentId) {
    throw new ServerError("로그인이 필요합니다.", 401, "UNAUTHORIZED");
  }

  requireDatabaseConfig();
  const agent = await prisma.agent.findUnique({
    where: {
      agentId: session.user.agentId,
      isActive: true,
    },
    select: {
      agentId: true,
      name: true,
      role: true,
    },
  });

  if (!agent) {
    throw new ServerError("활성 상담사 계정을 찾을 수 없습니다.", 403, "INACTIVE_AGENT");
  }

  return agent;
}
