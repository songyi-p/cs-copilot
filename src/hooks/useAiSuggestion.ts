import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { getAiSuggestion } from "@/utils/req";
import type { AiSuggestion } from "@/utils/types";

export const useAiSuggestion = (
  ticketId: string,
  enabled = true
): UseQueryResult<AiSuggestion, Error> =>
  useQuery<AiSuggestion, Error>({
    queryKey: ["ai-suggestion", ticketId],
    queryFn: ({ signal }) => getAiSuggestion(ticketId, signal),
    enabled: enabled && Boolean(ticketId),
  });
