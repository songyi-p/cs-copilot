# 데이터 모델

업무 데이터는 PostgreSQL에 저장하고 Prisma로 스키마와 migration을 관리한다. 기존 `src/data`의
고객·주문·티켓·처리 이력·정책 근거 JSON은 재실행 가능한 초기 seed로 사용하며 기존 식별자를
유지한다. 정책 원본과 검색 인덱스는 아직 Markdown·JSON을 Git에서 관리한다.

## 관계

```
User     (0..1) ─── Agent                 (0..1)
Agent    (1) ────── Ticket                (0..N)
Customer (1) ────── Order                 (0..N)
Customer (1) ────── Ticket                (0..N)
Order    (0..1) ─── Ticket                (0..N)
Ticket   (1) ────── TicketDraft           (0..1)
Ticket   (1) ────── ActionHistory         (0..N)
Ticket   (1) ────── TicketPolicyReference (0..N)
```

- 티켓은 주문 1건에 연결되거나, 회원 등급·일반 문의처럼 주문 없이 생성될 수 있다.
- `User`는 Auth.js 로그인 계정이고 `Agent`는 업무상 상담사와 권한이다. 데모 계정은
  `user-demo-yoon`과 `agent-yoon`을 연결한다.
- 일반 상담사는 자신에게 배정된 티켓만 조회·처리하고 관리자는 모든 티켓을 조회할 수 있다.
- 티켓은 현재 초안 하나와 AI 제안·담당자 수정·승인 같은 여러 불변 이력을 가질 수 있다.
- `TicketPolicyReference`는 seed 티켓이 참조한 정책 ID와 섹션을 저장한다. 새 처리 이력에서 사용한
  AI 정책 근거는 `ActionHistory.policyReferences` JSONB에 당시 값 그대로 보존한다.

## 엔터티

| 엔터티        | 식별자       | 핵심 필드                                    |
| ------------- | ------------ | -------------------------------------------- |
| User          | `id`         | Auth.js 계정, 이메일, 외부 계정과 세션       |
| Agent         | `agentId`    | 로그인 계정 연결, 이름, 역할, 활성 상태      |
| Customer      | `customerId` | 이름, 등급, 최근 주문·CS 건수                |
| Order         | `orderId`    | 고객, 상품, 주문/배송 상태, 예정일, 결제금액 |
| Ticket        | `ticketId`   | 고객/주문/담당자, 문의, 분류, 상태, 버전     |
| TicketDraft   | `ticketId`   | 현재 답변 초안, 마지막 저장 상담사           |
| TicketPolicyReference | `referenceId` | 티켓, 정책 ID, 인용 섹션, 참조 이유 |
| ActionHistory | `historyId`  | 저장·승인·이관, AI 판단, 최종 답변, 정책 근거 |

## 상태값

- 주문: `PAID`, `PREPARING`, `IN_TRANSIT`, `DELIVERED`, `CANCELLED`, `REFUNDED`
- 주문 상태 코드는 저장과 검색 조건에만 사용하며 정책 본문, LLM 입력과 고객 안내에는 각각 결제 완료, 상품 준비 중, 배송 중, 배송 완료, 주문 취소, 환불 완료로 표현한다.
- 문의: `OPEN`, `IN_REVIEW`, `RESOLVED`, `ESCALATED`
- 상담사 역할: `AGENT`, `ADMIN`
- 고객 등급: `BRONZE`, `SILVER`, `GOLD`, `VIP`
- AI 권장 처리: 환불·쿠폰·교환·반품·불량 증빙·취소·주문 변경·배송지 변경·배송 추적·환불/반품비 안내·회원 혜택·이관
- AI 제안 결과: `ADOPTED`, `EDITED`, `REJECTED`
- AI 신뢰도: 1~5점 정수

## AI 제안 계약

AI 제안은 고객 답변 초안, 정책 근거, 권장 처리 코드, 신뢰도로 구성한다.

```ts
type AiSuggestion = {
  replyDraft: string; // 500자 이내
  policyReferences: {
    policyId: string;
    section: string;
    reason: string;
  }[];
  recommendedAction: AiAction;
  confidenceScore: 1 | 2 | 3 | 4 | 5;
  confidenceReason: string;
  missingInformation: string[];
  reviewRequired: boolean;
};
```

`policyReferences`와 `missingInformation`은 각각 최대 3개다. `reviewRequired`는 모델이 생성하지
않고 서버가 정책 근거, 누락 정보, 처리안 종류로 계산한다. `policyReferences`는 검색되어 모델에
전달된 정책만 참조할 수 있다. 서버는 정책 근거가 없는
응답을 1점과 `ESCALATE`로 보정하고, 누락 정보가 있는 응답은 최대 3점, 담당자 승인 또는 외부
확인이 필요한 응답은 최대 4점으로 제한한다.

신뢰도 기준은 다음과 같다.

| 점수 | 기준 |
| --- | --- |
| 1점 | 적용 정책이 없거나 상충하고 핵심 사실도 부족함 |
| 2점 | 관련 정책은 있으나 핵심 사실이 부족해 담당자 판단이 필요함 |
| 3점 | 다음 단계는 식별했지만 사진·재고·택배사·출고 여부 확인이 필요함 |
| 4점 | 정책과 주문 사실이 처리안을 뒷받침하지만 실제 승인 또는 실행이 필요함 |
| 5점 | 외부 확인이나 재량 판단 없이 정확한 정보 안내가 가능함 |

## 저장 및 동시성

- 초안 저장은 `TicketDraft`를 upsert하고 `DRAFT_SAVED` 이력을 추가한다.
- 답변 승인은 티켓을 `RESOLVED`로 변경하고 현재 초안을 제거한 뒤
  `RESPONSE_APPROVED` 이력을 추가한다.
- 담당자 이관은 담당자와 상태를 변경하고 초안을 보존한 뒤 `ESCALATED` 이력을 추가한다.
- 승인과 이관은 PostgreSQL `Serializable` 트랜잭션으로 실행한다.
- `Ticket.version`을 함께 검사해 다른 요청이 먼저 상태나 담당자를 바꾸면 `409 TICKET_CONFLICT`를
  반환한다.
- API는 클라이언트가 보낸 상담사 ID로 권한을 판단하지 않고 Auth.js 세션의 `agentId`를 DB의
  활성 상담사와 다시 대조한다.

## AI 평가셋

`src/data/ai-evaluation-cases.json`은 20개 티켓에 대한 기대 정책 섹션, 권장 처리안, 허용 신뢰도
범위를 저장한다. 자동 테스트는 정책 검색 상위 3개 재현율과 서버 날짜 계산 및 LLM 전달 데이터
허용 목록을 검증한다. 모델별 처리안·점수 정확도는 동일 평가셋을 사용해 비교한다.

## 첫 번째 데모 흐름

`TKT-1008`은 `ORD-202607-1008`과 연결된다. 서버는 기준일과 배송 예정일의 차이를 8일로 계산하고,
`POL-DELIVERY-001`과 `POL-REFUND-001`의 근거 섹션을 찾아 배송 추적과 환불 검토 조건을 제안한다.
