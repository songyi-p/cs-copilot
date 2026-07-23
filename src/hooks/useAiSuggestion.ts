import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { getAiSuggestion } from "@/utils/req";
import type { AiReq, AiSuggestion } from "@/utils/types";

export const useAiSuggestion = (
  ticketId: string,
  req: AiReq | undefined,
  enabled = true
): UseQueryResult<AiSuggestion, Error> =>
  useQuery<AiSuggestion, Error>({
    queryKey: ["ai-suggestion", ticketId, req],
    queryFn: ({ signal }) => {
      if (!req) throw new Error("AI 제안 요청 데이터가 없습니다.");
      return getAiSuggestion(req, signal);
    },
    enabled: enabled && Boolean(req),
  });
