"use client";

import { useEffect, useMemo, useState } from "react";
import { useAiSuggestion } from "@/hooks/useAiSuggestion";
import { aiActionLabel } from "@/utils/constants";
import { mergeTicketState, searchPolicies, type StoredTicketState } from "@/utils/lib";
import type { ActionHistory, Agent, AiReq, Customer, Order, Ticket } from "@/utils/types";
import historyData from "@/data/action-history.json";
import customerData from "@/data/customers.json";
import orderData from "@/data/orders.json";
import ticketData from "@/data/tickets.json";

const agents: Agent[] = [
  { agentId: "agent-yoon", name: "윤서연", role: "AGENT" },
  { agentId: "agent-lee", name: "이수진", role: "AGENT" },
  { agentId: "agent-park", name: "박준호", role: "ADMIN" },
];

const agent = agents[0];
const customers = customerData as Customer[];
const orders = orderData as Order[];
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

export function useDashboard() {
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
  const customer = customers.find((item) => item.customerId === ticket.customerId)!;
  const order = orders.find((item) => item.orderId === ticket.orderId);
  const policies = useMemo(
    () =>
      searchPolicies({
        title: ticket.title,
        inquiry: ticket.inquiry,
        ticketCategory: ticket.category,
        orderStatus: order?.orderStatus,
      }),
    [order?.orderStatus, ticket.category, ticket.inquiry, ticket.title]
  );
  const ticketHistory = history
    .filter((item) => item.ticketId === ticket.ticketId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const assignee = agents.find((item) => item.agentId === ticket.assigneeId)!;
  const canEdit = agent.role === "ADMIN" || ticket.assigneeId === agent.agentId;
  const aiDisabled = ticket.status === "RESOLVED" || ticket.status === "ESCALATED";

  const aiReq = useMemo<AiReq>(
    () => ({
      inquiryTitle: ticket.title,
      inquiryContent: ticket.inquiry,
      ticketCategory: ticket.category,
      order: order
        ? {
            orderId: order.orderId,
            productName: order.productName,
            orderStatus: order.orderStatus,
            orderedAt: order.orderedAt,
            deliveryExpectedAt: order.deliveryExpectedAt,
            deliveredAt: order.deliveredAt,
            paymentAmount: order.paymentAmount,
          }
        : null,
      policies: policies.map(({ policyId, section, content }) => ({
        policyId,
        section,
        content,
      })),
    }),
    [order, policies, ticket.category, ticket.inquiry, ticket.title]
  );
  const aiQuery = useAiSuggestion(ticket.ticketId, aiReq, !aiDisabled);
  const suggestion = aiDisabled ? undefined : aiQuery.data;
  const aiStatus: "loading" | "error" | "success" = aiQuery.isFetching
    ? "loading"
    : aiQuery.isError
      ? "error"
      : "success";
  const aiError = aiQuery.isError ? aiQuery.error.message : "";
  const savedReply = ticketHistory.find((item) => item.finalResponse)?.finalResponse ?? "";

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

  const approveTicket = () => {
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

    setHistory(nextHistory);
    setTickets(nextTickets);
    window.localStorage.setItem(storageKey.history, JSON.stringify(nextHistory));
    window.localStorage.setItem(storageKey.tickets, JSON.stringify(nextTickets));
    setNotice("답변이 승인되었습니다.");
  };

  const saveDraft = () => {
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
    const nextHistory = [entry, ...history];

    setDraft(finalDraft);
    setDrafts(nextDrafts);
    setHistory(nextHistory);
    window.localStorage.setItem(storageKey.drafts, JSON.stringify(nextDrafts));
    window.localStorage.setItem(storageKey.history, JSON.stringify(nextHistory));
    setNotice("답변 초안이 저장되었습니다.");
  };

  const transferTicket = (agentId: string, note: string) => {
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
    const nextHistory = [entry, ...history];

    setDraft(finalDraft);
    setDrafts(nextDrafts);
    setTickets(nextTickets);
    setHistory(nextHistory);
    window.localStorage.setItem(storageKey.drafts, JSON.stringify(nextDrafts));
    window.localStorage.setItem(storageKey.tickets, JSON.stringify(nextTickets));
    window.localStorage.setItem(storageKey.history, JSON.stringify(nextHistory));
    setNotice(
      finalDraft
        ? "답변 초안과 함께 담당자에게 이관했습니다."
        : "답변 초안 없이 담당자에게 이관했습니다."
    );
  };

  return {
    tickets,
    customers,
    ticket,
    customer,
    order,
    ticketHistory,
    assignee,
    agents,
    canEdit,
    aiDisabled,
    suggestion,
    aiStatus,
    aiError,
    savedReply,
    draft,
    notice,
    setDraft,
    closeNotice: () => setNotice(""),
    retryAi: () => aiQuery.refetch(),
    selectTicket,
    saveDraft,
    approveTicket,
    transferTicket,
  };
}
