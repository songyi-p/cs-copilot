import type { AiScore, PolicyRef } from "@/utils/schemas";

export type {
  AiAction,
  AiReq,
  AiScore,
  AiSuggestion,
  ApproveTicketInput,
  OrderContext,
  OrderFacts,
  PolicyContext,
  PolicyRef,
  SaveDraftInput,
  SavedSuggestion,
  TransferTicketInput,
} from "@/utils/schemas";

export type Ticket = {
  ticketId: string;
  customerId: string;
  orderId: string | null;
  title: string;
  inquiry: string;
  category: string;
  status: string;
  createdAt: string;
  assigneeId: string;
};

export type Agent = {
  agentId: string;
  name: string;
  role: "AGENT" | "ADMIN";
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

export type PolicySearchItem = {
  sectionId: string;
  policyId: string;
  policyTitle: string;
  category: string;
  section: string;
  content: string;
  keywords: string[];
  ticketCategories: string[];
  orderStatuses: string[];
};

export type PolicySearchResult = PolicySearchItem & {
  matchedKeywords: string[];
  matchedTerms: string[];
  score: number;
};

export type ActionHistory = {
  historyId: string;
  ticketId: string;
  suggestedAction: string;
  finalAction: string;
  aiDecision?: "ADOPTED" | "EDITED" | "REJECTED";
  agentId: string;
  createdAt: string;
  finalResponse?: string;
  actionLabel?: string;
  eventType?: "DRAFT_SAVED" | "ESCALATED" | "RESPONSE_APPROVED";
  note?: string;
  fromAgentId?: string;
  toAgentId?: string;
  aiConfidenceScore?: AiScore;
  policyReferences?: PolicyRef[];
};

export type TicketListData = {
  tickets: Ticket[];
  customers: Customer[];
};

export type TicketDetailData = {
  ticket: Ticket;
  customer: Customer;
  order?: Order;
  assignee: Agent;
  histories: ActionHistory[];
  draft: string;
};

export type MutationResult = {
  message: string;
};
