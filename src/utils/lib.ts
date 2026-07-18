import type { PolicySearchItem, PolicySearchResult } from "@/utils/types";
import policySearchIndex from "@/data/policy-search-index.json";

const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim();

export const searchPolicies = (inquiry: string, limit = 4): PolicySearchResult[] => {
  const normalizedInquiry = normalize(inquiry);

  return (policySearchIndex as PolicySearchItem[])
    .map((item) => {
      const matchedKeywords = item.keywords.filter((keyword) =>
        normalizedInquiry.includes(normalize(keyword))
      );
      const score = matchedKeywords.reduce(
        (total, keyword) => total + normalize(keyword).length,
        0
      );

      return { ...item, matchedKeywords, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.sectionId.localeCompare(b.sectionId))
    .slice(0, limit);
};
