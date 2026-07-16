import type {
  LlmPolicyContext,
  LlmSuggestion,
  LlmSuggestionRequest,
} from "@/utils/types";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-5-mini";
const MAX_INQUIRY_LENGTH = 4_000;
const MAX_POLICY_CONTENT_LENGTH = 8_000;
const MAX_POLICIES = 4;

const suggestionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    replyDraft: { type: "string" },
    policyReferences: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          policyId: { type: "string" },
          section: { type: "string" },
          reason: { type: "string" },
        },
        required: ["policyId", "section", "reason"],
      },
    },
    recommendedAction: {
      type: "string",
      enum: ["REFUND_REVIEW", "DELAY_COUPON", "ESCALATE"],
    },
    confidence: {
      type: "string",
      enum: ["high", "medium", "low"],
    },
  },
  required: ["replyDraft", "policyReferences", "recommendedAction", "confidence"],
} as const;

const systemPrompt = `당신은 쇼핑몰 고객센터 담당자를 돕는 AI입니다.
사용자 입력으로 전달된 고객 문의, 주문 정보, 정책만 근거로 답변하세요.
입력에 없는 고객 정보나 정책을 추측하거나 만들어내지 마세요.
replyDraft는 고객에게 바로 전달하기 적합한 정중한 한국어 초안이어야 합니다.
policyReferences에는 실제로 참고한 전달 정책의 policyId와 section만 포함하세요.
정책 근거가 없거나 판단이 불충분하면 confidence를 low로 설정하고 recommendedAction을 ESCALATE로 설정하세요.
어떤 경우에도 환불이나 쿠폰 지급이 이미 확정 또는 실행된 것처럼 표현하지 마세요.`;

