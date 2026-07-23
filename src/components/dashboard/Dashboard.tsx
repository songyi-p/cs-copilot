"use client";

import { Toast } from "@/components/common/Toast";
import { ActionFooter } from "@/components/dashboard/ActionFooter";
import { AiAssistant } from "@/components/dashboard/ai-section/AiAssistant";
import { AppHeader } from "@/components/dashboard/AppHeader";
import { InactiveAiAssistant } from "@/components/dashboard/ai-section/InactiveAiAssistant";
import { TicketDetail } from "@/components/dashboard/ticket-section/TicketDetail";
import { TicketList } from "@/components/dashboard/ticket-section/TicketList";
import { useDashboard } from "@/hooks/useDashboard";
import type { Agent } from "@/utils/types";

export function Dashboard({ currentAgent }: { currentAgent: Agent }) {
  const desk = useDashboard();

  return (
    <main className="h-dvh overflow-hidden select-none max-mobile:h-auto max-mobile:min-h-dvh max-mobile:overflow-visible">
      <AppHeader agent={currentAgent} />
      <section className="grid h-[calc(100dvh-136px)] grid-cols-[310px_minmax(430px,1fr)_390px] overflow-hidden max-dashboard:grid-cols-[270px_1fr] max-mobile:block max-mobile:h-auto max-mobile:overflow-visible">
        <TicketList
          tickets={desk.tickets}
          customers={desk.customers}
          selectedId={desk.ticket.ticketId}
          onSelect={desk.selectTicket}
        />
        <TicketDetail
          ticket={desk.ticket}
          customer={desk.customer}
          order={desk.order}
          histories={desk.ticketHistory}
          assigneeName={desk.assignee.name}
        />
        {desk.aiDisabled ? (
          <InactiveAiAssistant
            mode={desk.ticket.status === "RESOLVED" ? "resolved" : "escalated"}
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
        isResolved={desk.ticket.status === "RESOLVED"}
        canEdit={desk.canEdit}
        canSaveDraft={Boolean(desk.draft.trim() || desk.suggestion?.replyDraft)}
        canApprove={Boolean(desk.suggestion)}
        transferTargets={desk.agents.filter((item) => item.agentId !== desk.ticket.assigneeId)}
      />
      <Toast message={desk.notice} onClose={desk.closeNotice} />
    </main>
  );
}
