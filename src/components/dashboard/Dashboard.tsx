"use client";

import { Button } from "@/components/common/Button";
import { Toast } from "@/components/common/Toast";
import { ActionFooter } from "@/components/dashboard/ActionFooter";
import { AiAssistant } from "@/components/dashboard/ai-section/AiAssistant";
import { AppHeader } from "@/components/dashboard/AppHeader";
import { InactiveAiAssistant } from "@/components/dashboard/ai-section/InactiveAiAssistant";
import { TicketDetail } from "@/components/dashboard/ticket-section/TicketDetail";
import { TicketList } from "@/components/dashboard/ticket-section/TicketList";
import { useDashboard } from "@/hooks/useDashboard";
import type { Agent } from "@/utils/types";

function WorkspaceState({
  mode,
  error,
  onRetry,
}: {
  mode: "loading" | "error" | "empty";
  error?: string;
  onRetry: () => void;
}) {
  const title =
    mode === "loading"
      ? "문의 데이터를 불러오는 중입니다"
      : mode === "empty"
        ? "현재 배정된 문의가 없습니다"
        : "문의 데이터를 불러오지 못했습니다";
  const description =
    mode === "loading"
      ? "고객, 주문과 처리 이력을 안전하게 가져오고 있습니다."
      : mode === "empty"
        ? "새 문의가 배정되면 이 화면에서 바로 확인할 수 있습니다."
        : error;

  return (
    <section className="grid h-[calc(100dvh-64px)] place-items-center px-5">
      <div className="w-full max-w-105 rounded-xl border border-line bg-white p-7 text-center shadow-[0_18px_50px_#23304a0d]">
        {mode === "loading" && (
          <span className="mx-auto mb-4 block size-8 animate-spin rounded-full border-3 border-[#cfdef8] border-t-[#7193da]" />
        )}
        <h1 className="mb-2 text-lg font-extrabold">{title}</h1>
        <p className="m-0 text-xs leading-5 text-muted">{description}</p>
        {mode === "error" && (
          <Button className="mt-5" onClick={onRetry}>
            다시 시도
          </Button>
        )}
      </div>
    </section>
  );
}

export function Dashboard({ currentAgent }: { currentAgent: Agent }) {
  const desk = useDashboard(currentAgent);

  if (desk.workspaceStatus !== "success") {
    return (
      <main className="min-h-dvh bg-canvas">
        <AppHeader agent={currentAgent} />
        <WorkspaceState
          mode={desk.workspaceStatus}
          error={desk.workspaceError}
          onRetry={desk.retryWorkspace}
        />
        <Toast
          message={desk.notice}
          tone={desk.noticeTone}
          onClose={desk.closeNotice}
        />
      </main>
    );
  }

  const { ticket, customer, assignee } = desk;

  if (!ticket || !customer || !assignee) {
    return (
      <main className="min-h-dvh bg-canvas">
        <AppHeader agent={currentAgent} />
        <WorkspaceState
          mode="error"
          error="문의 상세 데이터가 올바르지 않습니다."
          onRetry={desk.retryWorkspace}
        />
      </main>
    );
  }

  return (
    <main className="h-dvh overflow-hidden select-none max-mobile:h-auto max-mobile:min-h-dvh max-mobile:overflow-visible">
      <AppHeader agent={currentAgent} />
      <section className="grid h-[calc(100dvh-136px)] grid-cols-[310px_minmax(430px,1fr)_390px] overflow-hidden max-dashboard:grid-cols-[270px_1fr] max-mobile:block max-mobile:h-auto max-mobile:overflow-visible">
        <TicketList
          tickets={desk.tickets}
          customers={desk.customers}
          selectedId={ticket.ticketId}
          onSelect={desk.selectTicket}
        />
        <TicketDetail
          ticket={ticket}
          customer={customer}
          order={desk.order}
          histories={desk.ticketHistory}
          assigneeName={assignee.name}
        />
        {desk.aiDisabled ? (
          <InactiveAiAssistant
            mode={ticket.status === "RESOLVED" ? "resolved" : "escalated"}
            response={desk.draft || desk.savedReply}
          />
        ) : (
          <AiAssistant
            suggestion={desk.suggestion}
            status={desk.aiStatus}
            error={desk.aiError}
            draft={desk.draft}
            onDraftChange={desk.setDraft}
            onRetry={desk.retryAi}
            canEdit={desk.canEdit}
          />
        )}
      </section>
      <ActionFooter
        onSaveDraft={desk.saveDraft}
        onTransfer={desk.transferTicket}
        onApprove={desk.approveTicket}
        isResolved={ticket.status === "RESOLVED"}
        canEdit={desk.canEdit}
        canSaveDraft={Boolean(desk.draft.trim() || desk.suggestion?.replyDraft)}
        canApprove={Boolean(desk.suggestion)}
        isPending={desk.isMutating}
        transferTargets={desk.agents.filter(
          (item: Agent) => item.agentId !== ticket.assigneeId
        )}
      />
      <Toast
        message={desk.notice}
        tone={desk.noticeTone}
        onClose={desk.closeNotice}
      />
    </main>
  );
}
