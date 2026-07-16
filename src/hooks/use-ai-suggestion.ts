import { useQuery } from "@tanstack/react-query";
import { getAiSuggestion } from "@/utils/ai-suggestion-client";
import type { LlmSuggestionRequest } from "@/utils/types";

export const useAiSuggestion = (ticketId: string, request: LlmSuggestionRequest) =>
  useQuery({
    queryKey: ["ai-suggestion", ticketId, request],
    queryFn: ({ signal }) => getAiSuggestion(request, signal),
  });
