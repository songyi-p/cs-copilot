<div align="center">

# CS Copilot

정책 근거와 주문 맥락을 함께 보여 주고, 상담사가 최종 판단하도록 돕는 AI 고객센터 백오피스

[**라이브 데모 → https://cs-copilot-pearl.vercel.app**](https://cs-copilot-pearl.vercel.app/)

</div>

## 프로젝트 소개

고객 문의 한 건을 처리하려면 주문 상태를 확인하고, 여러 정책에서 적용 조건을 찾고, 고객에게 보낼
답변까지 작성해야 합니다. CS Copilot은 이 과정을 하나의 작업 화면으로 연결한 데모 프로젝트입니다.

단순히 답변을 생성하는 챗봇이 아닙니다. 문의와 주문에 맞는 정책을 먼저 검색하고, AI가 사용한
근거와 신뢰도, 추가 확인이 필요한 정보를 답변 초안과 함께 제시합니다. 상담사는 제안을 수정하거나
임시 저장하고, 최종 승인 또는 다른 담당자에게 이관할 수 있습니다.

## FlowChart

<img width="600" height="1080" alt="image" src="https://github.com/user-attachments/assets/233fd268-d2fc-425e-9ff1-05358b685b76" />

## 이 프로젝트의 강점

### 답변을 만들기 전 근거부터 탐색

Markdown 정책 문서를 검색 가능한 단위로 나누고, 문의 유형·주문 상태·핵심 키워드에 가중치를 적용해 관련 정책을 선별합니다. AI에는 이렇게 선별된 정책만 전달하며, 답변의 근거 역시 실제로 전달된 정책 ID와 섹션으로 제한합니다.

### AI의 답변은 검증을 거쳐 사용

OpenAI Structured Outputs와 Zod 스키마를 활용해 요청과 응답 형식을 일관되게 관리하고, 생성된 결과가 업무 규칙을 충족하는지 서버에서 다시 검증합니다. 정책 근거가 없으면 신뢰도를 최저 수준으로 조정하고 담당자 이관을 권장합니다. 정보가 부족하거나 별도의 승인이 필요한 처리안에는 신뢰도 상한을 적용합니다.
AI 호출에 실패했을 때는 오류 상태와 재시도 기능을 명확히 표시합니다. 미리 작성된 문구를 AI가 생성한 답변처럼 대신 노출하지 않습니다.

### 필요한 정보만 AI에 전달

모델에 전달되는 정보는 고객 문의, 식별 정보를 제외한 관련 주문 정보, 검색된 정책 섹션으로 한정합니다. 고객 프로필, 담당자 정보, 기존 처리 이력처럼 답변 생성에 불필요한 정보는 입력에서 제외합니다. API 키와 AI 호출 로직은 서버에서만 관리해 클라이언트에 노출되지 않도록 구성했습니다.

### 제안이 실제 업무 처리로 연결

AI 답변을 보여주는 데서 끝나지 않고, 담당자 권한 확인부터 초안 수정과 저장, 승인, 담당자 이관, 처리 이력 기록까지 하나의 흐름으로 연결했습니다. 작업 중인 상태는 localStorage에 보존되므로 새로고침 후에도 이어서 확인할 수 있습니다.

## 주요 기여

- 문의, 주문, 정책, 담당자와 처리 이력을 연결한 CS 업무 시나리오 및 데이터 모델 설계
- 티켓 목록, 상세 정보, AI 제안 패널을 결합한 반응형 백오피스 UI 구현
- 카테고리·주문 상태·키워드 가중치를 활용한 정책 섹션 검색과 근거 노출 구현
- OpenAI SDK, Structured Outputs, Zod를 사용한 서버 전용 LLM 파이프라인 구축
- 정책 근거 검증, 신뢰도 보정, 담당자 이관 등 AI 안전장치 설계
- Auth.js 데모 세션, 상담사 권한과 배정 티켓 조회 구현
- PostgreSQL·Prisma 기반 초안, 승인, 담당자 이관과 처리 이력 저장 구현
- 승인·이관 트랜잭션 및 동시 수정 충돌 검사 구현
- 20개 실무형 평가 사례와 자동 테스트를 통한 정책 검색 및 데이터 허용 목록 검증
- Vercel 배포, Preview 보호와 AI API Rate Limiting을 포함한 공개 데모 운영 구성

## 기술 스택

| 영역         | 기술                                     |
| ------------ | ---------------------------------------- |
| Web          | Next.js 16, React 19, TypeScript         |
| UI           | Tailwind CSS 4                           |
| Server State | TanStack Query, Axios                    |
| Database     | PostgreSQL                               |
| ORM          | Prisma                                   |
| Auth         | Auth.js                                  |
| AI           | OpenAI Responses API, Structured Outputs |
| Validation   | Zod                                      |
| Deployment   | Vercel                                   |

## 로컬 실행

```bash
npm install
cp .env.example .env.local
```

`.env.local`에 PostgreSQL 연결 정보, Auth.js secret과 서버 전용 API 키를 설정합니다.
`DATABASE_URL`에는 애플리케이션 트래픽용 pooled URL을, `DIRECT_URL`에는 migration용 direct URL을
사용합니다. `OPENAI_MODEL`은 선택 사항입니다.

```dotenv
DATABASE_URL=
DIRECT_URL=
AUTH_SECRET=
AUTH_TRUST_HOST=true
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=gpt-5.4-nano
```

처음 구성한 DB에는 migration과 초기 데이터를 적용합니다.

```bash
npm run db:migrate:deploy
npm run db:seed
```

```bash
npm run dev
```

자세한 Neon·Vercel 연결 및 운영 절차는
[`docs/database-setup.md`](docs/database-setup.md)를 참고하세요.

## 검증

```bash
npm test
npm exec tsc -- --noEmit
npm run build
```

자동 테스트는 정책 검색 상위 3개 재현율, 주문 날짜 파생값, LLM 전달 데이터 허용 목록, 응답 근거와
신뢰도 보정 규칙, 상담사 권한 및 저장 요청 계약을 확인합니다. 상세한 도메인 구조는
[`docs/data-model.md`](docs/data-model.md)에서 볼 수 있습니다.

## 현재 범위

이 프로젝트는 제품 흐름을 검증하기 위한 데모입니다. 로그인은 자유 회원가입이 아닌 seed된 윤서연
상담사 계정으로만 시작합니다. 정책 원본과 검색 인덱스는 아직 Git의 Markdown·JSON으로 관리하며,
실제 고객 메시지 발송과 결제·환불 실행은 포함하지 않습니다. 모든 AI 처리안은 제안이며 실제 실행
전에 담당자의 확인 또는 승인이 필요합니다.
