# PostgreSQL·Auth.js 설정

## 구성

애플리케이션과 DB는 별도로 배포한다.

```text
Browser
  → Vercel Next.js
  → Auth.js 및 Route Handler
  → Prisma Client
  → managed PostgreSQL
```

이 저장소는 Prisma 7의 PostgreSQL driver adapter를 사용한다. 일반 Next.js 요청은 connection
pooling이 적용된 `DATABASE_URL`을 사용하고, Prisma migration과 seed는 `DIRECT_URL`을 우선
사용한다.

## Neon 연결

1. Vercel Marketplace 또는 Neon Console에서 PostgreSQL 프로젝트를 생성한다.
2. Vercel Function과 가까운 DB 리전을 선택한다.
3. pooled 연결 문자열을 Vercel 프로젝트의 `DATABASE_URL`로 등록한다.
4. direct 연결 문자열을 `DIRECT_URL`로 등록한다.
5. `AUTH_SECRET`과 `AUTH_TRUST_HOST=true`를 등록한다.
6. Preview와 Production 환경에 필요한 값을 각각 연결한다.

실제 연결 문자열과 secret은 Git에 추가하지 않는다. 로컬에서는 `.env.example`을 참고해
`.env.local`을 직접 구성한다.

```dotenv
DATABASE_URL=
DIRECT_URL=
AUTH_SECRET=
AUTH_TRUST_HOST=true
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4-nano
```

Auth.js secret은 다음 명령으로 생성할 수 있다.

```bash
npx auth secret --copy
```

## 초기화와 배포

로컬 개발 DB에서 새 migration을 만들 때:

```bash
npm run db:migrate -- --name <migration-name>
```

새 DB나 운영 DB에 이미 커밋된 migration을 적용할 때:

```bash
npm run db:migrate:deploy
```

초기 데모 데이터를 넣을 때:

```bash
npm run db:seed
```

seed는 upsert 기반이므로 같은 DB에서 다시 실행할 수 있다. 다음 운영 데이터를 이전한다.

- `customers.json`
- `orders.json`
- `tickets.json`
- `action-history.json`
- `policy-references.json`

`ai-evaluation-cases.json`과 `policy-search-index.json`은 런타임 DB 데이터가 아니라 평가·검색
fixture이므로 seed하지 않는다.

운영 배포에서는 여러 Vercel 인스턴스가 동시에 migration을 실행하지 않도록 애플리케이션의
일반 요청 경로와 분리한 CI/CD 단계에서 `prisma migrate deploy`를 한 번 실행한다. `postinstall`은
Prisma Client 생성만 수행한다.

## 데모 인증

seed는 다음 연결을 만든다.

```text
User user-demo-yoon
  → Agent agent-yoon (윤서연, AGENT)
  → 배정된 Ticket
```

익명 사용자는 첫 화면에서 `윤서연 상담사로 데모 시작`을 선택한다. Auth.js Credentials provider는
클라이언트에서 받은 담당자 ID를 신뢰하지 않고 서버에 고정된 `agent-yoon` 활성 계정만 조회한다.
세션에는 사용자 ID, `agentId`, `role`을 저장한다.

각 업무 API는 세션의 `agentId`를 다시 DB의 활성 `Agent`와 대조한다. 일반 상담사는 배정된
티켓만 조회하고, 관리자는 전체 티켓을 조회할 수 있다. 자유 회원가입과 실제 조직 초대 흐름은
현재 데모 범위에 포함하지 않는다.

## 배포 후 확인

- 익명 첫 화면에서 데모 시작 버튼과 오류 상태가 표시되는지 확인
- 로그인 후 윤서연에게 배정된 티켓만 표시되는지 확인
- 초안 저장 후 새로고침해도 내용과 `DRAFT_SAVED` 이력이 유지되는지 확인
- 답변 승인 시 티켓과 `RESPONSE_APPROVED` 이력이 함께 저장되는지 확인
- 이관 시 현재 목록에서 티켓이 사라지고 새 담당자로 변경되는지 확인
- 중복 승인·이관 요청이 부분 저장 없이 `409`로 실패하는지 확인
- 비로그인 요청과 다른 상담사의 티켓 상세 요청이 차단되는지 확인
- AI 요청에 고객 프로필, 상담사, 처리 이력이 포함되지 않는지 확인

## 정책 데이터

정책 Markdown과 `policy-search-index.json`은 현재 Git이 원본이다. 정책을 운영 화면에서 편집하거나
버전 승인·즉시 배포가 필요해지는 시점에 `Policy`와 `PolicyVersion`을 DB 원본으로 전환한다.
그 전에는 정책 검색 projection까지 DB로 옮기지 않아도 업무 데이터의 영속성과 상담사 간 동기화
목표를 달성할 수 있다.
