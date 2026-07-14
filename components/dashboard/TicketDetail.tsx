import type { Customer, Order, Ticket } from "./types";
import { categoryLabel, formatDate, formatDateTime, statusLabel } from "./types";

export function TicketDetail({
  ticket,
  customer,
  order,
}: {
  ticket: Ticket;
  customer: Customer;
  order?: Order;
}) {
  return (
    <section className="detail-panel no-minheight">
      <div className="detail-heading">
        <div>
          <p className="eyebrow">TICKET {ticket.ticketId}</p>
          <h2>{categoryLabel[ticket.category]} 문의</h2>
        </div>
        <span className={`badge ${ticket.status.toLowerCase()}`}>{statusLabel[ticket.status]}</span>
      </div>
      <article className="inquiry-card">
        <p className="card-label">고객 문의</p>
        <p className="inquiry-text">“{ticket.inquiry}”</p>
        <p className="timestamp">{formatDateTime(ticket.createdAt)}</p>
      </article>
      <div className="detail-grid">
        <article className="info-card">
          <div className="card-title">
            <span>◉</span> 고객 정보
          </div>
          <dl>
            <div>
              <dt>고객명</dt>
              <dd>{customer.name}</dd>
            </div>
            <div>
              <dt>등급</dt>
              <dd>
                <span className="grade">{customer.grade}</span>
              </dd>
            </div>
            <div>
              <dt>최근 주문</dt>
              <dd>{customer.recentOrderCount}건</dd>
            </div>
            <div>
              <dt>최근 문의</dt>
              <dd>{customer.recentCsCount}건</dd>
            </div>
          </dl>
        </article>
        <article className="info-card">
          <div className="card-title">
            <span>▣</span> 주문 정보
          </div>
          {order ? (
            <dl>
              <div>
                <dt>주문 상품</dt>
                <dd>{order.productName}</dd>
              </div>
              <div>
                <dt>결제 금액</dt>
                <dd>{order.paymentAmount.toLocaleString()}원</dd>
              </div>
              <div>
                <dt>주문일</dt>
                <dd>{formatDate(order.orderedAt)}</dd>
              </div>
              <div>
                <dt>주문 상태</dt>
                <dd>{order.orderStatus}</dd>
              </div>
            </dl>
          ) : (
            <p className="empty">연결된 주문 정보가 없습니다.</p>
          )}
        </article>
      </div>
      <article className="delivery-card">
        <div className="card-title">
          <span>⌁</span> 배송 정보
        </div>
        {order ? (
          <div className="delivery-row">
            <div>
              <span>배송 상태</span>
              <strong>{order.orderStatus === "IN_TRANSIT" ? "배송 중" : order.orderStatus}</strong>
            </div>
            <div>
              <span>예상 도착일</span>
              <strong>{formatDate(order.deliveryExpectedAt)}</strong>
            </div>
            <div>
              <span>배송 완료일</span>
              <strong>{formatDate(order.deliveredAt)}</strong>
            </div>
          </div>
        ) : (
          <p className="empty">배송 정보가 없습니다.</p>
        )}
      </article>
    </section>
  );
}
