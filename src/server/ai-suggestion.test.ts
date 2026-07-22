import assert from "node:assert/strict";
import test from "node:test";
import { zodTextFormat } from "openai/helpers/zod";
import {
  buildAiContext,
  deriveOrderFacts,
  validateSuggestion,
} from "@/server/ai-suggestion";
import {
  MAX_MISSING_INFO,
  MAX_MISSING_INFO_LEN,
  MAX_POLICY_REASON_LEN,
  MAX_POLICY_REFS,
  MAX_REPLY_LEN,
  MAX_SCORE_REASON_LEN,
  aiOutputSchema,
  parseAiOutput,
} from "@/utils/schemas";
import type { AiReq } from "@/utils/types";

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
  const req: AiReq = {
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

  const context = buildAiContext(req, new Date("2026-07-18T00:00:00Z"));

  assert.deepEqual(Object.keys(context), ["inquiry", "order", "policies"]);
  assert.equal(context.order?.daysPastDeliveryExpected, 8);
  assert.equal(context.inquiry.title, req.inquiryTitle);
  assert.deepEqual(context.policies, req.policies);
});

test("공급자용 Structured Outputs 스키마는 제한 키워드를 포함하지 않는다", () => {
  const format = zodTextFormat(aiOutputSchema, "cs_copilot_suggestion");
  const serializedSchema = JSON.stringify(format.schema);

  for (const keyword of [
    '"minimum"',
    '"maximum"',
    '"minLength"',
    '"maxLength"',
    '"minItems"',
    '"maxItems"',
  ]) {
    assert.equal(serializedSchema.includes(keyword), false, keyword);
  }
});

test("공급자의 문자열 점수를 검증된 숫자 점수로 변환한다", () => {
  const suggestion = parseAiOutput({
    replyDraft: "정책을 확인한 뒤 교환을 도와드리겠습니다.",
    policyReferences: [
      {
        policyId: "POL-RETURN-001",
        section: "교환",
        reason: "교환 재고 확인 조건",
      },
    ],
    recommendedAction: "EXCHANGE_REVIEW",
    confidenceScore: "3",
    confidenceReason: "재고 확인이 필요합니다.",
    missingInformation: ["교환 희망 사이즈 재고"],
  });

  assert.equal(suggestion.confidenceScore, 3);
  assert.equal(suggestion.reviewRequired, false);
});

test("공급자 응답의 문자열 길이와 배열 개수를 업무 스키마 범위로 제한한다", () => {
  const suggestion = parseAiOutput({
    replyDraft: ` ${"가".repeat(900)} `,
    policyReferences: Array.from({ length: 6 }, (_, index) => ({
      policyId: `POL-${index}`,
      section: `정책 ${index}`,
      reason: "나".repeat(1_100),
    })),
    recommendedAction: "DELIVERY_TRACE",
    confidenceScore: "3",
    confidenceReason: "다".repeat(1_100),
    missingInformation: Array.from({ length: 7 }, (_, index) =>
      index === 0 ? " " : `${index}-${"라".repeat(350)}`
    ),
  });

  assert.equal(suggestion.replyDraft.length, MAX_REPLY_LEN);
  assert.equal(suggestion.policyReferences.length, MAX_POLICY_REFS);
  assert.equal(suggestion.policyReferences[0].reason.length, MAX_POLICY_REASON_LEN);
  assert.equal(suggestion.confidenceReason.length, MAX_SCORE_REASON_LEN);
  assert.equal(suggestion.missingInformation.length, MAX_MISSING_INFO);
  assert.equal(
    suggestion.missingInformation.every(
      (item) => item.length <= MAX_MISSING_INFO_LEN
    ),
    true
  );
});

test("전달하지 않은 정책 근거는 제거하고 안전한 이관 제안으로 낮춘다", () => {
  const suggestion = parseAiOutput({
    replyDraft: "택배사 확인 후 배송 상태를 안내드리겠습니다.",
    policyReferences: [
      {
        policyId: "POL-NOT-SUPPLIED",
        section: "임의 정책",
        reason: "입력에 없는 근거",
      },
    ],
    recommendedAction: "DELIVERY_TRACE",
    confidenceScore: "4",
    confidenceReason: "배송 확인이 필요합니다.",
    missingInformation: [],
  });

  const normalized = validateSuggestion(suggestion, [
    {
      policyId: "POL-DELIVERY-001",
      section: "배송 지연",
      content: "택배사 배송 흐름을 확인합니다.",
    },
  ]);

  assert.deepEqual(normalized.policyReferences, []);
  assert.equal(normalized.confidenceScore, 1);
  assert.equal(normalized.recommendedAction, "ESCALATE");
  assert.equal(normalized.reviewRequired, true);
});

test("정책 식별자의 공백과 대소문자 차이는 전달된 원문으로 정규화한다", () => {
  const suggestion = parseAiOutput({
    replyDraft: "교환 가능 여부를 검토하겠습니다.",
    policyReferences: [
      {
        policyId: " pol-return-001 ",
        section: "신청   가능 기간",
        reason: "신청 기간 확인",
      },
    ],
    recommendedAction: "EXCHANGE_REVIEW",
    confidenceScore: "4",
    confidenceReason: "정책과 주문 정보가 확인됩니다.",
    missingInformation: [],
  });

  const normalized = validateSuggestion(suggestion, [
    {
      policyId: "POL-RETURN-001",
      section: "신청 가능 기간",
      content: "수령일로부터 7일 이내 신청할 수 있습니다.",
    },
  ]);

  assert.deepEqual(normalized.policyReferences[0], {
    policyId: "POL-RETURN-001",
    section: "신청 가능 기간",
    reason: "신청 기간 확인",
  });
});

test("같은 정책 섹션을 중복 참조하면 첫 번째 근거만 유지한다", () => {
  const suggestion = parseAiOutput({
    replyDraft: "배송 예정일을 기준으로 지연 여부를 확인하겠습니다.",
    policyReferences: [
      {
        policyId: "POL-DELIVERY-001",
        section: "배송 예정일",
        reason: "예정일 확인",
      },
      {
        policyId: "POL-DELIVERY-001",
        section: "배송 예정일",
        reason: "동일한 예정일 정책 재참조",
      },
    ],
    recommendedAction: "DELIVERY_TRACE",
    confidenceScore: "3",
    confidenceReason: "택배사 확인이 필요합니다.",
    missingInformation: [],
  });

  const normalized = validateSuggestion(suggestion, [
    {
      policyId: "POL-DELIVERY-001",
      section: "배송 예정일",
      content: "주문 시 고지된 배송 예정일을 기준으로 지연 여부를 판단합니다.",
    },
  ]);

  assert.equal(normalized.policyReferences.length, 1);
  assert.equal(normalized.policyReferences[0].reason, "예정일 확인");
});
