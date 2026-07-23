"use client";

import { useEffect, useState } from "react";
import { useTicketMutation } from "@/hooks/useTicketMutation";
import { useTicketQuery } from "@/hooks/useTicketQuery";
import type { Agent, AiSuggestion } from "@/utils/types";

export function useTicketWorkspace(currentAgent: Agent) {
  const query = useTicketQuery(currentAgent);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeTone, setNoticeTone] = useState<"success" | "error">("success");
  const showResult = (message: string, tone: "success" | "error") => {
    setNotice(message);
    setNoticeTone(tone);
  };
  const mutation = useTicketMutation(showResult);

  useEffect(() => {
    setDraft(query.savedDraft);
  }, [query.savedDraft, query.ticket?.ticketId]);

  const saveDraft = (suggestion?: AiSuggestion) => {
    if (!query.ticket || !query.canEdit || query.ticket.status === "RESOLVED") return;
    const finalDraft = draft || suggestion?.replyDraft || "";
    if (!finalDraft.trim()) return showResult("저장할 답변 초안을 입력해 주세요.", "error");
    if (!draft) setDraft(finalDraft);
    mutation.saveDraft({ ticketId: query.ticket.ticketId, draft: finalDraft, suggestion });
  };

  const approveTicket = (suggestion?: AiSuggestion) => {
    if (!query.ticket || !query.canEdit || !suggestion) return;
    mutation.approveTicket({
      ticketId: query.ticket.ticketId,
      finalResponse: draft || suggestion.replyDraft,
      suggestion,
    });
  };

  const transferTicket = (toAgentId: string, note: string, suggestion?: AiSuggestion) => {
    if (!query.ticket || !query.canEdit || query.ticket.status === "RESOLVED") return;
    mutation.transferTicket({
      ticketId: query.ticket.ticketId,
      toAgentId,
      note,
      draft: draft || suggestion?.replyDraft || "",
      suggestion,
    });
  };

  return {
    ...query,
    draft,
    notice,
    noticeTone,
    isMutating: mutation.isMutating,
    setDraft,
    closeNotice: () => setNotice(""),
    selectTicket: (ticket: Parameters<typeof query.selectTicket>[0]) => {
      setNotice("");
      query.selectTicket(ticket);
    },
    saveDraft,
    approveTicket,
    transferTicket,
  };
}
