import type { PolicySearchItem, PolicySearchResult } from "@/utils/types";
import policySearchIndex from "@/data/policy-search-index.json";

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
  limit = 5
): PolicySearchResult[] => {
  const normalizedInquiry = normalize(`${title} ${inquiry}`);
  const inquiryTerms = [...new Set(tokenize(normalizedInquiry))];

  return (policySearchIndex as PolicySearchItem[])
    .map((item) => {
      const matchedKeywords = item.keywords.filter((keyword) =>
        normalizedInquiry.includes(normalize(keyword))
      );
      const searchablePolicy = normalize(
        `${item.policyTitle} ${item.section} ${item.content} ${item.keywords.join(" ")}`
      );
      const matchedTerms = inquiryTerms.filter((term) => searchablePolicy.includes(term));
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
