import assert from "node:assert/strict";
import test from "node:test";
import { mergeStoredTicketState } from "@/utils/ticket-storage";
import type { Ticket } from "@/utils/types";

const defaultTickets: Ticket[] = [
  {
    ticketId: "TKT-1",
    customerId: "CUS-1",
    orderId: null,
    title: "최신 제목",
    inquiry: "최신 문의 내용",
    category: "MEMBERSHIP",
    status: "OPEN",
    createdAt: "2026-07-18T00:00:00+09:00",
    assigneeId: "agent-yoon",
  },
  {
    ticketId: "TKT-2",
    customerId: "CUS-2",
    orderId: null,
    title: "새로 추가된 문의",
    inquiry: "신규 데이터",
    category: "RETURN",
    status: "OPEN",
    createdAt: "2026-07-18T00:00:00+09:00",
    assigneeId: "agent-yoon",
  },
];

test("이전 저장 상태를 복원하면서 최신 문의 데이터와 신규 티켓을 유지한다", () => {
  const merged = mergeStoredTicketState(
    defaultTickets,
    [{ ticketId: "TKT-1", status: "IN_REVIEW", assigneeId: "agent-lee" }],
    ["agent-yoon", "agent-lee"]
  );

  assert.equal(merged.length, 2);
  assert.equal(merged[0]?.title, "최신 제목");
  assert.equal(merged[0]?.inquiry, "최신 문의 내용");
  assert.equal(merged[0]?.status, "IN_REVIEW");
  assert.equal(merged[0]?.assigneeId, "agent-lee");
  assert.equal(merged[1]?.title, "새로 추가된 문의");
});

test("알 수 없는 담당자는 기본 담당자로 복구한다", () => {
  const [merged] = mergeStoredTicketState(
    defaultTickets,
    [{ ticketId: "TKT-1", assigneeId: "removed-agent" }],
    ["agent-yoon", "agent-lee"]
  );

  assert.equal(merged.assigneeId, "agent-yoon");
});
