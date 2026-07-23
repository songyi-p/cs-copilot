import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma, requireDatabaseConfig } from "@/server/prisma";

const isAgentRole = (value: unknown): value is "AGENT" | "ADMIN" =>
  value === "AGENT" || value === "ADMIN";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8,
  },
  pages: {
    signIn: "/",
  },
  providers: [
    Credentials({
      id: "demo",
      name: "CS Copilot 데모",
      credentials: { agentId: {} },
      authorize: async (credentials) => {
        requireDatabaseConfig();
        const agentId = typeof credentials?.agentId === "string" ? credentials.agentId : "";
        if (!agentId) return null;
        const agent = await prisma.agent.findUnique({
          where: {
            agentId,
            isActive: true,
          },
          include: {
            user: true,
          },
        });

        if (!agent?.user) return null;

        return {
          id: agent.user.id,
          name: agent.name,
          email: agent.user.email,
          image: agent.user.image,
          agentId: agent.agentId,
          role: agent.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (
        user &&
        typeof user.agentId === "string" &&
        isAgentRole(user.role)
      ) {
        token.agentId = user.agentId;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (
        session.user &&
        token.sub &&
        typeof token.agentId === "string" &&
        isAgentRole(token.role)
      ) {
        session.user.id = token.sub;
        session.user.agentId = token.agentId;
        session.user.role = token.role;
      }
      return session;
    },
  },
});
