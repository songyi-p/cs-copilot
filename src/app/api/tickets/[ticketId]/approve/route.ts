import { NextResponse } from "next/server";
import { requireCurrentAgent } from "@/server/current-agent";
import { apiErrorResponse, parseRequest } from "@/server/errors";
import { approveTicket } from "@/server/ticket-service";
import { approveTicketSchema } from "@/utils/schemas";

type TicketRouteContext = {
  params: Promise<{
    ticketId: string;
  }>;
};

export async function POST(request: Request, context: TicketRouteContext) {
  try {
    const agent = await requireCurrentAgent();
    const input = await parseRequest(request, approveTicketSchema);
    const { ticketId } = await context.params;
    return NextResponse.json(await approveTicket(ticketId, agent, input));
  } catch (error) {
    return apiErrorResponse(error, "tickets:approve");
  }
}
