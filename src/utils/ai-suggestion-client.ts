import type { LlmSuggestion, LlmSuggestionRequest } from "@/utils/types";

const requestCache = new Map<string, Promise<LlmSuggestion>>();

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isSuggestion = (value: unknown): value is LlmSuggestion => {
  if (!isRecord(value)) return false;
  if (typeof value.replyDraft !== "string" || !value.replyDraft.trim()) return false;
  if (!Array.isArray(value.policyReferences)) return false;
  if (
    typeof value.recommendedAction !== "string" ||
    !["REFUND_REVIEW", "DELAY_COUPON", "ESCALATE"].includes(value.recommendedAction)
  ) {
    return false;
  }
  if (
    typeof value.confidence !== "string" ||
    !["high", "medium", "low"].includes(value.confidence)
  ) {
    return false;
  }

  return value.policyReferences.every(
    (reference) =>
      isRecord(reference) &&
      typeof reference.policyId === "string" &&
      typeof reference.section === "string" &&
      typeof reference.reason === "string"
  );
};

const readErrorMessage = (value: unknown) =>
  isRecord(value) && typeof value.error === "string"
    ? value.error
    : "AI 제안을 생성하지 못했습니다.";

const executeRequest = async (request: LlmSuggestionRequest) => {
  const response = await fetch("/api/ai-suggestion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) throw new Error(readErrorMessage(payload));
  if (!isSuggestion(payload)) throw new Error("AI 제안 응답 형식이 올바르지 않습니다.");
  return payload;
};

export const getAiSuggestion = (
  request: LlmSuggestionRequest,
  requestVersion = 0
): Promise<LlmSuggestion> => {
  const cacheKey = `${requestVersion}:${JSON.stringify(request)}`;

  const cached = requestCache.get(cacheKey);
  if (cached) return cached;

  const pending = executeRequest(request).catch((error: unknown) => {
    requestCache.delete(cacheKey);
    throw error;
  });
  requestCache.set(cacheKey, pending);
  return pending;
};
