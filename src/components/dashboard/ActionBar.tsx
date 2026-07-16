import { useState } from "react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

export function ActionBar({
  onEdit,
  onEscalate,
  onApprove,
  isResolved,
}: {
  onEdit: () => void;
  onEscalate: () => void;
  onApprove: () => void;
  isResolved: boolean;
}) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const confirmApproval = () => {
    setIsConfirmOpen(false);
    onApprove();
  };

  return (
    <>
      <footer className="fixed inset-x-0 bottom-0 flex h-18 items-center justify-end border-t border-line bg-white px-7 shadow-[0_-4px_18px_#23304a08] max-mobile:static max-mobile:h-auto max-mobile:min-h-18 max-mobile:px-4 max-mobile:pb-[max(16px,env(safe-area-inset-bottom))]">
        <div className="flex gap-2.5">
          <button
            className="rounded-md border border-[#dbe1e9] bg-white px-3.75 py-2.5 text-xs font-bold text-[#536173] max-mobile:px-2.5 max-mobile:py-2"
            onClick={onEdit}
          >
            수정
          </button>
          <button
            className="rounded-md border border-[#d6cdf6] bg-[#fbfaff] px-3.75 py-2.5 text-xs font-bold text-[#6250bb] max-mobile:px-2.5 max-mobile:py-2"
            onClick={onEscalate}
          >
            담당자 이관
          </button>
          <button
            className="rounded-md border border-action-primary bg-action-primary py-2.5 pr-3.75 pl-4.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:border-[#aab3c5] disabled:bg-[#aab3c5] max-mobile:px-2.5 max-mobile:py-2"
            onClick={() => setIsConfirmOpen(true)}
            disabled={isResolved}
          >
            {isResolved ? "처리 완료" : "답변 승인"}{" "}
            <span className="ml-2 text-base leading-none">→</span>
          </button>
        </div>
      </footer>
      <ConfirmDialog
        open={isConfirmOpen}
        title="답변을 승인하시겠습니까?"
        description="승인한 답변은 처리 이력에 저장되며 티켓이 처리 완료 상태로 변경됩니다."
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={confirmApproval}
      />
    </>
  );
}
