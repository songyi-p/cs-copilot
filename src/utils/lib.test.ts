import assert from "node:assert/strict";
import test from "node:test";
import evaluationCases from "@/data/ai-evaluation-cases.json";
import ordersData from "@/data/orders.json";
import policyIndex from "@/data/policy-search-index.json";
import ticketsData from "@/data/tickets.json";
import { mergeTicketState, searchPolicies } from "@/utils/lib";
import { buildAiReq } from "@/utils/req";
import type { Order, PolicySearchItem, Ticket } from "@/utils/types";

const tickets = ticketsData as Ticket[];
const orders = ordersData as Order[];

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

test("모든 평가 문의에서 기대 정책을 상위 3개 안에 검색한다", () => {
  for (const evaluationCase of evaluationCases) {
    const ticket = tickets.find((item) => item.ticketId === evaluationCase.ticketId);
    assert.ok(ticket, `${evaluationCase.ticketId} 티켓이 필요합니다.`);
    const order = orders.find((item) => item.orderId === ticket.orderId);
    const topPolicyIds = searchPolicies({
      title: ticket.title,
      inquiry: ticket.inquiry,
      ticketCategory: ticket.category,
      orderStatus: order?.orderStatus,
    })
      .slice(0, 3)
      .map((result) => result.sectionId);

    assert.ok(
      evaluationCase.expectedPolicySectionIds.some((sectionId) =>
        topPolicyIds.includes(sectionId)
      ),
      `${evaluationCase.ticketId}: ${topPolicyIds.join(", ")}`
    );
  }
});

test("카테고리와 주문 상태가 같은 정책의 우선순위를 높인다", () => {
  const results = searchPolicies({
    title: "상품 준비 중 배송지 변경",
    inquiry: "출고 전에 회사 주소를 집으로 바꾸고 싶습니다.",
    ticketCategory: "DELIVERY_ADDRESS",
    orderStatus: "PREPARING",
  });

  assert.equal(results[0]?.sectionId, "POL-DELIVERY-001-ADDRESS");
});

test("교환 문의에서 낮은 관련도의 불량 정책을 제외한다", () => {
  const ticket = tickets.find((item) => item.ticketId === "TKT-1002");
  assert.ok(ticket);
  const order = orders.find((item) => item.orderId === ticket.orderId);
  const results = searchPolicies({
    title: ticket.title,
    inquiry: ticket.inquiry,
    ticketCategory: ticket.category,
    orderStatus: order?.orderStatus,
  });

  assert.ok(results.some((result) => result.sectionId === "POL-RETURN-001-FEE"));
  assert.equal(results.some((result) => result.policyId === "POL-DEFECT-001"), false);
});

test("AI 요청은 문의·주문·검색 정책의 허용 필드만 포함한다", () => {
  const ticket = tickets[0];
  const order = orders.find((item) => item.orderId === ticket.orderId);
  const policies = searchPolicies({
    title: ticket.title,
    inquiry: ticket.inquiry,
    ticketCategory: ticket.category,
    orderStatus: order?.orderStatus,
  });
  const req = buildAiReq(ticket, order, policies);

  assert.deepEqual(Object.keys(req), [
    "inquiryTitle",
    "inquiryContent",
    "ticketCategory",
    "order",
    "policies",
  ]);
  assert.deepEqual(Object.keys(req.order ?? {}), [
    "orderId",
    "productName",
    "orderStatus",
    "orderedAt",
    "deliveryExpectedAt",
    "deliveredAt",
    "paymentAmount",
  ]);
  assert.equal(req.policies.length <= 3, true);
  assert.equal(
    req.policies.every((policy) =>
      ["policyId", "section", "content"].every((key) => key in policy)
    ),
    true
  );
});

test("정책 본문에는 내부 주문 상태 코드를 노출하지 않는다", () => {
  const statusCodes = [
    "PAID",
    "PREPARING",
    "IN_TRANSIT",
    "DELIVERED",
    "CANCELLED",
    "REFUNDED",
  ];

  for (const policy of policyIndex as PolicySearchItem[]) {
    assert.equal(
      statusCodes.some((code) => policy.content.includes(code)),
      false,
      `${policy.sectionId}: ${policy.content}`
    );
  }
});

test("저장 상태를 복원하면서 최신 문의 데이터와 신규 티켓을 유지한다", () => {
  const merged = mergeTicketState(
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
  const [merged] = mergeTicketState(
    defaultTickets,
    [{ ticketId: "TKT-1", assigneeId: "removed-agent" }],
    ["agent-yoon", "agent-lee"]
  );

  assert.equal(merged.assigneeId, "agent-yoon");
});
