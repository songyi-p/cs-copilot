import assert from "node:assert/strict";
import test from "node:test";
import { canManageTicket, getAiDecision } from "@/server/ticket-service";
import {
  approveTicketSchema,
  saveDraftSchema,
  transferTicketSchema,
} from "@/utils/schemas";

const agent = {
  agentId: "agent-yoon",
  name: "윤서연",
  role: "AGENT" as const,
};

test("일반 상담사는 자신에게 배정된 티켓만 처리할 수 있다", () => {
  assert.equal(canManageTicket(agent, "agent-yoon"), true);
  assert.equal(canManageTicket(agent, "agent-lee"), false);
});

test("관리자는 담당자와 관계없이 티켓을 처리할 수 있다", () => {
  assert.equal(
    canManageTicket(
      {
        agentId: "agent-park",
        role: "ADMIN",
      },
      "agent-lee"
    ),
    true
  );
});

test("AI 초안을 수정하지 않으면 채택, 수정하면 편집으로 기록한다", () => {
  assert.equal(getAiDecision("동일한 답변", "동일한 답변"), "ADOPTED");
  assert.equal(getAiDecision("수정한 답변", "원래 답변"), "EDITED");
});

test("저장·승인·이관 요청은 허용된 필드와 길이를 검증한다", () => {
  const suggestion = {
    replyDraft: "안녕하세요. 확인 후 안내드리겠습니다.",
    recommendedAction: "DELIVERY_TRACE" as const,
    confidenceScore: 3,
    policyReferences: [
      {
        policyId: "POL-DELIVERY-001",
        section: "배송 지연",
        reason: "배송 흐름 확인 기준",
      },
    ],
  };

  assert.equal(
    saveDraftSchema.safeParse({
      draft: suggestion.replyDraft,
      suggestion,
    }).success,
    true
  );
  assert.equal(
    approveTicketSchema.safeParse({
      finalResponse: suggestion.replyDraft,
      suggestion,
    }).success,
    true
  );
  assert.equal(
    transferTicketSchema.safeParse({
      toAgentId: "agent-lee",
      note: "",
      draft: suggestion.replyDraft,
      suggestion,
    }).success,
    true
  );

  assert.equal(
    saveDraftSchema.safeParse({
      draft: "가".repeat(501),
      suggestion,
    }).success,
    false
  );
  assert.equal(
    transferTicketSchema.safeParse({
      toAgentId: "agent-lee",
      note: "",
      draft: "",
      suggestion,
      customerProfile: "허용되지 않은 필드",
    }).success,
    false
  );
});