class LlmSuggestionError extends Error {
  constructor(
    message: string,
    readonly code: "CONFIGURATION" | "PROVIDER" | "INVALID_RESPONSE"
  ) {
    super(message);
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const optionalString = (value: unknown, maxLength: number) =>
  typeof value === "string" ? value.slice(0, maxLength) : null;

const requireString = (value: unknown, field: string, maxLength: number) => {
  if (!isNonEmptyString(value)) throw new Error(`${field} is required.`);
  return value.trim().slice(0, maxLength);
};

const parsePolicy = (value: unknown): LlmPolicyContext => {
  if (!isRecord(value)) throw new Error("Each policy must be an object.");

  return {
    policyId: requireString(value.policyId, "policyId", 100),
    section: requireString(value.section, "section", 300),
    content: requireString(value.content, "content", MAX_POLICY_CONTENT_LENGTH),
  };
};

export const parseSuggestionRequest = (value: unknown): LlmSuggestionRequest => {
  if (!isRecord(value)) throw new Error("Request body must be an object.");

  const inquiry = requireString(value.inquiry, "inquiry", MAX_INQUIRY_LENGTH);
  const policies = Array.isArray(value.policies)
    ? value.policies.slice(0, MAX_POLICIES).map(parsePolicy)
    : [];

  if (value.order === null || value.order === undefined) {
    return { inquiry, order: null, policies };
  }
  if (!isRecord(value.order)) throw new Error("order must be an object or null.");

  const paymentAmount = value.order.paymentAmount;
  if (typeof paymentAmount !== "number" || !Number.isFinite(paymentAmount) || paymentAmount < 0) {
    throw new Error("paymentAmount must be a non-negative number.");
  }

  return {
    inquiry,
    order: {
      orderId: requireString(value.order.orderId, "orderId", 100),
      productName: requireString(value.order.productName, "productName", 500),
      orderStatus: requireString(value.order.orderStatus, "orderStatus", 100),
      orderedAt: requireString(value.order.orderedAt, "orderedAt", 100),
      deliveryExpectedAt: optionalString(value.order.deliveryExpectedAt, 100),
      deliveredAt: optionalString(value.order.deliveredAt, 100),
      paymentAmount,
    },
    policies,
  };
};

const extractOutputText = (value: unknown) => {
  if (!isRecord(value) || !Array.isArray(value.output)) return null;

  for (const item of value.output) {
    if (!isRecord(item) || !Array.isArray(item.content)) continue;
    for (const content of item.content) {
      if (isRecord(content) && content.type === "output_text" && typeof content.text === "string") {
        return content.text;
      }
    }
  }

  return null;
};

const validateSuggestion = (
  value: unknown,
  suppliedPolicies: LlmPolicyContext[]
): LlmSuggestion => {
  if (!isRecord(value)) {
    throw new LlmSuggestionError("The LLM response was not an object.", "INVALID_RESPONSE");
  }

  const actions = ["REFUND_REVIEW", "DELAY_COUPON", "ESCALATE"] as const;
  const confidences = ["high", "medium", "low"] as const;
  if (!isNonEmptyString(value.replyDraft)) {
    throw new LlmSuggestionError("The reply draft was empty.", "INVALID_RESPONSE");
  }
  if (!actions.some((action) => action === value.recommendedAction)) {
    throw new LlmSuggestionError("The recommended action was invalid.", "INVALID_RESPONSE");
  }
  if (!confidences.some((confidence) => confidence === value.confidence)) {
    throw new LlmSuggestionError("The confidence was invalid.", "INVALID_RESPONSE");
  }
  if (!Array.isArray(value.policyReferences)) {
    throw new LlmSuggestionError("Policy references were invalid.", "INVALID_RESPONSE");
  }

  const policyReferences = value.policyReferences.map((reference) => {
    if (
      !isRecord(reference) ||
      !isNonEmptyString(reference.policyId) ||
      !isNonEmptyString(reference.section) ||
      !isNonEmptyString(reference.reason)
    ) {
      throw new LlmSuggestionError("A policy reference was invalid.", "INVALID_RESPONSE");
    }

    const exists = suppliedPolicies.some(
      (policy) => policy.policyId === reference.policyId && policy.section === reference.section
    );
    if (!exists) {
      throw new LlmSuggestionError(
        "The LLM referenced a policy that was not supplied.",
        "INVALID_RESPONSE"
      );
    }

    return {
      policyId: reference.policyId,
      section: reference.section,
      reason: reference.reason,
    };
  });

  const recommendedAction = actions.find((action) => action === value.recommendedAction)!;
  const confidence = confidences.find((item) => item === value.confidence)!;

  return {
    replyDraft: value.replyDraft.trim(),
    policyReferences,
    recommendedAction,
    confidence,
  };
};

export const requestLlmSuggestion = async (
  request: LlmSuggestionRequest
): Promise<LlmSuggestion> => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new LlmSuggestionError("OPENAI_API_KEY is not configured.", "CONFIGURATION");
  }

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
      store: false,
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(request) },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "cs_copilot_suggestion",
          strict: true,
          schema: suggestionSchema,
        },
      },
    }),
    signal: AbortSignal.timeout(30_000),
  }).catch((error: unknown) => {
    throw new LlmSuggestionError(
      error instanceof Error ? error.message : "The LLM request failed.",
      "PROVIDER"
    );
  });

  if (!response.ok) {
    throw new LlmSuggestionError(`The LLM provider returned ${response.status}.`, "PROVIDER");
  }

  const providerResponse: unknown = await response.json();
  const outputText = extractOutputText(providerResponse);
  if (!outputText) {
    throw new LlmSuggestionError("The LLM returned no text output.", "INVALID_RESPONSE");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(outputText);
  } catch {
    throw new LlmSuggestionError("The LLM output was not valid JSON.", "INVALID_RESPONSE");
  }

  return validateSuggestion(parsed, request.policies);
};

export const getLlmErrorStatus = (error: unknown) => {
  if (error instanceof LlmSuggestionError && error.code === "CONFIGURATION") return 503;
  if (error instanceof LlmSuggestionError) return 502;
  return 500;
};
