# 데이터베이스 설계 문서

## 1. 데이터 플로우 (Data Flow)

### 1.1 회원가입 & 역할 선택 플로우

```
[회원가입 입력]
  ↓
[Supabase Auth 계정 생성]
  ↓
[users 테이블에 기본 프로필 생성]
  ↓
[user_roles 테이블에 역할 저장]
  ↓
[terms_acceptances 테이블에 약관 동의 이력 저장]
  ↓
[역할별 분기]
  ├─ 인플루언서 → influencer_profiles, influencer_channels
  └─ 광고주 → advertiser_profiles
```

### 1.2 인플루언서 정보 등록 플로우

```
[인플루언서 정보 입력]
  ↓
[influencer_profiles 테이블 저장]
  ↓
[SNS 채널 정보 → influencer_channels 테이블 저장]
  ↓
[프로필 완성도 업데이트]
  ↓
[체험단 지원 가능 상태 활성화]
```

### 1.3 광고주 정보 등록 플로우

```
[광고주 정보 입력]
  ↓
[advertiser_profiles 테이블 저장]
  ↓
[프로필 완성도 업데이트]
  ↓
[체험단 등록 권한 활성화]
```

### 1.4 체험단 등록 & 관리 플로우

```
[광고주가 체험단 등록]
  ↓
[campaigns 테이블에 저장 (status = 'recruiting')]
  ↓
[홈 페이지에 모집 중 체험단으로 노출]
  ↓
[인플루언서가 지원]
  ↓
[applications 테이블에 저장 (status = 'pending')]
  ↓
[광고주가 모집종료]
  ↓
[campaigns.status = 'closed']
  ↓
[광고주가 선정 진행]
  ↓
[applications.status 업데이트 ('selected' / 'rejected')]
  ↓
[campaigns.status = 'completed']
```

### 1.5 체험단 지원 플로우

```
[인플루언서가 체험단 상세 페이지 접근]
  ↓
[campaigns 테이블 조회]
  ↓
[지원 버튼 클릭]
  ↓
[applications 테이블에 저장]
  ├─ campaign_id (FK)
  ├─ influencer_id (FK)
  ├─ message (각오 한마디)
  ├─ planned_visit_date (방문 예정일자)
  └─ status = 'pending'
  ↓
[내 지원 목록에 반영]
```

### 1.6 내 지원 목록 조회 플로우

```
[인플루언서가 "내 지원 목록" 접근]
  ↓
[applications 테이블 조회]
  ├─ WHERE influencer_id = 현재 사용자 ID
  └─ WHERE status IN (필터 조건)
  ↓
[campaigns 테이블 JOIN하여 체험단 정보 포함]
  ↓
[지원 목록 렌더링]
```

---

## 2. 데이터베이스 스키마 (PostgreSQL)

### 2.1 users (사용자 기본 정보)

**설명**: Supabase Auth와 연동되는 사용자 기본 프로필 테이블

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
```

### 2.2 user_roles (사용자 역할)

**설명**: 사용자의 역할(광고주/인플루언서) 저장

```sql
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('advertiser', 'influencer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, role)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);
```

### 2.3 terms_acceptances (약관 동의 이력)

**설명**: 약관 동의 이력 저장

```sql
CREATE TABLE terms_acceptances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    terms_type VARCHAR(50) NOT NULL,
    accepted BOOLEAN NOT NULL DEFAULT true,
    accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address VARCHAR(45),
    user_agent TEXT
);

CREATE INDEX idx_terms_acceptances_user_id ON terms_acceptances(user_id);
CREATE INDEX idx_terms_acceptances_terms_type ON terms_acceptances(terms_type);
```

### 2.4 influencer_profiles (인플루언서 프로필)

**설명**: 인플루언서 전용 프로필 정보

```sql
CREATE TABLE influencer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    birth_date DATE NOT NULL,
    profile_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_influencer_profiles_user_id ON influencer_profiles(user_id);
```

### 2.5 influencer_channels (인플루언서 SNS 채널)

**설명**: 인플루언서의 SNS 채널 정보

```sql
CREATE TABLE influencer_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    influencer_profile_id UUID NOT NULL REFERENCES influencer_profiles(id) ON DELETE CASCADE,
    channel_type VARCHAR(20) NOT NULL CHECK (channel_type IN ('naver', 'youtube', 'instagram', 'threads')),
    channel_name VARCHAR(255) NOT NULL,
    channel_url VARCHAR(500) NOT NULL,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_influencer_channels_profile_id ON influencer_channels(influencer_profile_id);
