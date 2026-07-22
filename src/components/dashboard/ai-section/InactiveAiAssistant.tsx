import { Badge } from "@/components/common/Badge";

export function InactiveAiAssistant({
  mode,
  response,
}: {
  mode: "resolved" | "escalated";
  response: string;
}) {
  const isResolved = mode === "resolved";

  return (
    <aside className="min-h-0 overflow-y-auto border-l border-line bg-white px-6.5 py-7.25 scrollbar-gutter-stable max-dashboard:col-span-full max-dashboard:border-t max-dashboard:border-l-0 max-mobile:px-4 max-mobile:py-5.5">
      <div className="mb-7 flex items-start justify-between">
        <div className="relative pl-6.25">
          <span className="absolute top-0.75 left-0 text-[17px] text-ai">✦</span>
          <p className="mb-1 font-mono text-[10px] font-medium tracking-[1.3px] text-eyebrow">
            AI COPILOT
          </p>
          <h2 className="m-0 text-[19px] font-bold tracking-[-0.5px]">처리 기록</h2>
        </div>
        <Badge tone={isResolved ? "resolved" : "escalated"} className="py-1">
          {isResolved ? "처리 완료" : "이관됨"}
        </Badge>
      </div>

      <div className="mb-5 rounded-md border border-[#dce2ea] bg-[#f7f9fc] px-3.5 py-3 text-xs leading-[1.6] text-muted">
        {isResolved
          ? "처리가 완료되어 새로운 AI 제안을 요청하지 않습니다."
          : "담당자에게 이관되어 새로운 AI 제안을 요청하지 않습니다."}
      </div>

      <section className="mb-5 border-b border-line pb-5 max-dashboard:max-w-162.5">
        <div className="mb-2.75 text-[11px] font-extrabold text-label">
          {isResolved ? "최종 답변" : "이관된 답변 초안"}
        </div>
        {response ? (
          <textarea
            className="min-h-60 w-full resize-y rounded-md border border-[#dce2ea] bg-[#f3f5f8] p-3.25 text-xs leading-[1.7] text-[#344052] outline-none select-text"
            value={response}
            aria-label={isResolved ? "최종 답변" : "이관된 답변 초안"}
            readOnly
          />
        ) : (
          <p className="m-0 rounded-md border border-dashed border-[#dce2ea] bg-[#fbfcff] px-3.5 py-5 text-xs text-faint">
            저장된 답변 내용이 없습니다.
          </p>
        )}
      </section>
    </aside>
  );
}
