"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { approveTicketResponse, saveTicketDraft, transferTicketToAgent } from "@/utils/req";
import type { AiSuggestion, SavedSuggestion } from "@/utils/types";

const toSavedSuggestion = (suggestion: AiSuggestion): SavedSuggestion => ({
  replyDraft: suggestion.replyDraft,
  recommendedAction: suggestion.recommendedAction,
  confidenceScore: suggestion.confidenceScore,
  policyReferences: suggestion.policyReferences,
});

export function useTicketMutation(
  showResult: (message: string, tone: "success" | "error") => void
) {
  const queryClient = useQueryClient();
  const refreshWorkspace = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["tickets"] }),
      queryClient.invalidateQueries({ queryKey: ["ticket"] }),
    ]);

  const draftMutation = useMutation({
    mutationFn: ({
      ticketId,
      draft,
      suggestion,
    }: {
      ticketId: string;
      draft: string;
      suggestion?: AiSuggestion;
    }) =>
      saveTicketDraft(ticketId, {
        draft,
        suggestion: suggestion ? toSavedSuggestion(suggestion) : undefined,
      }),
    onSuccess: async (result, variables) => {
      showResult(result.message, "success");
      await queryClient.invalidateQueries({ queryKey: ["ticket", variables.ticketId] });
    },
    onError: (error: Error) => showResult(error.message, "error"),
  });

  const approveMutation = useMutation({
    mutationFn: ({
      ticketId,
      finalResponse,
      suggestion,
    }: {
      ticketId: string;
      finalResponse: string;
      suggestion: AiSuggestion;
    }) =>
      approveTicketResponse(ticketId, { finalResponse, suggestion: toSavedSuggestion(suggestion) }),
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
      draft,
      suggestion,
    }: {
      ticketId: string;
      toAgentId: string;
      note: string;
      draft: string;
      suggestion?: AiSuggestion;
    }) =>
      transferTicketToAgent(ticketId, {
        toAgentId,
        note,
        draft,
        suggestion: suggestion ? toSavedSuggestion(suggestion) : undefined,
      }),
    onSuccess: async (result) => {
      showResult(result.message, "success");
      await refreshWorkspace();
    },
    onError: (error: Error) => showResult(error.message, "error"),
  });

  return {
    saveDraft: draftMutation.mutate,
    approveTicket: approveMutation.mutate,
    transferTicket: transferMutation.mutate,
    isMutating: draftMutation.isPending || approveMutation.isPending || transferMutation.isPending,
  };
}
