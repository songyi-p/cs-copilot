"use client";

import { useEffect, useMemo, useState } from "react";
import { ActionBar } from "@/components/dashboard/ActionBar";
import { Toast } from "@/components/common/Toast";
import { AiAssistant } from "@/components/dashboard/AiAssistant";
import { AppHeader } from "@/components/dashboard/AppHeader";
import { TicketDetail } from "@/components/dashboard/TicketDetail";
import { TicketList } from "@/components/dashboard/TicketList";
import type { ActionHistory, Customer, Order, PolicyReference, Ticket } from "@/utils/types";
import { createDraft, createRecommendedAction } from "@/utils/lib";
import actionHistoryData from "@/data/action-history.json";
import customersData from "@/data/customers.json";
import ordersData from "@/data/orders.json";
import policyReferencesData from "@/data/policy-references.json";
import ticketsData from "@/data/tickets.json";

const initialTickets = ticketsData as Ticket[];
const customers = customersData as Customer[];
const orders = ordersData as Order[];
const policyReferences = policyReferencesData as PolicyReference[];
const initialHistories = actionHistoryData as ActionHistory[];
const HISTORY_STORAGE_KEY = "cs-copilot-action-history";

export default function Home() {
  const [tickets, setTickets] = useState(initialTickets);
  const [histories, setHistories] = useState(initialHistories);
  const [selectedId, setSelectedId] = useState(initialTickets[0].ticketId);
  const [draft, setDraft] = useState("");
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

  useEffect(() => {
    const saved = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!saved) return;

    try {
      const savedHistories = JSON.parse(saved) as ActionHistory[];
      setHistories(savedHistories);
      const resolvedTicketIds = new Set(
        savedHistories
          .filter((history) => history.finalAction !== "ESCALATE")
          .map((history) => history.ticketId)
      );
      setTickets((current) =>
        current.map((ticket) =>
          resolvedTicketIds.has(ticket.ticketId) ? { ...ticket, status: "RESOLVED" } : ticket
        )
      );
    } catch {
      window.localStorage.removeItem(HISTORY_STORAGE_KEY);
    }
  }, []);

  const selectTicket = (ticket: Ticket) => {
    setSelectedId(ticket.ticketId);
    setDraft("");
    setNotice("");
  };

  const approveTicket = () => {
    if (selected.status === "RESOLVED") return;

    const originalDraft = createDraft(selected, customer.name, order);
    const finalResponse = draft || originalDraft;
    const history: ActionHistory = {
      historyId: `HIS-${Date.now()}`,
      ticketId: selected.ticketId,
      suggestedAction: createRecommendedAction(selected),
      finalAction: "APPROVED_RESPONSE",
      actionLabel: createRecommendedAction(selected),
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
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(nextHistories));
    setNotice("답변이 승인되었습니다.");
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
        />
        <AiAssistant
          ticket={selected}
          customerName={customer.name}
          order={order}
          references={references}
          draft={draft}
          onDraftChange={setDraft}
        />
      </section>
      <ActionBar
        onEdit={() => setNotice("오른쪽 답변 초안에서 내용을 수정할 수 있습니다.")}
        onEscalate={() => setNotice("담당자 이관 요청을 등록했습니다.")}
        onApprove={approveTicket}
        isResolved={selected.status === "RESOLVED"}
      />
      <Toast message={notice} onClose={() => setNotice("")} />
    </main>
  );
}
