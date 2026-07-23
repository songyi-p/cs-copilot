"use client";

import { useMemo } from "react";
import { useAiSuggestion } from "@/hooks/useAiSuggestion";
import { useTicketWorkspace } from "@/hooks/useTicketWorkspace";
import { searchPolicies } from "@/utils/lib";
import { buildAiReq } from "@/utils/req";
import type { Agent } from "@/utils/types";

export function useDashboard(currentAgent: Agent) {
  const workspace = useTicketWorkspace(currentAgent);
  const { ticket, order } = workspace;
  const policies = useMemo(
    () =>
      ticket
        ? searchPolicies({
            title: ticket.title,
            inquiry: ticket.inquiry,
            ticketCategory: ticket.category,
            orderStatus: order?.orderStatus,
          })
        : [],
    [order?.orderStatus, ticket]
  );
  const aiReq = useMemo(
    () => (ticket ? buildAiReq(ticket, order, policies) : undefined),
    [order, policies, ticket]
  );
  const aiQuery = useAiSuggestion(
    ticket?.ticketId ?? "",
    aiReq,
    Boolean(ticket && !workspace.aiDisabled)
  );
  const suggestion = workspace.aiDisabled ? undefined : aiQuery.data;
  const aiStatus: "loading" | "error" | "success" = aiQuery.isFetching
    ? "loading"
    : aiQuery.isError
      ? "error"
      : "success";

  return {
    ...workspace,
    suggestion,
    aiStatus,
    aiError: aiQuery.isError ? aiQuery.error.message : "",
    retryAi: () => aiQuery.refetch(),
    saveDraft: () => workspace.saveDraft(suggestion),
    approveTicket: () => workspace.approveTicket(suggestion),
    transferTicket: (agentId: string, note: string) =>
      workspace.transferTicket(agentId, note, suggestion),
  };
}
