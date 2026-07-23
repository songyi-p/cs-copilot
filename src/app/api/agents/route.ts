import { NextResponse } from "next/server";
import { requireCurrentAgent } from "@/server/current-agent";
import { apiErrorResponse } from "@/server/errors";
import { listAgents } from "@/server/ticket-service";

export async function GET() {
  try {
    await requireCurrentAgent();
    return NextResponse.json({ agents: await listAgents() });
  } catch (error) {
    return apiErrorResponse(error, "agents:list");
  }
}
