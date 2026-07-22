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
| Ticket        | `ticketId`   | 고객/주문, 문의 제목·내용, 분류, 처리 상태   |
| Policy        | `policyId`   | Markdown 문서의 frontmatter 및 섹션          |
| PolicyReference | `referenceId` | 티켓, 정책, 인용 섹션, 참조 이유           |
| ActionHistory | `historyId`  | AI 제안, 신뢰도, 담당자 수정, 승인 결과, 정책 근거 |

## 상태값

- 주문: `PAID`, `PREPARING`, `IN_TRANSIT`, `DELIVERED`, `CANCELLED`, `REFUNDED`
- 문의: `OPEN`, `IN_REVIEW`, `RESOLVED`, `ESCALATED`
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

## AI 평가셋

`src/data/ai-evaluation-cases.json`은 20개 티켓에 대한 기대 정책 섹션, 권장 처리안, 허용 신뢰도
범위를 저장한다. 자동 테스트는 정책 검색 상위 3개 재현율과 서버 날짜 계산 및 LLM 전달 데이터
허용 목록을 검증한다. 모델별 처리안·점수 정확도는 동일 평가셋을 사용해 비교한다.

## 첫 번째 데모 흐름

`TKT-1008`은 `ORD-202607-1008`과 연결된다. 서버는 기준일과 배송 예정일의 차이를 8일로 계산하고,
`POL-DELIVERY-001`과 `POL-REFUND-001`의 근거 섹션을 찾아 배송 추적과 환불 검토 조건을 제안한다.
