import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { getAiSuggestion } from "@/utils/req";
import type { AiReq, AiSuggestion } from "@/utils/types";

export const useAiSuggestion = (
  ticketId: string,
  req: AiReq,
  enabled = true
): UseQueryResult<AiSuggestion, Error> =>
  useQuery<AiSuggestion, Error>({
    queryKey: ["ai-suggestion", ticketId, req],
    queryFn: ({ signal }) => getAiSuggestion(req, signal),
    enabled,
  });
