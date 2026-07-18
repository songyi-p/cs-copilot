import assert from "node:assert/strict";
import test from "node:test";
import { buildAiSuggestionContext, deriveOrderFacts } from "@/server/ai-suggestion";
import type { AiSuggestionRequest } from "@/utils/types";

const delayedOrder = {
  orderId: "ORD-TEST",
  productName: "테스트 상품",
  orderStatus: "IN_TRANSIT",
  orderedAt: "2026-07-06",
  deliveryExpectedAt: "2026-07-10",
  deliveredAt: null,
  paymentAmount: 10_000,
};

test("배송 예정일 경과 일수를 서버 기준일로 계산한다", () => {
  const facts = deriveOrderFacts(delayedOrder, new Date("2026-07-18T12:00:00+09:00"));

  assert.equal(facts.daysPastDeliveryExpected, 8);
  assert.equal(facts.daysSinceDelivered, null);
  assert.equal(facts.isBeforeShipment, false);
});

test("결제 완료와 상품 준비 중 상태를 출고 전으로 분류한다", () => {
  for (const orderStatus of ["PAID", "PREPARING"]) {
    const facts = deriveOrderFacts(
      { ...delayedOrder, orderStatus },
      new Date("2026-07-18T00:00:00Z")
    );
    assert.equal(facts.isBeforeShipment, true);
  }
});

test("모델 입력에는 허용된 문의·주문·정책과 서버 파생값만 포함한다", () => {
  const request: AiSuggestionRequest = {
    inquiryTitle: "배송 지연 환불 문의",
    inquiryContent: "예정일이 지나 환불을 검토해 주세요.",
    ticketCategory: "DELIVERY_DELAY",
    order: delayedOrder,
    policies: [
      {
        policyId: "POL-REFUND-001",
        section: "배송 지연 환불",
        content: "배송 예정일이 5일 이상 지나면 환불을 검토합니다.",
      },
    ],
  };

  const context = buildAiSuggestionContext(request, new Date("2026-07-18T00:00:00Z"));

  assert.deepEqual(Object.keys(context), ["inquiry", "order", "policies"]);
  assert.equal(context.order?.daysPastDeliveryExpected, 8);
  assert.equal(context.inquiry.title, request.inquiryTitle);
  assert.deepEqual(context.policies, request.policies);
});
