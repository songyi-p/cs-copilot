import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { PolicySearchItem, PolicySearchResult, Ticket } from "@/utils/types";
import policySearchIndex from "@/data/policy-search-index.json";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export type StoredTicketState = {
  ticketId: string;
  status?: string;
  assigneeId?: string;
};

export const mergeTicketState = (
  defaults: Ticket[],
  stored: StoredTicketState[],
  assigneeIds: string[]
): Ticket[] => {
  const storedById = new Map(stored.map((ticket) => [ticket.ticketId, ticket]));
  const validIds = new Set(assigneeIds);

  return defaults.map((ticket) => {
    const saved = storedById.get(ticket.ticketId);
    return {
      ...ticket,
      status: saved?.status ?? ticket.status,
      assigneeId:
        saved?.assigneeId && validIds.has(saved.assigneeId)
          ? saved.assigneeId
          : ticket.assigneeId,
    };
  });
};

const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim();
const MIN_POLICY_SCORE = 20;

const tokenize = (value: string) =>
  normalize(value)
    .replace(/[^0-9a-z가-힣\s]/g, " ")
    .split(/\s+/)
    .filter((term) => term.length >= 2);

export type PolicySearchInput = {
  title: string;
  inquiry: string;
  ticketCategory: string;
  orderStatus?: string;
};

export const searchPolicies = (
  { title, inquiry, ticketCategory, orderStatus }: PolicySearchInput,
  limit = 3
): PolicySearchResult[] => {
  const normalizedText = normalize(`${title} ${inquiry}`);
  const terms = [...new Set(tokenize(normalizedText))];

  return (policySearchIndex as PolicySearchItem[])
    .map((item) => {
      const matchedKeywords = item.keywords.filter((keyword) =>
        normalizedText.includes(normalize(keyword))
      );
      const policyText = normalize(
        `${item.policyTitle} ${item.section} ${item.content} ${item.keywords.join(" ")}`
      );
      const matchedTerms = terms.filter((term) => policyText.includes(term));
      const categoryScore = item.ticketCategories.includes(ticketCategory) ? 40 : 0;
      const orderStatusScore =
        orderStatus && item.orderStatuses.includes(orderStatus) ? 12 : 0;
      const keywordScore = matchedKeywords.reduce(
        (total, keyword) => total + Math.min(normalize(keyword).length * 3, 30),
        0
      );
      const termScore = Math.min(matchedTerms.length * 2, 16);
      const score = categoryScore + orderStatusScore + keywordScore + termScore;

      return { ...item, matchedKeywords, matchedTerms, score };
    })
    .filter((item) => item.score >= MIN_POLICY_SCORE)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.matchedKeywords.length - a.matchedKeywords.length ||
        a.sectionId.localeCompare(b.sectionId)
    )
    .slice(0, limit);
};
