import axios from "axios";
import { z } from "zod";
import {
  aiSuggestionSchema,
  type AiSuggestion,
  type AiReq,
} from "@/utils/schemas";
import type {
  Agent,
  ApproveTicketInput,
  MutationResult,
  Order,
  PolicySearchResult,
  SaveDraftInput,
  Ticket,
  TicketDetailData,
  TicketListData,
  TransferTicketInput,
} from "@/utils/types";

const errorResponseSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
});

const apiClient = axios.create({
  headers: { "Content-Type": "application/json" },
  timeout: 100_000,
});

const toRequestError = (error: unknown, fallback: string) => {
  if (axios.isCancel(error)) return error;

  if (axios.isAxiosError(error)) {
    const parsedError = errorResponseSchema.safeParse(error.response?.data);
    return new Error(parsedError.success ? parsedError.data.error : fallback);
  }

  return error instanceof Error ? error : new Error(fallback);
};

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
  ticketId: string,
  signal?: AbortSignal
): Promise<AiSuggestion> => {
  try {
    const res = await apiClient.post<unknown>("/api/ai-suggestion", { ticketId }, { signal });
    return aiSuggestionSchema.parse(res.data);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      throw new Error("AI 제안 응답 형식이 올바르지 않습니다.");
    }

    throw toRequestError(error, "AI 제안을 생성하지 못했습니다.");
  }
};

export const getTickets = async (signal?: AbortSignal): Promise<TicketListData> => {
  try {
    const res = await apiClient.get<TicketListData>("/api/tickets", { signal });
    return res.data;
  } catch (error) {
    throw toRequestError(error, "문의 목록을 불러오지 못했습니다.");
  }
};

export const getTicketDetail = async (
  ticketId: string,
  signal?: AbortSignal
): Promise<TicketDetailData> => {
  try {
    const res = await apiClient.get<TicketDetailData>(`/api/tickets/${ticketId}`, {
      signal,
    });
    return res.data;
  } catch (error) {
    throw toRequestError(error, "문의 상세 정보를 불러오지 못했습니다.");
  }
};

export const getAgents = async (signal?: AbortSignal): Promise<Agent[]> => {
  try {
    const res = await apiClient.get<{ agents: Agent[] }>("/api/agents", { signal });
    return res.data.agents;
  } catch (error) {
    throw toRequestError(error, "상담사 목록을 불러오지 못했습니다.");
  }
};

export const saveTicketDraft = async (
  ticketId: string,
  input: SaveDraftInput
): Promise<MutationResult> => {
  try {
    const res = await apiClient.put<MutationResult>(
      `/api/tickets/${ticketId}/draft`,
      input
    );
    return res.data;
  } catch (error) {
    throw toRequestError(error, "답변 초안을 저장하지 못했습니다.");
  }
};

export const approveTicketResponse = async (
  ticketId: string,
  input: ApproveTicketInput
): Promise<MutationResult> => {
  try {
    const res = await apiClient.post<MutationResult>(
      `/api/tickets/${ticketId}/approve`,
      input
    );
    return res.data;
  } catch (error) {
    throw toRequestError(error, "답변을 승인하지 못했습니다.");
  }
};

export const transferTicketToAgent = async (
  ticketId: string,
  input: TransferTicketInput
): Promise<MutationResult> => {
  try {
    const res = await apiClient.post<MutationResult>(
      `/api/tickets/${ticketId}/transfer`,
      input
    );
    return res.data;
  } catch (error) {
    throw toRequestError(error, "티켓을 이관하지 못했습니다.");
  }
};
