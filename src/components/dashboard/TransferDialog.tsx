import { useState } from "react";
import { Button } from "@/components/common/Button";
import { Dialog } from "@/components/common/Dialog";
import type { Agent } from "@/utils/types";

export function TransferDialog({
  open,
  agents,
  onCancel,
  onTransfer,
}: {
  open: boolean;
  agents: Agent[];
  onCancel: () => void;
  onTransfer: (agentId: string, note: string) => void;
}) {
  const [agentId, setAgentId] = useState(agents[0]?.agentId ?? "");
  const [note, setNote] = useState("");

  const submit = () => {
    if (!agentId) return;
    onTransfer(agentId, note.trim());
    setNote("");
  };

  return (
    <Dialog
      open={open}
      title="담당자 이관"
      description="현재 답변 초안과 함께 새 담당자에게 티켓을 전달합니다."
      onClose={onCancel}
      footer={
        <>
          <Button onClick={onCancel}>취소</Button>
          <Button variant="primary" onClick={submit}>
            이관
          </Button>
        </>
      }
    >
      <label className="mb-4 block text-xs font-bold text-label">
        새 담당자
        <select
          className="mt-2 w-full rounded-md border border-[#dbe1e9] bg-white px-3 py-2.5 text-xs text-ink"
          value={agentId}
          onChange={(event) => setAgentId(event.target.value)}
        >
          {agents.map((agent) => (
            <option value={agent.agentId} key={agent.agentId}>
              {agent.name}
            </option>
          ))}
        </select>
      </label>
      <label className="mb-6 block text-xs font-bold text-label">
        이관 메모 <span className="font-normal text-faint">(선택)</span>
        <textarea
          className="mt-2 min-h-22 w-full resize-y rounded-md border border-[#dbe1e9] p-3 text-xs font-normal text-ink"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="새 담당자가 참고할 내용을 입력하세요."
        />
      </label>
    </Dialog>
  );
}
