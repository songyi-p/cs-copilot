"use client";

import { useEffect, useMemo, useState } from "react";
import { aiActionLabel } from "@/utils/constants";
import { mergeTicketState, type StoredTicketState } from "@/utils/lib";
import type { ActionHistory, Agent, AiSuggestion, Ticket } from "@/utils/types";
import historyData from "@/data/action-history.json";
import ticketData from "@/data/tickets.json";

const agents: Agent[] = [
  { agentId: "agent-yoon", name: "윤서연", role: "AGENT" },
  { agentId: "agent-lee", name: "이수진", role: "AGENT" },
  { agentId: "agent-park", name: "박준호", role: "ADMIN" },
];

const agent = agents[0];
const initialHistory = historyData as ActionHistory[];
const initialTickets = (ticketData as Ticket[]).map((ticket) => ({
  ...ticket,
  assigneeId: ticket.ticketId === "TKT-1004" ? "agent-lee" : agent.agentId,
}));

const storageKey = {
  history: "cs-copilot-action-history",
  tickets: "cs-copilot-tickets",
  drafts: "cs-copilot-drafts",
};

export function useTicketWorkspace() {
  const [tickets, setTickets] = useState(initialTickets);
  const [history, setHistory] = useState(initialHistory);
  const [activeId, setActiveId] = useState(initialTickets[0].ticketId);
  const [draft, setDraft] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");

  const ticket = useMemo(
    () => tickets.find((item) => item.ticketId === activeId)!,
    [activeId, tickets]
  );
  const ticketHistory = useMemo(
    () =>
      history
        .filter((item) => item.ticketId === ticket.ticketId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [history, ticket.ticketId]
  );
  const assignee = agents.find((item) => item.agentId === ticket.assigneeId)!;
  const canEdit = agent.role === "ADMIN" || ticket.assigneeId === agent.agentId;
  const aiDisabled = ticket.status === "RESOLVED" || ticket.status === "ESCALATED";
  const savedReply = ticketHistory.find((item) => item.finalResponse)?.finalResponse ?? "";

  const saveTickets = (next: Ticket[]) => {
    setTickets(next);
    window.localStorage.setItem(storageKey.tickets, JSON.stringify(next));
  };

  const saveHistory = (next: ActionHistory[]) => {
    setHistory(next);
    window.localStorage.setItem(storageKey.history, JSON.stringify(next));
  };

  const saveDrafts = (next: Record<string, string>) => {
    setDrafts(next);
    window.localStorage.setItem(storageKey.drafts, JSON.stringify(next));
  };

  useEffect(() => {
    const savedHistory = window.localStorage.getItem(storageKey.history);
    const savedTickets = window.localStorage.getItem(storageKey.tickets);
    const savedDrafts = window.localStorage.getItem(storageKey.drafts);

    try {
      if (savedHistory) setHistory(JSON.parse(savedHistory) as ActionHistory[]);
      if (savedTickets) {
        setTickets(
          mergeTicketState(
            initialTickets,
            JSON.parse(savedTickets) as StoredTicketState[],
            agents.map((item) => item.agentId)
          )
        );
      }
      if (savedDrafts) {
        const parsed = JSON.parse(savedDrafts) as Record<string, string>;
        setDrafts(parsed);
        setDraft(parsed[initialTickets[0].ticketId] ?? "");
      }
    } catch {
      Object.values(storageKey).forEach((key) => window.localStorage.removeItem(key));
    }
  }, []);

  const selectTicket = (next: Ticket) => {
    setActiveId(next.ticketId);
    setDraft(drafts[next.ticketId] ?? "");
    setNotice("");
  };

  const approveTicket = (suggestion?: AiSuggestion) => {
    if (!canEdit || ticket.status === "RESOLVED" || !suggestion) return;

    const original = suggestion.replyDraft;
    const finalReply = draft || original;
    const entry: ActionHistory = {
      historyId: `HIS-${Date.now()}`,
      ticketId: ticket.ticketId,
      suggestedAction: suggestion.recommendedAction,
      finalAction: "APPROVED_RESPONSE",
      actionLabel: aiActionLabel[suggestion.recommendedAction],
      eventType: "RESPONSE_APPROVED",
      aiDecision: finalReply === original ? "ADOPTED" : "EDITED",
      agentId: "데모 담당자",
      createdAt: new Date().toISOString(),
      finalResponse: finalReply,
      aiConfidenceScore: suggestion.confidenceScore,
      policyReferences: suggestion.policyReferences,
    };
    const nextHistory = [entry, ...history];
    const nextTickets = tickets.map((item) =>
      item.ticketId === ticket.ticketId ? { ...item, status: "RESOLVED" } : item
    );

    saveHistory(nextHistory);
    saveTickets(nextTickets);
    setNotice("답변이 승인되었습니다.");
  };

  const saveDraft = (suggestion?: AiSuggestion) => {
    if (!canEdit || ticket.status === "RESOLVED") return;
    const finalDraft = draft || suggestion?.replyDraft || "";
    if (!finalDraft.trim()) {
      setNotice("저장할 답변 초안을 입력해 주세요.");
      return;
    }

    const nextDrafts = { ...drafts, [ticket.ticketId]: finalDraft };
    const entry: ActionHistory = {
      historyId: `HIS-${Date.now()}`,
      ticketId: ticket.ticketId,
      suggestedAction: suggestion?.recommendedAction ?? "MANUAL_REVIEW",
      finalAction: "DRAFT_SAVED",
      actionLabel: "답변 초안 저장",
      eventType: "DRAFT_SAVED",
      agentId: agent.agentId,
      createdAt: new Date().toISOString(),
      finalResponse: finalDraft,
      aiConfidenceScore: suggestion?.confidenceScore,
      policyReferences: suggestion?.policyReferences,
    };

    setDraft(finalDraft);
    saveDrafts(nextDrafts);
    saveHistory([entry, ...history]);
    setNotice("답변 초안이 저장되었습니다.");
  };

  const transferTicket = (agentId: string, note: string, suggestion?: AiSuggestion) => {
    if (!canEdit || ticket.status === "RESOLVED") return;
    const finalDraft = draft || suggestion?.replyDraft || "";
    const nextDrafts = finalDraft ? { ...drafts, [ticket.ticketId]: finalDraft } : drafts;
    const nextTickets = tickets.map((item) =>
      item.ticketId === ticket.ticketId
        ? { ...item, assigneeId: agentId, status: "ESCALATED" }
        : item
    );
    const nextAgent = agents.find((item) => item.agentId === agentId);
    const entry: ActionHistory = {
      historyId: `HIS-${Date.now()}`,
      ticketId: ticket.ticketId,
      suggestedAction: suggestion?.recommendedAction ?? "ESCALATE",
      finalAction: "ESCALATE",
      actionLabel: `${agent.name} → ${nextAgent?.name} 담당자 이관`,
      eventType: "ESCALATED",
      agentId: agent.agentId,
      fromAgentId: agent.agentId,
      toAgentId: agentId,
      note,
      createdAt: new Date().toISOString(),
      aiConfidenceScore: suggestion?.confidenceScore,
      policyReferences: suggestion?.policyReferences,
    };

    setDraft(finalDraft);
    saveDrafts(nextDrafts);
    saveTickets(nextTickets);
    saveHistory([entry, ...history]);
    setNotice(
      finalDraft
        ? "답변 초안과 함께 담당자에게 이관했습니다."
        : "답변 초안 없이 담당자에게 이관했습니다."
    );
  };

  return {
    tickets,
    ticket,
    ticketHistory,
    assignee,
    agents,
    canEdit,
    aiDisabled,
    savedReply,
    draft,
    notice,
    setDraft,
    closeNotice: () => setNotice(""),
    selectTicket,
    saveDraft,
    approveTicket,
    transferTicket,
  };
}
