export function ActionBar({
  notice,
  onAction,
}: {
  notice: string;
  onAction: (message: string) => void;
}) {
  return (
    <footer className="fixed inset-x-0 bottom-0 flex h-18 items-center justify-between border-t border-line bg-white px-7 shadow-[0_-4px_18px_#23304a08] max-mobile:static max-mobile:h-auto max-mobile:min-h-18 max-mobile:px-4 max-mobile:pb-[max(16px,env(safe-area-inset-bottom))]">
      <div>{notice && <span className="text-xs font-bold text-[#348264]">✓ {notice}</span>}</div>
      <div className="flex gap-2.5">
        <button
          className="rounded-md border border-[#dbe1e9] bg-white px-3.75 py-2.5 text-xs font-bold text-[#536173] max-mobile:px-2.5 max-mobile:py-2"
          onClick={() => onAction("답변 초안을 수정할 수 있습니다.")}
        >
          수정
        </button>
        <button
          className="rounded-md border border-[#d6cdf6] bg-[#fbfaff] px-3.75 py-2.5 text-xs font-bold text-[#6250bb] max-mobile:px-2.5 max-mobile:py-2"
          onClick={() => onAction("담당자 이관 요청을 등록했습니다.")}
        >
          담당자 이관
        </button>
        <button
          className="rounded-md border border-action-primary bg-action-primary py-2.5 pr-3.75 pl-4.5 text-xs font-bold text-white max-mobile:px-2.5 max-mobile:py-2"
          onClick={() => onAction("답변을 승인하고 고객에게 발송했습니다.")}
        >
          답변 승인 · 발송 <span className="ml-2 text-base leading-none">→</span>
        </button>
      </div>
    </footer>
  );
}
