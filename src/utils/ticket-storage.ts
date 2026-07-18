import type { Ticket } from "@/utils/types";

export type StoredTicketState = {
  ticketId: string;
  status?: string;
  assigneeId?: string;
};

export const mergeStoredTicketState = (
  defaultTickets: Ticket[],
  storedTickets: StoredTicketState[],
  validAssigneeIds: string[]
): Ticket[] => {
  const storedById = new Map(storedTickets.map((ticket) => [ticket.ticketId, ticket]));
  const validAssignees = new Set(validAssigneeIds);

  return defaultTickets.map((ticket) => {
    const storedTicket = storedById.get(ticket.ticketId);
    return {
      ...ticket,
      status: storedTicket?.status ?? ticket.status,
      assigneeId:
        storedTicket?.assigneeId && validAssignees.has(storedTicket.assigneeId)
          ? storedTicket.assigneeId
          : ticket.assigneeId,
    };
  });
};
