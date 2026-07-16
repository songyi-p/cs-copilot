import type { LlmSuggestion } from "@/utils/types";
import { confidenceLabel, recommendedActionLabel } from "@/utils/constants";
import { cn } from "@/utils/cn";

const sectionLabelClass = "mb-2.75 text-[11px] font-extrabold text-label";
const confidenceStyles = {
  high: "bg-[#e8f7f0] text-[#3c8a6a]",
  medium: "bg-status-review-bg text-status-review",
  low: "bg-status-escalated-bg text-status-escalated",
};

export function AiAssistant({
  suggestion,
  status,
  error,
  draft,
  onDraftChange,
  onRetry,
  canEdit,
}: {
  suggestion?: LlmSuggestion;
  status: "loading" | "success" | "error";
  error: string;
  draft: string;
  onDraftChange: (draft: string) => void;
  onRetry: () => void;
  canEdit: boolean;
}) {
  const response = draft || suggestion?.replyDraft || "";
  const displayedAction =
    suggestion?.confidence === "low"
      ? "담당자 이관 권장"
      : suggestion
        ? recommendedActionLabel[suggestion.recommendedAction]
        : "AI 제안을 기다리는 중입니다.";

  return (
    <aside className="min-h-0 overflow-y-auto border-l border-line bg-white px-6.5 py-7.25 scrollbar-gutter-stable max-dashboard:col-span-full max-dashboard:border-t max-dashboard:border-l-0 max-mobile:px-4 max-mobile:py-5.5">
      <div className="mb-7 flex items-start justify-between">
        <div className="relative pl-6.25">
          <span className="absolute top-0.75 left-0 text-[17px] text-ai">✦</span>
          <p className="mb-1 font-mono text-[10px] font-medium tracking-[1.3px] text-eyebrow">
            AI COPILOT
          </p>
          <h2 className="m-0 text-[19px] font-bold tracking-[-0.5px]">처리 제안</h2>
        </div>
        {suggestion ? (
          <span
            className={cn(
              "rounded-[3px] px-1.75 py-1 text-[10px] font-bold",
              confidenceStyles[suggestion.confidence]
            )}
          >
            {confidenceLabel[suggestion.confidence]}
          </span>
        ) : (
          <span className="rounded-[3px] bg-[#eef1f5] px-1.75 py-1 text-[10px] font-bold text-faint">
            {status === "loading" ? "생성 중" : "생성 실패"}
          </span>
        )}
      </div>

      {status === "loading" && (
        <div className="mb-5 rounded-md border border-[#dce2ea] bg-[#f7f9fc] px-3.5 py-3 text-xs text-muted">
          주문 정보와 검색된 정책을 바탕으로 AI 제안을 생성하고 있습니다.
        </div>
      )}
      {status === "error" && (
        <div className="mb-5 rounded-md border border-[#f0cccc] bg-[#fff7f7] px-3.5 py-3">
          <p className="m-0 text-xs font-semibold text-status-escalated">{error}</p>
          <button
            className="mt-2 rounded border border-[#e2b6b6] bg-white px-2.5 py-1.5 text-[11px] font-bold text-status-escalated"
            onClick={onRetry}
            type="button"
          >
            다시 시도
          </button>
        </div>
      )}

      <section className="mb-5 border-b border-line pb-5 max-dashboard:max-w-162.5">
        <div className={sectionLabelClass}>
          답변 초안{" "}
          {suggestion && <span className="ml-1.5 font-semibold text-[#7790de]">AI 생성</span>}
        </div>
        {!canEdit && (
          <p className="mb-2.5 rounded-md bg-status-review-bg px-3 py-2 text-[11px] font-semibold text-[#8b641d]">
            현재 담당자만 답변을 수정하고 승인할 수 있습니다.
          </p>
        )}
        <textarea
          className="min-h-33.75 w-full resize-y rounded-md border border-[#dce2ea] bg-[#fbfcff] p-3.25 text-xs leading-[1.7] text-[#344052] outline-[#7389e8] select-text disabled:cursor-not-allowed disabled:bg-[#f3f5f8] disabled:text-[#788394]"
          value={response}
          onChange={(event) => onDraftChange(event.target.value)}
          aria-label="답변 초안"
          placeholder={
            status === "error" ? "AI 제안 없이 직접 답변을 작성할 수 있습니다." : "AI 답변 생성 중"
          }
          disabled={!canEdit || status === "loading"}
        />
      </section>

      <section className="mb-5 border-b border-line pb-5 max-dashboard:max-w-162.5">
        <div className={sectionLabelClass}>정책 근거</div>
        {suggestion?.policyReferences.length ? (
          suggestion.policyReferences.map((reference) => (
            <div
              className="my-3.25 flex gap-2.5"
              key={`${reference.policyId}-${reference.section}`}
            >
              <span className="grid size-6.25 shrink-0 place-items-center rounded bg-[#f0edff] text-[#7968da]">
                ▤
              </span>
              <div>
                <strong className="text-xs">{reference.section}</strong>
                <p className="my-0.75 text-[11px] leading-[1.45] text-muted">
                  {reference.reason}
                </p>
                <small className="font-mono text-[9px] text-faint">{reference.policyId}</small>
              </div>
            </div>
          ))
        ) : (
          <p className="m-0 text-xs text-faint">
            {status === "loading" ? "정책 근거를 확인하고 있습니다." : "표시할 정책 근거가 없습니다."}
          </p>
        )}
      </section>

      <section
        className={cn(
          "rounded-[7px] border p-3.75",
          suggestion?.confidence === "low"
            ? "border-[#efcccc] bg-[#fff7f7]"
            : "border-[#d9d5f5] bg-[#f7f5ff]"
        )}
      >
        <div
          className={cn(
            "mb-2.75 text-[11px] font-extrabold",
            suggestion?.confidence === "low" ? "text-status-escalated" : "text-[#7667bd]"
          )}
        >
          권장 처리안
        </div>
        <strong className="text-xs leading-[1.6]">{displayedAction}</strong>
        <p className="mt-1.75 mb-0 text-[11px] text-[#778199]">
          {suggestion?.confidence === "low"
            ? "정책 근거가 충분하지 않아 담당자 확인이 필요합니다."
            : "주문 상태와 검색된 정책을 반영한 제안입니다."}
        </p>
      </section>
    </aside>
  );
}
