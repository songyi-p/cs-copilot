import axios from "axios";
import { z } from "zod";
import {
  aiSuggestionSchema,
  type AiSuggestion,
  type AiReq,
} from "@/utils/schemas";
import type { Order, PolicySearchResult, Ticket } from "@/utils/types";

const errorResponseSchema = z.object({ error: z.string() });

const apiClient = axios.create({
  headers: { "Content-Type": "application/json" },
  timeout: 100_000,
});

export const buildAiReq = (
  ticket: Ticket,
  order: Order | undefined,
  policies: PolicySearchResult[]
): AiReq => ({
  inquiryTitle: ticket.title,
  inquiryContent: ticket.inquiry,
  ticketCategory: ticket.category,
  order: order
    ? {
        orderId: order.orderId,
        productName: order.productName,
        orderStatus: order.orderStatus,
        orderedAt: order.orderedAt,
        deliveryExpectedAt: order.deliveryExpectedAt,
        deliveredAt: order.deliveredAt,
        paymentAmount: order.paymentAmount,
      }
    : null,
  policies: policies.map(({ policyId, section, content }) => ({
    policyId,
    section,
    content,
  })),
});

export const getAiSuggestion = async (
  req: AiReq,
  signal?: AbortSignal
): Promise<AiSuggestion> => {
  try {
    const res = await apiClient.post<unknown>("/api/ai-suggestion", req, { signal });
    return aiSuggestionSchema.parse(res.data);
  } catch (error: unknown) {
    if (axios.isCancel(error)) throw error;

    if (axios.isAxiosError(error)) {
      const parsedError = errorResponseSchema.safeParse(error.response?.data);
      throw new Error(
        parsedError.success ? parsedError.data.error : "AI 제안을 생성하지 못했습니다."
      );
    }

    if (error instanceof z.ZodError) {
      throw new Error("AI 제안 응답 형식이 올바르지 않습니다.");
    }

    throw error instanceof Error ? error : new Error("AI 제안을 생성하지 못했습니다.");
  }
};
