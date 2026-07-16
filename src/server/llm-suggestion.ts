import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { ZodError } from "zod";
import {
  llmSuggestionRequestSchema,
  llmSuggestionSchema,
  type LlmPolicyContext,
  type LlmSuggestion,
  type LlmSuggestionRequest,
} from "@/utils/llm-schemas";

const DEFAULT_MODEL = "gpt-5-mini";

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

export const parseSuggestionRequest = (value: unknown): LlmSuggestionRequest =>
  llmSuggestionRequestSchema.parse(value);

const validatePolicyReferences = (
  suggestion: LlmSuggestion,
  suppliedPolicies: LlmPolicyContext[]
) => {
  const referencesAreValid = suggestion.policyReferences.every((reference) =>
    suppliedPolicies.some(
      (policy) => policy.policyId === reference.policyId && policy.section === reference.section
    )
  );

  if (!referencesAreValid) {
    throw new LlmSuggestionError(
      "The LLM referenced a policy that was not supplied.",
      "INVALID_RESPONSE"
    );
  }

  return suggestion;
};

export const requestLlmSuggestion = async (
  request: LlmSuggestionRequest
): Promise<LlmSuggestion> => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new LlmSuggestionError("OPENAI_API_KEY is not configured.", "CONFIGURATION");
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
        { role: "user", content: JSON.stringify(request) },
      ],
      text: {
        format: zodTextFormat(llmSuggestionSchema, "cs_copilot_suggestion"),
      },
    });

    if (!response.output_parsed) {
      throw new LlmSuggestionError("The LLM returned no parsed output.", "INVALID_RESPONSE");
    }

    return validatePolicyReferences(response.output_parsed, request.policies);
  } catch (error: unknown) {
    if (error instanceof LlmSuggestionError) throw error;
    if (error instanceof ZodError) {
      throw new LlmSuggestionError("The LLM response failed schema validation.", "INVALID_RESPONSE");
    }
    throw new LlmSuggestionError(
      error instanceof Error ? error.message : "The LLM request failed.",
      "PROVIDER"
    );
  }
};

export const getLlmErrorStatus = (error: unknown) => {
  if (error instanceof LlmSuggestionError && error.code === "CONFIGURATION") return 503;
  if (error instanceof LlmSuggestionError) return 502;
  return 500;
};
