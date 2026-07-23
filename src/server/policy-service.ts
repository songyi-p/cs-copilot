import { prisma } from "@/server/prisma";
import type { PolicySearchResult } from "@/utils/types";

type PolicySearchInput = {
  title: string;
  inquiry: string;
  ticketCategory: string;
  orderStatus?: string;
};

const tokenize = (value: string) =>
  value
    .toLocaleLowerCase("ko-KR")
    .split(/[^\p{L}\p{N}]+/u)
    .filter((term) => term.length >= 2);

const normalize = (value: string) => value.toLocaleLowerCase("ko-KR").replace(/\s+/g, " ");

export async function searchPolicies({ title, inquiry, ticketCategory, orderStatus }: PolicySearchInput): Promise<PolicySearchResult[]> {
  const sections = await prisma.policySection.findMany({ include: { policy: true } });
  const terms = [...new Set(tokenize(`${title} ${inquiry}`))];
  return sections
    .map((item) => {
      const policyText = normalize(`${item.policy.title} ${item.section} ${item.content} ${item.keywords.join(" ")}`);
      const matchedTerms = terms.filter((term) => policyText.includes(term));
      const matchedKeywords = item.keywords.filter((keyword) => normalize(`${title} ${inquiry}`).includes(normalize(keyword)));
      const categoryBoost = item.ticketCategories.includes(ticketCategory) ? 9 : 0;
      const orderBoost = orderStatus && item.orderStatuses.includes(orderStatus) ? 4 : 0;
      const score = matchedTerms.length * 2 + matchedKeywords.length * 5 + categoryBoost + orderBoost;
      return {
        sectionId: item.sectionId,
        policyId: item.policyId,
        policyTitle: item.policy.title,
        category: item.policy.category,
        section: item.section,
        content: item.content,
        keywords: item.keywords,
        ticketCategories: item.ticketCategories,
        orderStatuses: item.orderStatuses,
        matchedKeywords,
        matchedTerms,
        score,
      };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.sectionId.localeCompare(right.sectionId, "ko"))
    .slice(0, 3);
}
