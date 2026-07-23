import { NextResponse } from "next/server";
import { requireCurrentAgent } from "@/server/current-agent";
import { apiErrorResponse, parseRequest } from "@/server/errors";
import { saveTicketDraft } from "@/server/ticket-service";
import { saveDraftSchema } from "@/utils/schemas";

type TicketRouteContext = {
  params: Promise<{
    ticketId: string;
  }>;
};

export async function PUT(request: Request, context: TicketRouteContext) {
  try {
    const agent = await requireCurrentAgent();
    const input = await parseRequest(request, saveDraftSchema);
    const { ticketId } = await context.params;
    return NextResponse.json(await saveTicketDraft(ticketId, agent, input));
  } catch (error) {
    return apiErrorResponse(error, "tickets:draft");
  }
}
