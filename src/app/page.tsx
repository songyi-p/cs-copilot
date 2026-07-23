import { auth } from "@/auth";
import { DemoLogin } from "@/components/auth/DemoLogin";
import { Dashboard } from "@/components/dashboard/Dashboard";

export default async function Home() {
  const session = await auth();

  if (!session?.user.agentId) {
    return <DemoLogin />;
  }

  return (
    <Dashboard
      currentAgent={{
        agentId: session.user.agentId,
        name: session.user.name ?? "데모 상담사",
        role: session.user.role,
      }}
    />
  );
}
