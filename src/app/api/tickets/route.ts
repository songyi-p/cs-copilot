import { NextResponse } from "next/server";
import { requireCurrentAgent } from "@/server/current-agent";
import { apiErrorResponse } from "@/server/errors";
import { listTickets } from "@/server/ticket-service";

export async function GET() {
  try {
    const agent = await requireCurrentAgent();
    return NextResponse.json(await listTickets(agent));
  } catch (error) {
    return apiErrorResponse(error, "tickets:list");
  }
}
