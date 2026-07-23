"use client";

import { useAiSuggestion } from "@/hooks/useAiSuggestion";
import { useTicketWorkspace } from "@/hooks/useTicketWorkspace";
import type { Agent } from "@/utils/types";

export function useDashboard(currentAgent: Agent) {
  const workspace = useTicketWorkspace(currentAgent);
  const { ticket } = workspace;
  const aiQuery = useAiSuggestion(ticket?.ticketId ?? "", Boolean(ticket && !workspace.aiDisabled));
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
