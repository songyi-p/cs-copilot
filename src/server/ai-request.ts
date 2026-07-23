import { getTicketDetail } from "@/server/ticket-service";
import { searchPolicies } from "@/server/policy-service";
import type { CurrentAgent } from "@/server/current-agent";
import type { AiReq } from "@/utils/types";

export async function buildAiRequest(ticketId: string, agent: CurrentAgent): Promise<AiReq> {
  const detail = await getTicketDetail(ticketId, agent);
  const policies = await searchPolicies({
    title: detail.ticket.title,
    inquiry: detail.ticket.inquiry,
    ticketCategory: detail.ticket.category,
    orderStatus: detail.order?.orderStatus,
  });

  return {
    inquiryTitle: detail.ticket.title,
    inquiryContent: detail.ticket.inquiry,
    ticketCategory: detail.ticket.category,
    order: detail.order
      ? {
          orderId: detail.order.orderId,
          productName: detail.order.productName,
          orderStatus: detail.order.orderStatus,
          orderedAt: detail.order.orderedAt,
          deliveryExpectedAt: detail.order.deliveryExpectedAt,
          deliveredAt: detail.order.deliveredAt,
          paymentAmount: detail.order.paymentAmount,
        }
      : null,
    policies: policies.map(({ policyId, section, content }) => ({ policyId, section, content })),
  };
}
