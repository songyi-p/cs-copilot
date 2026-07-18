# CS Copilot

쇼핑몰 CS 담당자가 고객 문의를 더 빠르고 일관되게 처리하도록 돕는 AI 기반 운영 백오피스입니다.

## 해결할 문제

CS 담당자는 주문 정보, 배송 상태, 환불 정책을 여러 화면에서 확인한 뒤 고객에게 답변해야 합니다.
정책이 복잡하거나 예외 상황이면 처리 시간이 늘고, 답변 품질도 담당자마다 달라질 수 있습니다.

## 핵심 사용자

쇼핑몰 CS 담당자

## 첫 번째 시나리오

고객: "배송 예정일이 8일 지난 주문의 분실 확인과 환불 가능 여부를 검토해 주세요."

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
OPENAI_MODEL=gpt-5.4-nano
```

`OPENAI_MODEL`은 선택 사항이며 설정하지 않으면 `gpt-5.4-nano`를 사용합니다. API 키가 없거나
LLM 호출에 실패하면 화면에 실패 상태와 재시도 버튼을 표시하며, 하드코딩된 답변을 AI 결과로
대체하지 않습니다.

```bash
npm run dev
```

## LLM 데이터 계약

브라우저는 `/api/ai-suggestion`에 다음 정보만 전달합니다.

- 고객 문의 제목과 내용, 문의 분류
- 고객 식별자를 제외한 관련 주문 정보
- 문의 분류·주문 상태·키워드 검색으로 선택된 최대 3개의 정책 섹션

고객 프로필, 담당자 정보, 처리 이력은 LLM에 전달하지 않습니다. 서버는 OpenAI Node SDK의
`responses.parse()`와 Structured Outputs를 사용해 다음 구조를 요청합니다. Zod 스키마를
런타임 검증과 TypeScript 타입의 단일 기준으로 사용합니다. 배송 예정일 경과 일수, 수령 후
경과 일수, 출고 전 여부는 서버가 기준 시각으로 계산해 주문 정보에 추가합니다.

```ts
{
  replyDraft: string; // 500자 이내
  policyReferences: {
    policyId: string;
    section: string;
    reason: string;
  }[];
  recommendedAction: AiRecommendedAction;
  confidenceScore: 1 | 2 | 3 | 4 | 5;
  confidenceReason: string;
  missingInformation: string[];
  reviewRequired: boolean;
}
```

정책 근거와 추가 확인 정보는 각각 최대 3개로 제한합니다. `reviewRequired`는 모델 출력에
의존하지 않고 정책 근거, 누락 정보, 처리안 종류를 기준으로 서버에서 계산합니다. 정책 근거는
LLM에 실제로 전달된 정책 ID와 섹션만 허용합니다. 정책 근거가 없으면 서버가
신뢰도를 1점으로 제한하고 담당자 이관으로 보정합니다. 누락 정보가 있으면 최대 3점, 실제 승인이나
외부 확인이 필요한 제안은 최대 4점으로 제한합니다.

서버는 고정 프롬프트 캐시 키와 낮은 응답 verbosity를 사용하며, 완료 로그에 응답시간과 입력·캐시·
출력·추론 토큰 수를 기록해 지연시간을 측정합니다.

클라이언트는 Axios로 내부 API를 호출하고 TanStack Query로 티켓별 로딩, 오류, 취소, 캐시 및
명시적 재시도를 관리합니다. LLM 호출 비용이 불필요하게 증가하지 않도록 창 포커스 자동 재조회와
클라이언트 자동 재시도는 비활성화합니다.

## 검증

20개의 실무형 문의 평가셋은 `src/data/ai-evaluation-cases.json`에 있습니다. 각 사례에는 기대 정책,
권장 처리안, 허용 신뢰도 범위가 정의되어 있습니다.

```bash
npm test
npm exec tsc -- --noEmit
npm run build
```

`npm test`는 모든 평가 문의에서 기대 정책이 검색 상위 3개에 포함되는지, 서버의 날짜 파생값과
LLM 전달 허용 목록이 유지되는지 확인합니다. 실제 모델의 처리안과 신뢰도 평가는 API 키가 설정된
환경에서 같은 평가셋을 사용해 별도로 비교합니다.
