import type { Customer, Ticket } from "./types";
import { categoryLabel, formatDate, statusLabel } from "./types";

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
    <aside className="ticket-panel no-minheight">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">INBOX</p>
          <h1>
            문의 목록 <span>{tickets.length}</span>
          </h1>
        </div>
        <button className="icon-button" aria-label="필터">
          ☷
        </button>
      </div>
      <div className="search">
        ⌕ <span>문의 검색</span>
      </div>
      <div className="ticket-list">
        {tickets.map((ticket) => {
          const customer = customers.find((item) => item.customerId === ticket.customerId)!;
          return (
            <button
              className={`ticket ${ticket.ticketId === selectedId ? "selected" : ""}`}
              onClick={() => onSelect(ticket)}
              key={ticket.ticketId}
            >
              <div className="ticket-top">
                <strong>{customer.name}</strong>
                <time>{formatDate(ticket.createdAt)}</time>
              </div>
              <p>{ticket.inquiry}</p>
              <div className="ticket-meta">
                <span className={`badge ${ticket.status.toLowerCase()}`}>
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
