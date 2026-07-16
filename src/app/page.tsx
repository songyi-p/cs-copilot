"use client";

import { useEffect, useMemo, useState } from "react";
import { ActionBar } from "@/components/dashboard/ActionBar";
import { Toast } from "@/components/common/Toast";
import { AiAssistant } from "@/components/dashboard/AiAssistant";
import { AppHeader } from "@/components/dashboard/AppHeader";
import { TicketDetail } from "@/components/dashboard/TicketDetail";
import { TicketList } from "@/components/dashboard/TicketList";
import type { ActionHistory, Agent, Customer, Order, PolicyReference, Ticket } from "@/utils/types";
import { createDraft, createRecommendedAction } from "@/utils/lib";
import actionHistoryData from "@/data/action-history.json";
import customersData from "@/data/customers.json";
import ordersData from "@/data/orders.json";
import policyReferencesData from "@/data/policy-references.json";
import ticketsData from "@/data/tickets.json";

const agents: Agent[] = [
  { agentId: "agent-yoon", name: "윤서연", role: "AGENT" },
  { agentId: "agent-lee", name: "이수진", role: "AGENT" },
  { agentId: "agent-park", name: "박준호", role: "ADMIN" },
];
const currentAgent = agents[0];
const initialTickets = (ticketsData as Ticket[]).map((ticket) => ({
  ...ticket,
  assigneeId: ticket.ticketId === "TKT-1004" ? "agent-lee" : currentAgent.agentId,
}));
const customers = customersData as Customer[];
const orders = ordersData as Order[];
const policyReferences = policyReferencesData as PolicyReference[];
const initialHistories = actionHistoryData as ActionHistory[];
const HISTORY_STORAGE_KEY = "cs-copilot-action-history";
const TICKET_STORAGE_KEY = "cs-copilot-tickets";
const DRAFT_STORAGE_KEY = "cs-copilot-drafts";

