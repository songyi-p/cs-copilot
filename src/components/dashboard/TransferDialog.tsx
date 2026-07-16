import { useState } from "react";
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

  if (!open) return null;

  const submit = () => {
    if (!agentId) return;
    onTransfer(agentId, note.trim());
    setNote("");
  };

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-[#17202d66] px-4" role="presentation">
      <section className="w-full max-w-100 rounded-xl bg-white p-6 shadow-[0_20px_60px_#17202d33]" role="dialog" aria-modal="true" aria-labelledby="transfer-dialog-title">
        <h2 id="transfer-dialog-title" className="mb-2 text-base font-extrabold">담당자 이관</h2>
        <p className="mb-5 text-xs leading-[1.6] text-muted">현재 답변 초안과 함께 새 담당자에게 티켓을 전달합니다.</p>
        <label className="mb-4 block text-xs font-bold text-label">
          새 담당자
          <select className="mt-2 w-full rounded-md border border-[#dbe1e9] bg-white px-3 py-2.5 text-xs text-ink" value={agentId} onChange={(event) => setAgentId(event.target.value)}>
            {agents.map((agent) => <option value={agent.agentId} key={agent.agentId}>{agent.name}</option>)}
          </select>
        </label>
        <label className="mb-6 block text-xs font-bold text-label">
          이관 메모 <span className="font-normal text-faint">(선택)</span>
          <textarea className="mt-2 min-h-22 w-full resize-y rounded-md border border-[#dbe1e9] p-3 text-xs font-normal text-ink" value={note} onChange={(event) => setNote(event.target.value)} placeholder="새 담당자가 참고할 내용을 입력하세요." />
        </label>
        <div className="flex justify-end gap-2.5">
          <button className="rounded-md border border-[#dbe1e9] bg-white px-4 py-2.5 text-xs font-bold text-[#536173]" onClick={onCancel}>취소</button>
          <button className="rounded-md border border-action-primary bg-action-primary px-4 py-2.5 text-xs font-bold text-white" onClick={submit}>이관</button>
        </div>
      </section>
    </div>
  );
}
