import type { Order, PolicyReference, Ticket } from "./types";
import styles from "./AiAssistant.module.css";
import { createDraft } from "../../utils/lib";

export function AiAssistant({
  ticket,
  customerName,
  order,
  references,
  draft,
  onDraftChange,
}: {
  ticket: Ticket;
  customerName: string;
  order?: Order;
  references: PolicyReference[];
  draft: string;
  onDraftChange: (draft: string) => void;
}) {
  const response = draft || createDraft(ticket, customerName, order);
  return (
    <aside className="ai-panel no-minheight">
      <div className="ai-heading">
        <div>
          <span className="ai-orb">✦</span>
          <p className="eyebrow">AI COPILOT</p>
          <h2>처리 제안</h2>
        </div>
        <span className="confidence">신뢰도 높음</span>
      </div>
      <section className="ai-section">
        <div className="section-label">
          AI 답변 초안 <span>자동 생성</span>
        </div>
        <textarea
          value={response}
          onChange={(event) => onDraftChange(event.target.value)}
          aria-label="AI 답변 초안"
        />
      </section>
      <section className="ai-section">
        <div className="section-label">정책 근거</div>
        {references.length ? (
          references.map((reference) => (
            <div className="policy" key={reference.referenceId}>
              <span className="policy-icon">▤</span>
              <div>
                <strong>{reference.section}</strong>
                <p>{reference.reason}</p>
                <small>{reference.policyId}</small>
              </div>
            </div>
          ))
        ) : (
          <p className="empty">연결된 정책 근거가 없습니다.</p>
        )}
      </section>
      <section className="recommendation">
        <div className="section-label">권장 처리안</div>
        <strong>
          {ticket.category === "DELIVERY_DELAY"
            ? "택배사 확인 후 지연 안내 및 쿠폰 발급 검토"
            : "정책 기준 확인 후 고객에게 처리 안내"}
        </strong>
        <p>고객 등급과 주문 상태를 반영한 제안입니다.</p>
      </section>
    </aside>
  );
}