export default function Home() {
  const [tickets, setTickets] = useState(initialTickets);
  const [histories, setHistories] = useState(initialHistories);
  const [selectedId, setSelectedId] = useState(initialTickets[0].ticketId);
  const [draft, setDraft] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const selected = useMemo(
    () => tickets.find((ticket) => ticket.ticketId === selectedId)!,
    [selectedId]
  );
  const customer = customers.find((item) => item.customerId === selected.customerId)!;
  const order = orders.find((item) => item.orderId === selected.orderId);
  const references = policyReferences.filter((item) => item.ticketId === selected.ticketId);
  const ticketHistories = histories
    .filter((item) => item.ticketId === selected.ticketId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const assignee = agents.find((agent) => agent.agentId === selected.assigneeId)!;
  const canEdit = currentAgent.role === "ADMIN" || selected.assigneeId === currentAgent.agentId;

  useEffect(() => {
    const saved = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    const savedTickets = window.localStorage.getItem(TICKET_STORAGE_KEY);
    const savedDrafts = window.localStorage.getItem(DRAFT_STORAGE_KEY);

    try {
      if (saved) setHistories(JSON.parse(saved) as ActionHistory[]);
      if (savedTickets) {
        const parsedTickets = JSON.parse(savedTickets) as Ticket[];
        setTickets(
          parsedTickets.map((ticket) => ({
            ...ticket,
            assigneeId:
              ticket.assigneeId && agents.some((agent) => agent.agentId === ticket.assigneeId)
                ? ticket.assigneeId
                : ticket.ticketId === "TKT-1004"
                  ? "agent-lee"
                  : currentAgent.agentId,
          }))
        );
      }
      if (savedDrafts) {
        const parsedDrafts = JSON.parse(savedDrafts) as Record<string, string>;
        setDrafts(parsedDrafts);
        setDraft(parsedDrafts[initialTickets[0].ticketId] ?? "");
      }
    } catch {
      window.localStorage.removeItem(HISTORY_STORAGE_KEY);
      window.localStorage.removeItem(TICKET_STORAGE_KEY);
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  }, []);

  const selectTicket = (ticket: Ticket) => {
    setSelectedId(ticket.ticketId);
    setDraft(drafts[ticket.ticketId] ?? "");
    setNotice("");
  };

  const approveTicket = () => {
    if (!canEdit || selected.status === "RESOLVED") return;

    const originalDraft = createDraft(selected, customer.name, order);
    const finalResponse = draft || originalDraft;
    const history: ActionHistory = {
      historyId: `HIS-${Date.now()}`,
      ticketId: selected.ticketId,
      suggestedAction: createRecommendedAction(selected),
      finalAction: "APPROVED_RESPONSE",
      actionLabel: createRecommendedAction(selected),
      eventType: "RESPONSE_APPROVED",
      aiDecision: finalResponse === originalDraft ? "ADOPTED" : "EDITED",
      agentId: "데모 담당자",
      createdAt: new Date().toISOString(),
      finalResponse,
    };
    const nextHistories = [history, ...histories];

    setHistories(nextHistories);
    setTickets((current) =>
      current.map((ticket) =>
        ticket.ticketId === selected.ticketId ? { ...ticket, status: "RESOLVED" } : ticket
      )
    );
    const nextTickets = tickets.map((ticket) =>
      ticket.ticketId === selected.ticketId ? { ...ticket, status: "RESOLVED" } : ticket
    );
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(nextHistories));
    window.localStorage.setItem(TICKET_STORAGE_KEY, JSON.stringify(nextTickets));
    setNotice("답변이 승인되었습니다.");
  };

  const saveDraft = () => {
    if (!canEdit || selected.status === "RESOLVED") return;
    const finalDraft = draft || createDraft(selected, customer.name, order);
    const nextDrafts = { ...drafts, [selected.ticketId]: finalDraft };
    const history: ActionHistory = {
      historyId: `HIS-${Date.now()}`,
      ticketId: selected.ticketId,
      suggestedAction: createRecommendedAction(selected),
      finalAction: "DRAFT_SAVED",
      actionLabel: "답변 초안 저장",
      eventType: "DRAFT_SAVED",
      agentId: currentAgent.agentId,
      createdAt: new Date().toISOString(),
      finalResponse: finalDraft,
    };
    const nextHistories = [history, ...histories];
    setDraft(finalDraft);
    setDrafts(nextDrafts);
    setHistories(nextHistories);
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(nextDrafts));
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(nextHistories));
    setNotice("답변 초안이 저장되었습니다.");
  };

  const transferTicket = (agentId: string, note: string) => {
    if (!canEdit || selected.status === "RESOLVED") return;
    const finalDraft = draft || createDraft(selected, customer.name, order);
    const nextDrafts = { ...drafts, [selected.ticketId]: finalDraft };
    const nextTickets = tickets.map((ticket) =>
      ticket.ticketId === selected.ticketId
        ? { ...ticket, assigneeId: agentId, status: "ESCALATED" }
        : ticket
    );
    const history: ActionHistory = {
      historyId: `HIS-${Date.now()}`,
      ticketId: selected.ticketId,
      suggestedAction: createRecommendedAction(selected),
      finalAction: "ESCALATE",
      actionLabel: `${currentAgent.name} → ${agents.find((agent) => agent.agentId === agentId)?.name} 담당자 이관`,
      eventType: "ESCALATED",
      agentId: currentAgent.agentId,
      fromAgentId: currentAgent.agentId,
      toAgentId: agentId,
      note,
      createdAt: new Date().toISOString(),
    };
    const nextHistories = [history, ...histories];
    setDraft(finalDraft);
    setDrafts(nextDrafts);
    setTickets(nextTickets);
    setHistories(nextHistories);
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(nextDrafts));
    window.localStorage.setItem(TICKET_STORAGE_KEY, JSON.stringify(nextTickets));
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(nextHistories));
    setNotice("답변 초안과 함께 담당자에게 이관했습니다.");
  };

  return (
    <main className="h-dvh overflow-hidden select-none max-mobile:h-auto max-mobile:min-h-dvh max-mobile:overflow-visible">
      <AppHeader />
      <section className="grid h-[calc(100dvh-136px)] grid-cols-[310px_minmax(430px,1fr)_390px] overflow-hidden max-dashboard:grid-cols-[270px_1fr] max-mobile:block max-mobile:h-auto max-mobile:overflow-visible">
        <TicketList
          tickets={tickets}
          customers={customers}
          selectedId={selectedId}
          onSelect={selectTicket}
        />
        <TicketDetail
          ticket={selected}
          customer={customer}
          order={order}
          histories={ticketHistories}
          assigneeName={assignee.name}
        />
        <AiAssistant
          ticket={selected}
          customerName={customer.name}
          order={order}
          references={references}
          draft={draft}
          onDraftChange={setDraft}
          canEdit={canEdit}
        />
      </section>
      <ActionBar
        onSaveDraft={saveDraft}
        onTransfer={transferTicket}
        onApprove={approveTicket}
        isResolved={selected.status === "RESOLVED"}
        canEdit={canEdit}
        transferTargets={agents.filter((agent) => agent.agentId !== selected.assigneeId)}
      />
      <Toast message={notice} onClose={() => setNotice("")} />
    </main>
  );
}
