import axios from "axios";
import { z } from "zod";
import { llmSuggestionSchema, type LlmSuggestionRequest } from "@/utils/llm-schemas";

const errorResponseSchema = z.object({ error: z.string() });

const apiClient = axios.create({
  headers: { "Content-Type": "application/json" },
  timeout: 100_000,
});

export const getAiSuggestion = async (
  request: LlmSuggestionRequest,
  signal?: AbortSignal
) => {
  try {
    const response = await apiClient.post<unknown>("/api/ai-suggestion", request, { signal });
    return llmSuggestionSchema.parse(response.data);
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
