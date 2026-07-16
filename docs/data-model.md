# 데이터 모델

초기 버전은 `data/`의 JSON과 Markdown 파일을 읽어 사용한다. 이후 PostgreSQL/Prisma로 옮길 때도 같은 식별자와 관계를 유지한다.

## 관계

```
Customer (1) ─── Order           (0..N)
Customer (1) ─── Ticket          (0..N)
Order    (0..1) ─── Ticket       (0..N)
Ticket   (1) ─── ActionHistory   (0..N)
Ticket   (1) ─── PolicyReference (0..N)
Policy   (1) ─── PolicyReference (0..N)
```

- 티켓은 주문 1건에 연결되거나, 회원 등급·일반 문의처럼 주문 없이 생성될 수 있다.
- 티켓은 아직 처리 기록이 없을 수도 있고, AI 제안·담당자 수정·승인 같은 여러 이력을 가질 수 있다.
- `PolicyReference`는 티켓과 정책의 N:N 관계를 저장하며, 어떤 정책의 어느 섹션을 근거로 썼는지도 기록한다.

## 엔터티

| 엔터티        | 식별자       | 핵심 필드                                    |
| ------------- | ------------ | -------------------------------------------- |
| Customer      | `customerId` | 이름, 등급, 최근 CS 이력                     |
| Order         | `orderId`    | 고객, 상품, 주문/배송 상태, 예정일, 결제금액 |
| Ticket        | `ticketId`   | 고객/주문, 문의, 분류, 처리 상태             |
| Policy        | `policyId`   | Markdown 문서의 frontmatter 및 섹션          |
| PolicyReference | `referenceId` | 티켓, 정책, 인용 섹션, 참조 이유           |
| ActionHistory | `historyId`  | AI 제안, 신뢰도, 담당자 수정, 승인 결과, 정책 근거 |

## 상태값

- 주문: `PAID`, `PREPARING`, `IN_TRANSIT`, `DELIVERED`, `CANCELLED`, `REFUNDED`
- 문의: `OPEN`, `IN_REVIEW`, `RESOLVED`, `ESCALATED`
- AI 권장 처리: `REFUND_REVIEW`, `DELAY_COUPON`, `EXCHANGE_REVIEW`, `ESCALATE`
- AI 제안 결과: `ADOPTED`, `EDITED`, `REJECTED`
- AI 신뢰도: `high`, `medium`, `low`

## AI 제안 계약

AI 제안은 고객 답변 초안, 정책 근거, 권장 처리 코드, 신뢰도로 구성한다.

```ts
type LlmSuggestion = {
  replyDraft: string;
  policyReferences: {
    policyId: string;
    section: string;
    reason: string;
  }[];
  recommendedAction: "REFUND_REVIEW" | "DELAY_COUPON" | "ESCALATE";
  confidence: "high" | "medium" | "low";
};
```

`policyReferences`는 검색되어 모델에 전달된 정책만 참조할 수 있다. `confidence`가 `low`이면
자동 권장 처리안 대신 담당자 이관을 권장하지만, 모델이 반환한 원본 처리 코드는 처리 이력에
보존한다.

## 첫 번째 데모 흐름

`TKT-1008`은 `ORD-202607-1008`과 연결된다. 배송 예정일이 지났지만 주문은 배송 중이며, `PolicyReference`를 통해 `POL-DELIVERY-001`과 `POL-REFUND-001`의 근거 섹션을 찾아 배송 지연 쿠폰과 환불 검토 조건을 제안한다.
