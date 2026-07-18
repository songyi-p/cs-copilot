import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { ZodError } from "zod";
import {
  aiSuggestionRequestSchema,
  aiSuggestionSchema,
  type AiOrderContext,
  type AiOrderFacts,
  type AiPolicyContext,
  type AiSuggestion,
  type AiSuggestionRequest,
} from "@/utils/ai-schemas";

const DEFAULT_MODEL = "gpt-5.4-nano";

const systemPrompt = `역할: 당신은 쇼핑몰 고객센터 담당자의 판단을 돕는 AI 코파일럿입니다.

목표:
- 전달된 고객 문의, 관련 주문 정보, 정책 섹션만 사용해 고객 답변 초안과 다음 처리안을 제안하세요.
- 정책 조건과 주문 사실을 대조하고, 부족한 정보가 있으면 구체적으로 밝히세요.

근거 및 안전 기준:
- 입력에 없는 고객 정보, 재고, 배송 추적 결과, 증빙 확인 결과 또는 정책을 추측하거나 만들어내지 마세요.
- policyReferences에는 실제 판단에 사용한 전달 정책의 policyId와 section만 포함하세요.
- 환불, 취소, 교환, 쿠폰 지급이 이미 승인되거나 실행된 것처럼 표현하지 마세요.
- 외부 확인이나 담당자 승인이 필요하면 reviewRequired를 true로 설정하세요.

recommendedAction 선택 기준:
- REFUND_REVIEW: 정책상 환불 조건 검토
- DELAY_COUPON: 배송 지연 쿠폰 발급 검토
- EXCHANGE_REVIEW: 사이즈·색상 교환 검토
- RETURN_REVIEW: 반품 가능 여부 검토
- DEFECT_EVIDENCE_REQUEST: 불량·오배송 증빙 요청 또는 확인
- CANCELLATION_REQUEST: 출고 전 주문 취소 접수 또는 검토
- ORDER_CHANGE_CHECK: 주문 옵션·수량·합배송 가능 여부 확인
- ADDRESS_CHANGE_CHECK: 배송지 변경 가능 여부 확인
- DELIVERY_TRACE: 배송 지연·완료 미수령에 대한 택배사 추적 확인
- REFUND_STATUS_NOTICE: 환불 반영 기간 안내
- MEMBERSHIP_GUIDE: 회원 등급 혜택 안내
- ESCALATE: 적용 정책이 없거나 상충해 담당자 판단 없이는 안전한 다음 단계를 정할 수 없음

confidenceScore 기준:
- 1점: 적용 정책이 없거나 상충하며, 핵심 사실도 부족해 안전한 다음 단계를 정할 수 없음
- 2점: 관련 정책은 있으나 핵심 사실이 부족해 담당자 판단 또는 이관이 필요함
- 3점: 적용 정책과 다음 단계는 식별했지만 사진, 재고, 택배사 또는 출고 여부 확인이 필요함
- 4점: 정책과 주문 사실이 처리안을 충분히 뒷받침하지만 실제 승인 또는 실행은 담당자가 해야 함
- 5점: 필요한 정책과 사실이 모두 있고 외부 확인이나 재량 판단 없이 정확한 정보 안내가 가능함

출력 기준:
- replyDraft는 바로 검토할 수 있는 정중한 한국어로 공백 포함 800자 이내로 작성하세요.
- confidenceReason에는 해당 점수를 준 핵심 근거를 간결하게 설명하세요.
- missingInformation에는 판단을 높이기 위해 실제로 필요한 정보만 넣고, 없으면 빈 배열을 반환하세요.
- 정책 근거가 전혀 없으면 confidenceScore는 1점, recommendedAction은 ESCALATE로 설정하세요.`;

const MS_PER_DAY = 24 * 60 * 60 * 1_000;

