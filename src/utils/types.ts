export type Ticket = {
  ticketId: string;
  customerId: string;
  orderId: string | null;
  inquiry: string;
  category: string;
  status: string;
  createdAt: string;
};

export type Customer = {
  customerId: string;
  name: string;
  grade: string;
  recentOrderCount: number;
  recentCsCount: number;
};

export type Order = {
  orderId: string;
  customerId: string;
  productName: string;
  orderStatus: string;
  orderedAt: string;
  deliveryExpectedAt: string | null;
  deliveredAt: string | null;
  paymentAmount: number;
};

export type PolicyReference = {
  referenceId: string;
  ticketId: string;
  policyId: string;
  section: string;
  reason: string;
};

export type ActionHistory = {
  historyId: string;
  ticketId: string;
  suggestedAction: string;
  finalAction: string;
  aiDecision: "ADOPTED" | "EDITED" | "REJECTED";
  agentId: string;
  createdAt: string;
  finalResponse?: string;
  actionLabel?: string;
};
