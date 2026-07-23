"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAgents, getTicketDetail, getTickets } from "@/utils/req";
import type { ActionHistory, Agent, Ticket, TicketDetailData, TicketListData } from "@/utils/types";

export function useTicketQuery(currentAgent: Agent) {
  const [activeId, setActiveId] = useState("");

  const ticketsQuery = useQuery<TicketListData>({
    queryKey: ["tickets"],
    queryFn: ({ signal }) => getTickets(signal),
  });

  const agentsQuery = useQuery<Agent[]>({
    queryKey: ["agents"],
    queryFn: ({ signal }) => getAgents(signal),
  });

  const tickets: Ticket[] = ticketsQuery.data?.tickets ?? [];
  const selectedId =
    activeId && tickets.some((item) => item.ticketId === activeId)
      ? activeId
      : tickets[0]?.ticketId ?? "";
  const detailQuery = useQuery<TicketDetailData>({
    queryKey: ["ticket", selectedId],
    queryFn: ({ signal }) => getTicketDetail(selectedId, signal),
    enabled: Boolean(selectedId),
  });

  const detail = detailQuery.data?.ticket.ticketId === selectedId ? detailQuery.data : undefined;
  const ticket = detail?.ticket;
  const ticketHistory: ActionHistory[] = detail?.histories ?? [];
  const workspaceError = ticketsQuery.error ?? agentsQuery.error ?? detailQuery.error;
  const workspaceStatus: "loading" | "error" | "empty" | "success" =
    ticketsQuery.isPending || agentsQuery.isPending
      ? "loading"
      : workspaceError
      ? "error"
      : tickets.length === 0
      ? "empty"
      : detailQuery.isPending || !detail
      ? "loading"
      : "success";

  return {
    tickets,
    customers: ticketsQuery.data?.customers ?? [],
    agents: agentsQuery.data ?? [],
    ticket,
    customer: detail?.customer,
    order: detail?.order,
    savedDraft: detail?.draft ?? "",
    assignee: detail?.assignee,
    ticketHistory,
    savedReply: ticketHistory.find((item) => item.finalResponse)?.finalResponse ?? "",
    canEdit: Boolean(
      ticket && (currentAgent.role === "ADMIN" || ticket.assigneeId === currentAgent.agentId)
    ),
    aiDisabled: !ticket || ticket.status === "RESOLVED" || ticket.status === "ESCALATED",
    workspaceStatus,
    workspaceError:
      workspaceError instanceof Error
        ? workspaceError.message
        : "문의 데이터를 불러오지 못했습니다.",
    selectTicket: (next: Ticket) => setActiveId(next.ticketId),
    retryWorkspace: () =>
      void Promise.all([ticketsQuery.refetch(), agentsQuery.refetch(), detailQuery.refetch()]),
  };
}
