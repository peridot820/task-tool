# Next.js 보일러플레이트 — 설계 문서

- 작성일: 2026-06-20
- 상태: 승인됨 (구현 계획 작성 단계로 진행)

## 1. 목표와 대상

**초보자도 읽으면 바로 이해되는, 잘 모듈화된 Next.js 풀스택 보일러플레이트**를 만든다.

- 대상: Next.js를 막 시작하는 개발자. README만 보고 실행·확장할 수 있어야 한다.
- 핵심 가치: ① 로그인이 "어떻게 동작하는지" 코드에 다 드러난다 ② 기능별 폴더로 "어디에 뭐가 있는지" 한눈에 보인다 ③ 외부 가입·복잡한 설정 없이 `npm run dev`로 바로 뜬다.

## 2. 확정된 결정사항

| 항목 | 결정 |
|---|---|
| 범위 | 풀 스타터 — DB + User 모델 + 동작하는 로그인/회원가입 + 예제 CRUD |
| 인증 방식 | 이메일 + 비밀번호 (자체 인증, 외부 서비스 없음) |
| 데이터베이스 | SQLite (설치 0, 파일 하나) — Prisma로 추후 Postgres 전환 용이 |
| 아키텍처 | 접근법 A — 자체 인증(공식 Next.js 패턴) + 기능별(features) 폴더 구조 |

대안 비교(접근법 B: Auth.js 라이브러리 / C: 타입별 폴더)는 검토 후 탈락.
- B 탈락 이유: 인증 내부가 추상화되어 초보자가 동작 원리를 보기 어렵고, Credentials 설정이 까다로움.
- C 탈락 이유: 기능이 늘면 파일이 흩어져 가독성·확장성이 떨어짐.

## 3. 기술 스택

| 영역 | 선택 | 이유 |
|---|---|---|
| 프레임워크 | Next.js (App Router, `src/` 디렉터리, `@/*` 별칭) | 최신 표준, 서버·클라이언트 통합 |
| 언어 | TypeScript | 자동완성·오타 검출 → 가독성·안정성 |
| 스타일 | Tailwind CSS v4 (CSS 기반 설정, JS 설정 파일 없음) | 설정 최소, 빠른 UI |
| DB | SQLite (`file:./dev.db`) | 설치 0 |
| ORM | Prisma (`prisma`, `@prisma/client`) | 읽기 쉬운 스키마, 타입 안전, DB 전환 쉬움 |
| 비밀번호 해싱 | bcryptjs (순수 JS) | Windows에서 네이티브 빌드 불필요 |
| 세션 | jose (HS256 JWT, httpOnly 쿠키) | 순수 JS, 세션 테이블 불필요 → 스키마 User 하나 유지 |
| 입력 검증 | Zod | "DB 건드리기 전 검증" 패턴 명확화 |
| 폼 처리 | Server Actions + `useActionState` | 모던 패턴, 검증 에러 표시 쉬움 |
| 품질 | ESLint + Prettier | 일관된 코드 스타일 |
| 테스트 | Vitest (예제 1~2개) | 테스트 작성법 맛보기 |
| 패키지 매니저 | npm | 초보자에게 가장 보편적 |
| Node | 20+ (LTS) | Next.js 최신 요구사항 충족 |

## 4. 폴더 구조

```
boilerplate/
├─ prisma/
│  ├─ schema.prisma        # User 모델 (이것 하나만)
│  └─ seed.ts              # 데모 유저 시드
├─ src/
│  ├─ app/                 # 라우팅 (페이지는 얇게, 로직은 features로 위임)
│  │  ├─ (auth)/           #   비로그인 그룹
│  │  │  ├─ login/page.tsx
│  │  │  └─ signup/page.tsx
│  │  ├─ (protected)/      #   로그인 필요 그룹
│  │  │  ├─ dashboard/page.tsx
│  │  │  └─ settings/page.tsx
│  │  ├─ layout.tsx
│  │  ├─ page.tsx          #   홈
│  │  └─ globals.css       #   Tailwind import + 테마
│  ├─ features/            # 기능 모듈 (핵심)
│  │  ├─ auth/
│  │  │  ├─ actions.ts     #   signup / login / logout (서버 액션)
│  │  │  ├─ session.ts     #   createSession / verifySession / deleteSession (jose + cookies)
│  │  │  ├─ password.ts    #   hashPassword / verifyPassword (bcryptjs)
│  │  │  ├─ validation.ts  #   로그인·회원가입 zod 스키마
│  │  │  └─ components/     #   LoginForm, SignupForm (클라이언트 컴포넌트)
│  │  └─ users/
│  │     ├─ queries.ts     #   getCurrentUser 등 조회
│  │     ├─ actions.ts     #   updateProfile / changePassword / deleteAccount
│  │     ├─ validation.ts  #   프로필·비번변경 zod 스키마
│  │     └─ components/     #   ProfileForm, DeleteAccountButton 등
│  ├─ components/ui/       # 공용 UI (Button, Input, Label, FormError ...)
│  ├─ lib/                 # 공용 인프라
│  │  ├─ prisma.ts         #   Prisma 클라이언트 싱글톤
│  │  ├─ env.ts            #   환경변수 zod 검증
│  │  └─ utils.ts          #   className 합치기 등 작은 헬퍼
│  └─ middleware.ts        # 보호 라우트 가드 (낙관적 체크 → /login 리다이렉트)
├─ .env.example
├─ .gitignore
├─ package.json
├─ tsconfig.json
├─ next.config.ts
├─ eslint.config.mjs
├─ .prettierrc
├─ vitest.config.ts
└─ README.md              # 초보자용 한국어 가이드
```

