"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveTicketResponse,
  getAgents,
  getTicketDetail,
  getTickets,
  saveTicketDraft,
  transferTicketToAgent,
} from "@/utils/req";
import type {
  ActionHistory,
  Agent,
  AiSuggestion,
  SavedSuggestion,
  Ticket,
  TicketDetailData,
  TicketListData,
} from "@/utils/types";

const toSavedSuggestion = (suggestion: AiSuggestion): SavedSuggestion => ({
  replyDraft: suggestion.replyDraft,
  recommendedAction: suggestion.recommendedAction,
  confidenceScore: suggestion.confidenceScore,
  policyReferences: suggestion.policyReferences,
});

export function useTicketWorkspace(currentAgent: Agent) {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState("");
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeTone, setNoticeTone] = useState<"success" | "error">("success");

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
    activeId && tickets.some((item: Ticket) => item.ticketId === activeId)
      ? activeId
      : tickets[0]?.ticketId ?? "";
  const detailQuery = useQuery<TicketDetailData>({
    queryKey: ["ticket", selectedId],
    queryFn: ({ signal }) => getTicketDetail(selectedId, signal),
    enabled: Boolean(selectedId),
  });

  const detail =
    detailQuery.data?.ticket.ticketId === selectedId
      ? detailQuery.data
      : undefined;
  const ticket = detail?.ticket;
  const assignee = detail?.assignee;
  const agents: Agent[] = agentsQuery.data ?? [];
  const ticketHistory: ActionHistory[] = detail?.histories ?? [];
  const canEdit = Boolean(
    ticket &&
      (currentAgent.role === "ADMIN" ||
        ticket.assigneeId === currentAgent.agentId)
  );
  const aiDisabled =
    !ticket ||
    ticket.status === "RESOLVED" ||
    ticket.status === "ESCALATED";
  const savedReply =
    ticketHistory.find((item: ActionHistory) => item.finalResponse)
      ?.finalResponse ?? "";

  useEffect(() => {
    setDraft(detail?.draft ?? "");
  }, [detail?.draft, selectedId]);

  const showResult = (message: string, tone: "success" | "error") => {
    setNotice(message);
    setNoticeTone(tone);
  };

  const refreshWorkspace = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["tickets"] }),
      queryClient.invalidateQueries({ queryKey: ["ticket"] }),
    ]);
  };

  const draftMutation = useMutation({
    mutationFn: ({
      ticketId,
      draftContent,
      suggestion,
    }: {
      ticketId: string;
      draftContent: string;
      suggestion?: AiSuggestion;
    }) =>
      saveTicketDraft(ticketId, {
        draft: draftContent,
        suggestion: suggestion ? toSavedSuggestion(suggestion) : undefined,
      }),
    onSuccess: async (result, variables) => {
      showResult(result.message, "success");
      await queryClient.invalidateQueries({
        queryKey: ["ticket", variables.ticketId],
      });
    },
    onError: (error: Error) => showResult(error.message, "error"),
  });

  const approveMutation = useMutation({
    mutationFn: ({
      ticketId,
      suggestion,
    }: {
      ticketId: string;
      suggestion: AiSuggestion;
    }) =>
      approveTicketResponse(ticketId, {
        finalResponse: draft || suggestion.replyDraft,
        suggestion: toSavedSuggestion(suggestion),
      }),
    onSuccess: async (result) => {
      showResult(result.message, "success");
      await refreshWorkspace();
    },
    onError: (error: Error) => showResult(error.message, "error"),
  });

  const transferMutation = useMutation({
    mutationFn: ({
      ticketId,
      toAgentId,
      note,
      suggestion,
    }: {
      ticketId: string;
      toAgentId: string;
      note: string;
      suggestion?: AiSuggestion;
    }) =>
      transferTicketToAgent(ticketId, {
        toAgentId,
        note,
        draft: draft || suggestion?.replyDraft || "",
        suggestion: suggestion ? toSavedSuggestion(suggestion) : undefined,
      }),
    onSuccess: async (result) => {
      showResult(result.message, "success");
      await refreshWorkspace();
    },
    onError: (error: Error) => showResult(error.message, "error"),
  });

  const selectTicket = (next: Ticket) => {
    setActiveId(next.ticketId);
    setNotice("");
  };

  const saveDraft = (suggestion?: AiSuggestion) => {
    if (!ticket || !canEdit || ticket.status === "RESOLVED") return;
    const finalDraft = draft || suggestion?.replyDraft || "";

    if (!finalDraft.trim()) {
      showResult("저장할 답변 초안을 입력해 주세요.", "error");
      return;
    }

    if (!draft) setDraft(finalDraft);
    draftMutation.mutate({
      ticketId: ticket.ticketId,
      draftContent: finalDraft,
      suggestion,
    });
  };

  const approveTicket = (suggestion?: AiSuggestion) => {
    if (!ticket || !canEdit || !suggestion) return;
    approveMutation.mutate({
      ticketId: ticket.ticketId,
      suggestion,
    });
  };

  const transferTicket = (
    agentId: string,
    note: string,
    suggestion?: AiSuggestion
  ) => {
    if (!ticket || !canEdit || ticket.status === "RESOLVED") return;
    transferMutation.mutate({
      ticketId: ticket.ticketId,
      toAgentId: agentId,
      note,
      suggestion,
    });
  };

  const workspaceError =
    ticketsQuery.error ?? agentsQuery.error ?? detailQuery.error;
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
    ticket,
    customer: detail?.customer,
    order: detail?.order,
    ticketHistory,
    assignee,
    agents,
    canEdit,
    aiDisabled,
    savedReply,
    draft,
    notice,
    noticeTone,
    workspaceStatus,
    workspaceError:
      workspaceError instanceof Error
        ? workspaceError.message
        : "문의 데이터를 불러오지 못했습니다.",
    isMutating:
      draftMutation.isPending ||
      approveMutation.isPending ||
      transferMutation.isPending,
    setDraft,
    closeNotice: () => setNotice(""),
    retryWorkspace: () => {
      void Promise.all([
        ticketsQuery.refetch(),
        agentsQuery.refetch(),
        detailQuery.refetch(),
      ]);
    },
    selectTicket,
    saveDraft,
    approveTicket,
    transferTicket,
  };
}
