import type { Order, PolicySearchResult, Ticket } from "@/utils/types";
import { createDraft, createRecommendedAction } from "@/utils/lib";

const sectionLabelClass = "mb-2.75 text-[11px] font-extrabold text-label";

export function AiAssistant({
  ticket,
  customerName,
  order,
  policyResults,
  draft,
  onDraftChange,
  canEdit,
}: {
  ticket: Ticket;
  customerName: string;
  order?: Order;
  policyResults: PolicySearchResult[];
  draft: string;
  onDraftChange: (draft: string) => void;
  canEdit: boolean;
}) {
  const response = draft || createDraft(ticket, customerName, order);
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
        <span className="rounded-[3px] bg-[#e8f7f0] px-1.75 py-1 text-[10px] font-bold text-[#3c8a6a]">
          신뢰도 높음
        </span>
      </div>
      <section className="mb-5 border-b border-line pb-5 max-dashboard:max-w-162.5">
        <div className={sectionLabelClass}>
          AI 답변 초안 <span className="ml-1.5 font-semibold text-[#7790de]">자동 생성</span>
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
          aria-label="AI 답변 초안"
          disabled={!canEdit}
        />
      </section>
      <section className="mb-5 border-b border-line pb-5 max-dashboard:max-w-162.5">
        <div className={sectionLabelClass}>정책 근거</div>
        {policyResults.length ? (
          policyResults.map((result) => (
            <div className="my-3.25 flex gap-2.5" key={result.sectionId}>
              <span className="grid size-6.25 shrink-0 place-items-center rounded bg-[#f0edff] text-[#7968da]">
                ▤
              </span>
              <div>
                <strong className="text-xs">{result.section}</strong>
                <p className="my-0.75 text-[11px] leading-[1.45] text-muted">{result.content}</p>
                <small className="font-mono text-[9px] text-faint">{result.policyId} · {result.policyTitle}</small>
              </div>
            </div>
          ))
        ) : (
          <p className="m-0 text-xs text-faint">일치하는 정책을 찾지 못했습니다.</p>
        )}
      </section>
      <section className="rounded-[7px] border border-[#d9d5f5] bg-[#f7f5ff] p-3.75">
        <div className="mb-2.75 text-[11px] font-extrabold text-[#7667bd]">권장 처리안</div>
        <strong className="text-xs leading-[1.6]">{createRecommendedAction(ticket)}</strong>
        <p className="mt-1.75 mb-0 text-[11px] text-[#778199]">
          고객 등급과 주문 상태를 반영한 제안입니다.
        </p>
      </section>
    </aside>
  );
}