**읽는 규칙:** "기능 추가 = `features/` 밑 폴더 하나 추가." `app/`의 페이지는 화면만 담당하고, 실제 로직(서버 액션·검증·조회)은 해당 기능 폴더 안에 둔다.

## 5. 데이터 모델 (User 하나만)

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String          // 비밀번호 원문은 절대 저장하지 않음
  name         String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

세션은 서버 세션 테이블 없이 **쿠키 안의 서명된 JWT**로 처리한다. 덕분에 스키마가 User 하나로 유지된다.

## 6. 인증 흐름

1. **회원가입**: 입력 검증(zod) → 이메일 중복 확인 → 비밀번호 해싱(bcryptjs) → User 생성(Prisma) → 세션 쿠키 발급 → 대시보드로 이동
2. **로그인**: 이메일로 User 조회 → 비밀번호 비교(bcryptjs) → 세션 JWT 발급(jose) → `httpOnly` 쿠키 저장
3. **보호 페이지 접근**: `middleware`가 쿠키 존재/유효성을 낙관적으로 확인 → 없으면 `/login`으로 리다이렉트. 페이지 내부에서는 `getCurrentUser()`로 실제 유저를 조회(이중 안전).
4. **로그아웃**: 세션 쿠키 삭제 → 홈으로 이동

세션 쿠키 속성: `httpOnly`, `sameSite=lax`, `path=/`, 운영환경에서 `secure`, 만료 7일.

## 7. 화면/기능 (User 하나로 CRUD 전부 시연)

| 경로 | 설명 | CRUD | 보호 |
|---|---|---|---|
| `/` | 홈 — 소개 + 로그인 상태별 링크 | - | X |
| `/signup` | 회원가입 | **Create** | X |
| `/login` | 로그인 | - | X |
| `/dashboard` | 내 정보 보기 | **Read** | O |
| `/settings` | 이름 수정·비밀번호 변경·회원 탈퇴 | **Update / Delete** | O |

추가 도메인 모델(게시글 등) 없이 User 하나로 Create/Read/Update/Delete를 모두 보여준다. 확장 방법은 README의 "새 기능/모델 추가하는 법"에서 안내한다.

## 8. 환경변수

`.env.example`에 다음을 문서화한다.

```
DATABASE_URL="file:./dev.db"
SESSION_SECRET="여기에-충분히-긴-랜덤-문자열"   # 운영에서는 반드시 교체
```

`src/lib/env.ts`에서 zod로 검증하여, 누락 시 명확한 에러로 즉시 알린다.

## 9. 개발 도구 / npm 스크립트

```
dev        next dev
build      next build
start      next start
lint       eslint
format     prettier --write .
test       vitest
db:push    prisma db push          # 스키마 → DB 반영
db:seed    prisma db seed          # 데모 유저 삽입
db:studio  prisma studio           # DB GUI
db:reset   prisma migrate reset    # DB 초기화 (학습/실수 복구용)
```

테스트: Vitest로 순수 함수 예제 테스트 1~2개 — 예) `password.ts`의 해싱/검증 왕복, zod 검증 스키마 동작.

## 10. README 구성 (한국어)

1. 소개 (무엇을 주는 보일러플레이트인가)
2. 빠른 시작: 설치 → `.env` 설정 → `db:push` → `db:seed` → `dev` (데모 계정: `demo@example.com` / `password123`)
3. 폴더 구조 설명 (위 4장 요약)
4. 로그인은 어떻게 동작하나 (위 6장 요약 + 해당 파일 링크)
5. 새 기능/모델 추가하는 법 (예: 게시글 모델을 추가한다면? — 스키마 추가 → `db:push` → `features/posts/` 생성 패턴)
6. 자주 쓰는 명령어
7. 배포 시 주의 (SESSION_SECRET 교체, SQLite→Postgres 전환 방법 한 줄)

## 11. 범위 밖 (YAGNI)

- 소셜 로그인(OAuth) — README에 확장 안내만
- 이메일 인증 / 비밀번호 재설정 메일 발송
- 역할·권한(RBAC)
- User 외 추가 도메인 모델
- 국제화(i18n)
- 전역 상태관리 라이브러리(Redux 등)

## 12. 성공 기준

- `npm install` → `npm run db:push` → `npm run db:seed` → `npm run dev` 만으로 로그인 가능한 앱이 뜬다.
- 회원가입 → 로그인 → 대시보드 → 프로필 수정 → 비번 변경 → 탈퇴 전 과정이 동작한다.
- 비로그인 상태로 `/dashboard` 접근 시 `/login`으로 리다이렉트된다.
- 폴더 구조가 기능별로 명확히 분리되어 있다.
- README만 보고 초보자가 실행·확장할 수 있다.
- `npm run lint`, `npm run test` 통과.

## 13. 구현 시 주의점

- **Windows 친화성**: bcryptjs·jose는 순수 JS라 node-gyp 네이티브 빌드가 필요 없다(중요). Prisma는 Windows 정상 지원.
- **보안 기본기**: 비밀번호는 반드시 해싱, 세션은 `httpOnly` 쿠키 + 서명, 시크릿은 환경변수, 운영에서 `secure` 쿠키.
- **얇은 페이지**: `app/`의 page는 UI 조립만, 로직은 `features/`로. 파일이 커지면 책임이 과한 신호.
- **주석**: 초보자 대상이므로 인증·세션 등 핵심 흐름엔 "왜"를 설명하는 짧은 한국어 주석을 단다.
