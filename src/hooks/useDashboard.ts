"use client";

import { useMemo } from "react";
import { useAiSuggestion } from "@/hooks/useAiSuggestion";
import { useTicketWorkspace } from "@/hooks/useTicketWorkspace";
import { searchPolicies } from "@/utils/lib";
import { buildAiReq } from "@/utils/req";
import type { Customer, Order } from "@/utils/types";
import customerData from "@/data/customers.json";
import orderData from "@/data/orders.json";

const customers = customerData as Customer[];
const orders = orderData as Order[];

export function useDashboard() {
  const workspace = useTicketWorkspace();
  const { ticket } = workspace;
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
  const aiReq = useMemo(() => buildAiReq(ticket, order, policies), [order, policies, ticket]);
  const aiQuery = useAiSuggestion(ticket.ticketId, aiReq, !workspace.aiDisabled);
  const suggestion = workspace.aiDisabled ? undefined : aiQuery.data;
  const aiStatus: "loading" | "error" | "success" = aiQuery.isFetching
    ? "loading"
    : aiQuery.isError
      ? "error"
      : "success";

  return {
    ...workspace,
    customers,
    customer,
    order,
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
