export type Ticket = {
  ticketId: string;
  customerId: string;
  orderId: string | null;
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
};

export type PolicySearchResult = PolicySearchItem & {
  matchedKeywords: string[];
  score: number;
};

export type RecommendedAction = "REFUND_REVIEW" | "DELAY_COUPON" | "ESCALATE";

export type LlmConfidence = "high" | "medium" | "low";

export type LlmPolicyReference = {
  policyId: string;
  section: string;
  reason: string;
};

export type LlmSuggestion = {
  replyDraft: string;
  policyReferences: LlmPolicyReference[];
  recommendedAction: RecommendedAction;
  confidence: LlmConfidence;
};

export type LlmOrderContext = Pick<
  Order,
  | "orderId"
  | "productName"
  | "orderStatus"
  | "orderedAt"
  | "deliveryExpectedAt"
  | "deliveredAt"
  | "paymentAmount"
>;

export type LlmPolicyContext = Pick<PolicySearchResult, "policyId" | "section" | "content">;

export type LlmSuggestionRequest = {
  inquiry: string;
  order: LlmOrderContext | null;
  policies: LlmPolicyContext[];
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
  aiConfidence?: LlmConfidence;
  policyReferences?: LlmPolicyReference[];
};