const startOfUtcDay = (value: string | Date) => {
  const date = typeof value === "string" ? new Date(`${value.slice(0, 10)}T00:00:00Z`) : value;
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

const elapsedCalendarDays = (from: string, to: Date) =>
  Math.max(0, Math.floor((startOfUtcDay(to) - startOfUtcDay(from)) / MS_PER_DAY));

export const deriveOrderFacts = (
  order: AiOrderContext,
  evaluatedAt = new Date()
): AiOrderFacts => ({
  ...order,
  evaluatedAt: evaluatedAt.toISOString(),
  daysPastDeliveryExpected: order.deliveryExpectedAt
    ? elapsedCalendarDays(order.deliveryExpectedAt, evaluatedAt)
    : null,
  daysSinceDelivered: order.deliveredAt
    ? elapsedCalendarDays(order.deliveredAt, evaluatedAt)
    : null,
  isBeforeShipment: order.orderStatus === "PAID" || order.orderStatus === "PREPARING",
});

export const buildAiSuggestionContext = (
  request: AiSuggestionRequest,
  evaluatedAt = new Date()
) => ({
  inquiry: {
    title: request.inquiryTitle,
    content: request.inquiryContent,
    category: request.ticketCategory,
  },
  order: request.order ? deriveOrderFacts(request.order, evaluatedAt) : null,
  policies: request.policies,
});

class AiSuggestionError extends Error {
  constructor(
    message: string,
    readonly code: "CONFIGURATION" | "PROVIDER" | "INVALID_RESPONSE"
  ) {
    super(message);
  }
}

export const parseAiSuggestionRequest = (value: unknown): AiSuggestionRequest =>
  aiSuggestionRequestSchema.parse(value);

const validateAndNormalizeSuggestion = (
  suggestion: AiSuggestion,
  suppliedPolicies: AiPolicyContext[]
) => {
  const referencesAreValid = suggestion.policyReferences.every((reference) =>
    suppliedPolicies.some(
      (policy) => policy.policyId === reference.policyId && policy.section === reference.section
    )
  );

  if (!referencesAreValid) {
    throw new AiSuggestionError(
      "The AI referenced a policy that was not supplied.",
      "INVALID_RESPONSE"
    );
  }

  const hasReferences = suggestion.policyReferences.length > 0;
  const hasMissingInformation = suggestion.missingInformation.length > 0;
  const isInformationOnlyAction =
    suggestion.recommendedAction === "REFUND_STATUS_NOTICE" ||
    suggestion.recommendedAction === "MEMBERSHIP_GUIDE";
  const reviewRequired =
    !hasReferences || hasMissingInformation || !isInformationOnlyAction || suggestion.reviewRequired;
  const confidenceScore = !hasReferences
    ? 1
    : suggestion.recommendedAction === "ESCALATE"
      ? Math.min(suggestion.confidenceScore, 2)
      : hasMissingInformation
        ? Math.min(suggestion.confidenceScore, 3)
        : reviewRequired
          ? Math.min(suggestion.confidenceScore, 4)
          : suggestion.confidenceScore;
  const shouldEscalate = !hasReferences || confidenceScore === 1;

  return {
    ...suggestion,
    confidenceScore,
    recommendedAction: shouldEscalate ? "ESCALATE" : suggestion.recommendedAction,
    reviewRequired,
  } satisfies AiSuggestion;
};

export const requestAiSuggestion = async (
  request: AiSuggestionRequest
): Promise<AiSuggestion> => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new AiSuggestionError("OPENAI_API_KEY is not configured.", "CONFIGURATION");
  }

  const openai = new OpenAI({
    apiKey,
    timeout: 30_000,
    maxRetries: 2,
  });

  try {
    const response = await openai.responses.parse({
      model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
      store: false,
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(buildAiSuggestionContext(request)) },
      ],
      text: {
        format: zodTextFormat(aiSuggestionSchema, "cs_copilot_suggestion"),
      },
    });

    if (!response.output_parsed) {
      throw new AiSuggestionError("The AI returned no parsed output.", "INVALID_RESPONSE");
    }

    return validateAndNormalizeSuggestion(response.output_parsed, request.policies);
  } catch (error: unknown) {
    if (error instanceof AiSuggestionError) throw error;
    if (error instanceof ZodError) {
      throw new AiSuggestionError("The AI response failed schema validation.", "INVALID_RESPONSE");
    }
    throw new AiSuggestionError(
      error instanceof Error ? error.message : "The AI request failed.",
      "PROVIDER"
    );
  }
};

export const getAiErrorStatus = (error: unknown) => {
  if (error instanceof AiSuggestionError && error.code === "CONFIGURATION") return 503;
  if (error instanceof AiSuggestionError) return 502;
  return 500;
};
