import assert from "node:assert/strict";
import test from "node:test";
import evaluationCases from "@/data/ai-evaluation-cases.json";
import ordersData from "@/data/orders.json";
import ticketsData from "@/data/tickets.json";
import { searchPolicies } from "@/utils/lib";
import type { Order, Ticket } from "@/utils/types";

const tickets = ticketsData as Ticket[];
const orders = ordersData as Order[];

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