CREATE INDEX idx_influencer_channels_type ON influencer_channels(channel_type);
CREATE INDEX idx_influencer_channels_status ON influencer_channels(verification_status);
```

### 2.6 advertiser_profiles (광고주 프로필)

**설명**: 광고주 전용 프로필 정보

```sql
CREATE TABLE advertiser_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    category VARCHAR(100),
    business_registration_number VARCHAR(50) NOT NULL UNIQUE,
    profile_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_advertiser_profiles_user_id ON advertiser_profiles(user_id);
CREATE INDEX idx_advertiser_profiles_business_number ON advertiser_profiles(business_registration_number);
```

### 2.7 campaigns (체험단)

**설명**: 광고주가 등록한 체험단 정보

```sql
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advertiser_profile_id UUID NOT NULL REFERENCES advertiser_profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    recruitment_start_date DATE NOT NULL,
    recruitment_end_date DATE NOT NULL,
    max_participants INTEGER NOT NULL CHECK (max_participants > 0),
    benefits TEXT NOT NULL,
    mission TEXT NOT NULL,
    store_info TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'recruiting' CHECK (status IN ('recruiting', 'closed', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (recruitment_end_date >= recruitment_start_date)
);

CREATE INDEX idx_campaigns_advertiser_id ON campaigns(advertiser_profile_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_recruitment_dates ON campaigns(recruitment_start_date, recruitment_end_date);
CREATE INDEX idx_campaigns_created_at ON campaigns(created_at DESC);
```

### 2.8 applications (체험단 지원)

**설명**: 인플루언서가 체험단에 지원한 정보

```sql
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    influencer_profile_id UUID NOT NULL REFERENCES influencer_profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    planned_visit_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'selected', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(campaign_id, influencer_profile_id)
);

CREATE INDEX idx_applications_campaign_id ON applications(campaign_id);
CREATE INDEX idx_applications_influencer_id ON applications(influencer_profile_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_created_at ON applications(created_at DESC);
```

---

## 3. 주요 제약 조건 및 비즈니스 로직

### 3.1 데이터 무결성

- **users.id**는 Supabase Auth의 `auth.users.id`와 1:1 매핑
- 한 사용자는 **하나의 역할만** 가질 수 있음 (user_roles 테이블의 UNIQUE 제약)
- 한 인플루언서는 **같은 체험단에 중복 지원 불가** (applications 테이블의 UNIQUE 제약)
- 체험단 모집 기간은 **종료일이 시작일보다 같거나 이후**여야 함

### 3.2 상태 관리

- **campaigns.status**: 
  - `recruiting` → 모집 중 (홈에 노출)
  - `closed` → 모집 종료 (지원 불가, 선정 진행 가능)
  - `completed` → 선정 완료

- **applications.status**:
  - `pending` → 신청완료 (대기 중)
  - `selected` → 선정
  - `rejected` → 반려

- **influencer_channels.verification_status**:
  - `pending` → 검증 대기
  - `verified` → 검증 성공
  - `failed` → 검증 실패

### 3.3 인덱스 전략

- **조회 성능 최적화**:
  - 홈 페이지: `campaigns(status, created_at DESC)` - 모집 중 체험단 최신순
  - 내 지원 목록: `applications(influencer_profile_id, status, created_at DESC)`
  - 광고주 체험단 관리: `campaigns(advertiser_profile_id, created_at DESC)`
  - 체험단 상세 지원자 목록: `applications(campaign_id, status)`

### 3.4 외래키 관계

```
users (1) ──→ (1) user_roles
users (1) ──→ (1) influencer_profiles
users (1) ──→ (1) advertiser_profiles
users (1) ──→ (N) terms_acceptances

influencer_profiles (1) ──→ (N) influencer_channels
influencer_profiles (1) ──→ (N) applications

advertiser_profiles (1) ──→ (N) campaigns

campaigns (1) ──→ (N) applications
```

---

## 4. 마이그레이션 순서

1. `users` 테이블 생성
2. `user_roles` 테이블 생성
3. `terms_acceptances` 테이블 생성
4. `influencer_profiles` 테이블 생성
5. `influencer_channels` 테이블 생성
6. `advertiser_profiles` 테이블 생성
7. `campaigns` 테이블 생성
8. `applications` 테이블 생성

---

## 5. 향후 확장 가능성

현재 스키마는 **PRD와 userflow에 명시된 최소 기능만** 포함합니다. 향후 확장 시 고려할 수 있는 테이블:

- `campaign_banners` (홈 배너 관리)
- `application_reviews` (인플루언서 후기)
- `notifications` (알림)
- `campaign_tags` (체험단 태그/카테고리)
