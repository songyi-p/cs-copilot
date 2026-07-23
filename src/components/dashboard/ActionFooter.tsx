import { useState } from "react";
import { Button } from "@/components/common/Button";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { TransferDialog } from "@/components/dashboard/TransferDialog";
import type { Agent } from "@/utils/types";

export function ActionFooter({
  onSaveDraft,
  onTransfer,
  onApprove,
  isResolved,
  canEdit,
  canSaveDraft,
  canApprove,
  isPending,
  transferTargets,
}: {
  onSaveDraft: () => void;
  onTransfer: (agentId: string, note: string) => void;
  onApprove: () => void;
  isResolved: boolean;
  canEdit: boolean;
  canSaveDraft: boolean;
  canApprove: boolean;
  isPending: boolean;
  transferTargets: Agent[];
}) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  const confirmApproval = () => {
    setIsConfirmOpen(false);
    onApprove();
  };

  return (
    <>
      <footer className="fixed inset-x-0 bottom-0 flex h-18 items-center justify-end border-t border-line bg-white px-7 shadow-[0_-4px_18px_#23304a08] max-mobile:static max-mobile:h-auto max-mobile:min-h-18 max-mobile:px-4 max-mobile:pb-[max(16px,env(safe-area-inset-bottom))]">
        <div className="flex gap-2.5">
          <Button
            className="max-mobile:px-2.5 max-mobile:py-2"
            onClick={onSaveDraft}
            disabled={!canEdit || !canSaveDraft || isResolved || isPending}
          >
            임시 저장
          </Button>
          <Button
            variant="accent"
            className="max-mobile:px-2.5 max-mobile:py-2"
            onClick={() => setIsTransferOpen(true)}
            disabled={!canEdit || isResolved || isPending}
          >
            담당자 이관
          </Button>
          <Button
            variant="primary"
            className="pr-3.75 pl-4.5 max-mobile:px-2.5 max-mobile:py-2"
            onClick={() => setIsConfirmOpen(true)}
            disabled={!canEdit || !canApprove || isResolved || isPending}
            trailingIcon="→"
          >
            {isPending ? "처리 중" : isResolved ? "처리 완료" : "답변 승인"}
          </Button>
        </div>
      </footer>
      <ConfirmDialog
        open={isConfirmOpen}
        title="답변을 승인하시겠습니까?"
        description="승인한 답변은 처리 이력에 저장되며 티켓이 처리 완료 상태로 변경됩니다."
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={confirmApproval}
      />
      <TransferDialog
        open={isTransferOpen}
        agents={transferTargets}
        onCancel={() => setIsTransferOpen(false)}
        onTransfer={(agentId, note) => {
          setIsTransferOpen(false);
          onTransfer(agentId, note);
        }}
      />
    </>
  );
}
