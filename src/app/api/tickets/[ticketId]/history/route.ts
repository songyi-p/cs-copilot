import { NextResponse } from "next/server";
import { requireCurrentAgent } from "@/server/current-agent";
import { apiErrorResponse } from "@/server/errors";
import { getTicketDetail } from "@/server/ticket-service";

type TicketRouteContext = {
  params: Promise<{
    ticketId: string;
  }>;
};

export async function GET(_request: Request, context: TicketRouteContext) {
  try {
    const agent = await requireCurrentAgent();
    const { ticketId } = await context.params;
    const detail = await getTicketDetail(ticketId, agent);
    return NextResponse.json({ histories: detail.histories });
  } catch (error) {
    return apiErrorResponse(error, "tickets:history");
  }
}
