# CS Copilot

쇼핑몰 CS 담당자가 고객 문의를 더 빠르고 일관되게 처리하도록 돕는 AI 기반 운영 백오피스입니다.

## 해결할 문제

CS 담당자는 주문 정보, 배송 상태, 환불 정책을 여러 화면에서 확인한 뒤 고객에게 답변해야 합니다.
정책이 복잡하거나 예외 상황이면 처리 시간이 늘고, 답변 품질도 담당자마다 달라질 수 있습니다.

## 핵심 사용자

쇼핑몰 CS 담당자

## 첫 번째 시나리오

고객: "지난주에 주문했는데 아직 상품을 못 받았어요. 환불 가능한가요?"

담당자는 주문을 선택하고 문의 내용을 입력합니다.
시스템은 주문/배송 정보와 배송·환불 정책을 조회합니다.

1. 고객 답변 초안
2. 참고한 정책 근거
3. 권장 처리안
   을 제시한다.

담당자가 수정·승인하면 답변과 처리 결과가 이력에 기록됩니다.

## 이번 버전에서 하지 않는 것

- 실제 메시지 발송
- 실제 결제·환불 처리
- 자동 승인
- 멀티 에이전트

## 로컬 실행

의존성을 설치한 뒤 환경변수 예시 파일을 복사합니다.

```bash
npm install
cp .env.example .env.local
```

`.env.local`에 서버 전용 OpenAI API 키를 설정합니다.

```dotenv
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=gpt-5-mini
```

`OPENAI_MODEL`은 선택 사항이며 설정하지 않으면 `gpt-5-mini`를 사용합니다. API 키가 없거나
LLM 호출에 실패하면 화면에 실패 상태와 재시도 버튼을 표시하며, 하드코딩된 답변을 AI 결과로
대체하지 않습니다.

```bash
npm run dev
```

## LLM 데이터 계약

브라우저는 `/api/ai-suggestion`에 다음 정보만 전달합니다.

- 고객 문의 내용
- 고객 식별자를 제외한 관련 주문 정보
- 키워드 검색으로 선택된 최대 4개의 정책 섹션

고객 프로필, 담당자 정보, 처리 이력은 LLM에 전달하지 않습니다. 서버는 OpenAI Responses API의
Structured Outputs를 사용해 다음 구조를 요청하고, 받은 값을 다시 런타임 검증합니다.

```ts
{
  replyDraft: string;
  policyReferences: {
    policyId: string;
    section: string;
    reason: string;
  }[];
  recommendedAction: "REFUND_REVIEW" | "DELAY_COUPON" | "ESCALATE";
  confidence: "high" | "medium" | "low";
}
```

정책 근거는 LLM에 실제로 전달된 정책 ID와 섹션만 허용합니다. `confidence`가 `low`이면 모델이
반환한 처리 코드와 관계없이 화면의 권장 처리안을 `담당자 이관 권장`으로 표시합니다.
