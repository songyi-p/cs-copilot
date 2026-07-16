"use client";

import { useMemo, useState } from "react";
import { ActionBar } from "@/components/dashboard/ActionBar";
import { AiAssistant } from "@/components/dashboard/AiAssistant";
import { AppHeader } from "@/components/dashboard/AppHeader";
import { TicketDetail } from "@/components/dashboard/TicketDetail";
import { TicketList } from "@/components/dashboard/TicketList";
import type { Customer, Order, PolicyReference, Ticket } from "@/components/dashboard/types";
import customersData from "@/data/customers.json";
import ordersData from "@/data/orders.json";
import policyReferencesData from "@/data/policy-references.json";
import ticketsData from "@/data/tickets.json";

const tickets = ticketsData as Ticket[];
const customers = customersData as Customer[];
const orders = ordersData as Order[];
const policyReferences = policyReferencesData as PolicyReference[];

export default function Home() {
  const [selectedId, setSelectedId] = useState(tickets[0].ticketId);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState("");
  const selected = useMemo(
    () => tickets.find((ticket) => ticket.ticketId === selectedId)!,
    [selectedId]
  );
  const customer = customers.find((item) => item.customerId === selected.customerId)!;
  const order = orders.find((item) => item.orderId === selected.orderId);
  const references = policyReferences.filter((item) => item.ticketId === selected.ticketId);

  const selectTicket = (ticket: Ticket) => {
    setSelectedId(ticket.ticketId);
    setDraft("");
    setNotice("");
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
        <TicketDetail ticket={selected} customer={customer} order={order} />
        <AiAssistant
          ticket={selected}
          customerName={customer.name}
          order={order}
          references={references}
          draft={draft}
          onDraftChange={setDraft}
        />
      </section>
      <ActionBar notice={notice} onAction={setNotice} />
    </main>
  );
}
