import type { ActionHistory, Customer, Order, Ticket } from "@/utils/types";
import { aiDecisionLabel, categoryLabel, orderStatusLabel, statusLabel } from "@/utils/constants";
import { formatDate, formatDateTime } from "@/utils/formatters";
import { cn } from "@/utils/cn";

const statusStyles: Record<string, string> = {
  OPEN: "bg-status-open-bg text-status-open",
  IN_REVIEW: "bg-status-review-bg text-status-review",
  ESCALATED: "bg-status-escalated-bg text-status-escalated",
  RESOLVED: "bg-status-resolved-bg text-status-resolved",
};

const cardClass = "rounded-lg border border-line bg-white";
const detailRowClass = "flex justify-between py-1.75";
const termClass = "text-term";
const descriptionClass = "m-0 max-w-3/5 text-right font-semibold";

export function TicketDetail({
  ticket,
  customer,
  order,
  histories,
  assigneeName,
}: {
  ticket: Ticket;
  customer: Customer;
  order?: Order;
  histories: ActionHistory[];
  assigneeName: string;
}) {
  return (
    <section className="mx-auto min-h-0 w-full max-w-215 overflow-y-auto px-8.5 pt-5.5 pb-9.5 max-mobile:px-4 max-mobile:py-5.5">
      <div className="mb-5.5 flex items-start justify-between">
        <div>
          <p className="mb-1 font-mono text-[10px] font-medium tracking-[1.3px] text-eyebrow">
            TICKET {ticket.ticketId}
          </p>
          <h2 className="m-0 text-[22px] font-bold tracking-[-0.5px]">{ticket.title}</h2>
        </div>
        <span className={cn("inline-block rounded-[3px] px-1.75 py-0.75 text-[10px] font-bold", statusStyles[ticket.status])}>{statusLabel[ticket.status]}</span>
      </div>
      <article className={cn(cardClass, "mb-3.5 flex items-center justify-between px-5 py-3.5")}>
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-full bg-[#e8edff] text-sm font-extrabold text-[#526ad0]">
            {assigneeName.slice(0, 1)}
          </span>
          <div>
            <p className="mb-0.5 text-[10px] font-bold text-label">현재 담당자</p>
            <strong className="text-[13px]">{assigneeName}</strong>
          </div>
        </div>
        <span className="rounded-[3px] bg-[#e8f7f0] px-2 py-1 text-[10px] font-bold text-[#3c8a6a]">
          담당 중
        </span>
      </article>
      <article className={cn(cardClass, "mb-4.5 px-5 py-4.5")}>
        <p className="mb-2.25 text-[11px] font-extrabold text-label">
          고객 문의 · {categoryLabel[ticket.category]}
        </p>
        <p className="mb-2.75 whitespace-pre-wrap text-[14px] font-medium leading-[1.75]">
          {ticket.inquiry}
        </p>
        <p className="m-0 text-[10px] text-timestamp">{formatDateTime(ticket.createdAt)}</p>
      </article>
      <div className="mb-3.5 grid grid-cols-2 gap-3.5 max-mobile:grid-cols-1">
        <article className={cn(cardClass, "p-4.5")}>
          <div className="mb-4.25 text-[13px] font-extrabold">
            <span className="mr-1.75 text-info-accent">◉</span> 고객 정보
          </div>
          <dl>
            <div className={detailRowClass}>
              <dt className={termClass}>고객명</dt>
              <dd className={descriptionClass}>{customer.name}</dd>
            </div>
            <div className={detailRowClass}>
              <dt className={termClass}>등급</dt>
              <dd className={descriptionClass}>
                <span className="rounded-[3px] bg-[#fff2df] px-1.5 py-0.5 text-[10px] text-[#a66c23]">
                  {customer.grade}
                </span>
              </dd>
            </div>
            <div className={detailRowClass}>
              <dt className={termClass}>최근 주문</dt>
              <dd className={descriptionClass}>{customer.recentOrderCount}건</dd>
            </div>
            <div className={detailRowClass}>
              <dt className={termClass}>최근 문의</dt>
              <dd className={descriptionClass}>{customer.recentCsCount}건</dd>
            </div>
          </dl>
        </article>
        <article className={cn(cardClass, "p-4.5")}>
          <div className="mb-4.25 text-[13px] font-extrabold">
            <span className="mr-1.75 text-info-accent">▣</span> 주문 정보
          </div>
          {order ? (
            <dl>
              <div className={detailRowClass}>
                <dt className={termClass}>주문 상품</dt>
                <dd className={descriptionClass}>{order.productName}</dd>
              </div>
              <div className={detailRowClass}>
                <dt className={termClass}>결제 금액</dt>
                <dd className={descriptionClass}>{order.paymentAmount.toLocaleString()}원</dd>
              </div>
              <div className={detailRowClass}>
                <dt className={termClass}>주문일</dt>
                <dd className={descriptionClass}>{formatDate(order.orderedAt)}</dd>
              </div>
              <div className={detailRowClass}>
                <dt className={termClass}>주문 상태</dt>
                <dd className={descriptionClass}>
                  {orderStatusLabel[order.orderStatus] ?? order.orderStatus}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="m-0 text-xs text-faint">연결된 주문 정보가 없습니다.</p>
          )}
        </article>
      </div>
      <article className={cn(cardClass, "p-4.5")}>
        <div className="mb-4.25 text-[13px] font-extrabold">
          <span className="mr-1.75 text-info-accent">⌁</span> 배송 정보
        </div>
        {order ? (
          <div className="grid grid-cols-3 max-mobile:grid-cols-1 max-mobile:gap-3.5 [&>div]:flex [&>div]:flex-col [&>div]:gap-1.75 [&>div]:border-r [&>div]:border-[#edf0f4] [&>div]:pl-3.75 [&>div:first-child]:pl-0 [&>div:last-child]:border-0 max-mobile:[&>div]:border-0 max-mobile:[&>div]:pl-0">
            <div>
              <span className="text-[11px] text-term">배송 상태</span>
              <strong className="text-xs">
                {orderStatusLabel[order.orderStatus] ?? order.orderStatus}
              </strong>
            </div>
            <div>
              <span className="text-[11px] text-term">예상 도착일</span>
              <strong className="text-xs">{formatDate(order.deliveryExpectedAt)}</strong>
            </div>
            <div>
              <span className="text-[11px] text-term">배송 완료일</span>
              <strong className="text-xs">{formatDate(order.deliveredAt)}</strong>
            </div>
          </div>
        ) : (
          <p className="m-0 text-xs text-faint">배송 정보가 없습니다.</p>
        )}
      </article>
      <article className={cn(cardClass, "mt-3.5 p-4.5")}>
        <div className="mb-4.25 flex items-center justify-between text-[13px] font-extrabold">
          <span>
            <span className="mr-1.75 text-info-accent">✓</span> 처리 이력
          </span>
          <span className="text-[10px] font-semibold text-faint">{histories.length}건</span>
        </div>
        {histories.length ? (
          <div className="space-y-3">
            {histories.map((history) => (
              <div
                className="rounded-md border border-[#edf0f4] bg-[#fbfcff] p-3.5"
                key={history.historyId}
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <strong className="text-xs">{history.actionLabel ?? history.finalAction}</strong>
                  {history.aiDecision && <span className="shrink-0 rounded-[3px] bg-status-resolved-bg px-1.5 py-0.5 text-[10px] font-bold text-status-resolved">{aiDecisionLabel[history.aiDecision]}</span>}
                </div>
                {history.finalResponse && (
                  <p className="mb-2 whitespace-pre-wrap text-[11px] leading-[1.6] text-muted">
                    {history.finalResponse}
                  </p>
                )}
                {history.note && <p className="mb-2 text-[11px] leading-[1.6] text-muted">이관 메모: {history.note}</p>}
                <p className="m-0 text-[10px] text-timestamp">
                  {history.agentId} · {formatDateTime(history.createdAt)}
                  {history.aiConfidenceScore
                    ? ` · AI 신뢰도 ${history.aiConfidenceScore}/5점`
                    : ""}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="m-0 text-xs text-faint">아직 등록된 처리 이력이 없습니다.</p>
        )}
      </article>
    </section>
  );
}
