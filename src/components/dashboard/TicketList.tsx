import type { Customer, Ticket } from "@/utils/types";
import { categoryLabel, statusLabel } from "@/utils/constants";
import { formatDate } from "@/utils/formatters";
import { cn } from "@/utils/cn";

const statusStyles: Record<string, string> = {
  OPEN: "bg-status-open-bg text-status-open",
  IN_REVIEW: "bg-status-review-bg text-status-review",
  ESCALATED: "bg-status-escalated-bg text-status-escalated",
  RESOLVED: "bg-status-resolved-bg text-status-resolved",
};

export function TicketList({
  tickets,
  customers,
  selectedId,
  onSelect,
}: {
  tickets: Ticket[];
  customers: Customer[];
  selectedId: string;
  onSelect: (ticket: Ticket) => void;
}) {
  return (
    <aside className="flex min-h-0 flex-col overflow-y-auto border-r border-line bg-white scrollbar-gutter-stable max-mobile:border-r-0">
      <div className="flex items-start justify-between px-5 pt-6 pb-4">
        <div>
          <p className="mb-1 font-mono text-[10px] font-medium tracking-[1.3px] text-eyebrow">
            INBOX
          </p>
          <h1 className="m-0 text-[19px] font-bold tracking-[-0.5px]">
            문의 목록 <span className="align-middle text-xs text-[#98a3b5]">{tickets.length}</span>
          </h1>
        </div>
        <button
          className="size-7.5 rounded-md border border-line bg-white text-[#778398]"
          aria-label="필터"
        >
          ☷
        </button>
      </div>
      <div className="mx-4 mb-3.25 h-8.75 rounded-md bg-canvas px-2.75 py-2 text-xs text-[#a0aabb]">
        ⌕ <span className="pl-1.5">문의 검색</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto max-mobile:flex max-mobile:overflow-auto">
        {tickets.map((ticket) => {
          const customer = customers.find((item) => item.customerId === ticket.customerId)!;
          return (
            <button
              className={cn(
                "w-full border-0 border-t border-[#f0f2f5] bg-white px-5 pt-3.5 pb-3.25 text-left text-inherit max-mobile:min-w-57.5 max-mobile:border-b max-mobile:border-b-line",
                ticket.ticketId === selectedId && "border-l-3 border-l-brand bg-[#f0f3ff] pl-4.25"
              )}
              onClick={() => onSelect(ticket)}
              key={ticket.ticketId}
            >
              <div className="flex items-center justify-between">
                <strong className="text-[13px]">{customer.name}</strong>
                <time className="text-[10px] text-timestamp">{formatDate(ticket.createdAt)}</time>
              </div>
              <p className="my-1.75 overflow-hidden text-ellipsis whitespace-nowrap text-xs font-semibold leading-6">
                {ticket.title}
              </p>
              <div className="flex items-center gap-1.75 text-[10px] text-[#8490a0]">
                <span
                  className={cn(
                    "inline-block rounded-[3px] bg-[#edf1f5] px-1.75 py-0.75 text-[10px] font-bold text-[#738093]",
                    statusStyles[ticket.status]
                  )}
                >
                  {statusLabel[ticket.status]}
                </span>
                <span>{categoryLabel[ticket.category]}</span>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
