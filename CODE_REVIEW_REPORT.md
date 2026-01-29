# 전체 코드 검토 보고서

검토 일시: 2026-01-29  
대상: supernext 프로젝트 (Next.js 15 + Hono API + Supabase)

---

## 1. 현재 정상으로 확인된 부분

| 항목 | 상태 |
|------|------|
| **Backend context** | `AppVariables`에 `userId` 포함, `contextKeys.userId` 사용 |
| **Auth 미들웨어** | `c.set(contextKeys.userId, userId)` 사용 (USER_ID_KEY 미사용) |
| **User schema** | Zod `channelUrl` 검증을 객체 단위 `.refine()`으로 처리, `ChannelInput[]` 단언 |
| **InfluencerOnboardingForm** | `ChannelType`/`ChannelInput`을 `@/lib/validation/channel`에서 import, `checkDuplicateChannels` 인자에 `as ChannelInput[]` 단언 (4곳) |
| **Schema export** | `ChannelType`은 schema에서 export하지 않음 (channel 모듈에서만) |
| **API 라우팅** | `app.route("/api", api)`로 마운트, `/api/users/profile` 등 경로 일치 |
| **Application/Campaign** | `applicationErrorCodes` 단일 import, `useApplicationsQuery`/`useCampaignQuery` import 경로 정상 |
| **My Applications** | `ApplicationCardData`에 optional 필드, `status ?? "pending"` 등 fallback 처리 |
| **useCampaignQuery** | `enabled: Boolean(id)`로 빈 문자열 시 요청 미발생 |

---

## 2. 환경 변수 관련 (실패 시 부딪히기 쉬운 부분)

### 2.1 클라이언트 (`src/constants/env.ts`)

- **NEXT_PUBLIC_SUPABASE_URL**, **NEXT_PUBLIC_SUPABASE_ANON_KEY** 없으면 앱 로드 시 `throw new Error('환경 변수를 확인하세요.')` 발생.
- `layout.tsx` → `loadCurrentUser()` → `createSupabaseServerClient()` → `env` 사용으로, **첫 페이지 로드 시점**에 검증됨.
- **로컬**: `.env.local`에 위 두 값 필수.

### 2.2 백엔드 (`src/backend/config/index.ts`)

- **SUPABASE_URL**: 없으면 `NEXT_PUBLIC_SUPABASE_URL` 폴백 사용.
- **SUPABASE_SERVICE_ROLE_KEY**: 폴백 없음. 없으면 `Invalid backend configuration: SUPABASE_SERVICE_ROLE_KEY: Required` 발생.
- **Vercel**: 프로젝트 설정에서 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` 반드시 설정 필요.

### 2.3 미검증 env 사용 (잠재 이슈)

| 파일 | 내용 |
|------|------|
| `src/lib/supabase/server.ts` | `process.env.NEXT_PUBLIC_SUPABASE_URL!`, `process.env.SUPABASE_SERVICE_ROLE_KEY!` 직접 사용. 현재 **어디서도 import되지 않음** (미사용 코드). |
| `src/lib/supabase/client.ts` | `process.env.NEXT_PUBLIC_*!` 직접 사용. `@/lib/supabase/client`를 import하는 코드 없음 (browser 쪽은 `browser-client.ts` 사용). |

- 위 파일들을 나중에 사용할 경우, env 검증 없이 사용하면 런타임 에러 가능. 사용할 때는 `env` 또는 `getAppConfig()`로 통일하는 것이 안전함.

---

## 3. 로컬 빌드/실행 시 참고

### 3.1 SWC 네이티브 바이너리 경고

- `@next/swc-win32-x64-msvc` is not a valid Win32 application  
  → ARM(예: WoA) 또는 다른 아키텍처에서 x64용 바이너리 로드 시 발생할 수 있는 경고.  
  - 대부분 **경고만** 나고 컴파일은 진행됨.  
  - 빌드 실패가 이 경고 때문이면, 해당 환경용 SWC 패키지 설치 또는 Next.js/SWC 버전 조정이 필요할 수 있음.

### 3.2 Turbopack

- `package.json`의 `dev` 스크립트는 이미 `next dev`만 사용 (turbopack 미사용).  
  - 과거 `turbo.createProject is not supported by the wasm bindings` 이슈 회피용으로 보임.  
  - 현재 설정 기준으로 추가 수정 불필요.

---

## 4. 배포(Vercel) 시 체크리스트

1. **환경 변수**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`  
   (Vercel에서는 `SUPABASE_URL` 없어도 `NEXT_PUBLIC_SUPABASE_URL` 폴백으로 동작)

2. **최신 코드 반영**
   - `userId`/`contextKeys`, schema/ChannelInput 단언, `ChannelType` import 등 수정 사항이 모두 커밋·푸시되어 있는지 확인.

3. **빌드**
   - 로컬에서 `npm run build` 한 번 성공하는지 확인 후 푸시하면, 타입/import 관련 실패 가능성이 줄어듦.

---

## 5. 요약

- **타입/import**: 이전에 수정한 auth context, schema refine, InfluencerOnboardingForm의 ChannelType/ChannelInput 사용은 일관되게 적용되어 있음.
- **실제로 부딪히기 쉬운 부분**은 **환경 변수** (로컬 `.env.local`, Vercel의 `SUPABASE_SERVICE_ROLE_KEY`).
- **미사용 코드**: `src/lib/supabase/server.ts`, `src/lib/supabase/client.ts`는 현재 import처가 없음. 사용할 계획이 있으면 env 접근 방식을 `env`/`getAppConfig()`와 맞추는 것이 좋음.

이상으로 검토를 마칩니다.
