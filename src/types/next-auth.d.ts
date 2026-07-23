import type { DefaultSession } from "next-auth";

type AgentRole = "AGENT" | "ADMIN";

declare module "next-auth" {
  interface User {
    agentId: string;
    role: AgentRole;
  }

  interface Session {
    user: {
      id: string;
      agentId: string;
      role: AgentRole;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    agentId: string;
    role: AgentRole;
  }
}
