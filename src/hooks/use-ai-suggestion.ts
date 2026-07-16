import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { getAiSuggestion } from "@/utils/ai-suggestion-client";
import type { AiSuggestion, AiSuggestionRequest } from "@/utils/types";

export const useAiSuggestion = (
  ticketId: string,
  request: AiSuggestionRequest
): UseQueryResult<AiSuggestion, Error> =>
  useQuery<AiSuggestion, Error>({
    queryKey: ["ai-suggestion", ticketId, request],
    queryFn: ({ signal }) => getAiSuggestion(request, signal),
  });
