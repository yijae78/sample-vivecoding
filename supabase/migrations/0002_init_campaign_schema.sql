-- Migration: Initialize campaign platform schema
-- Creates all tables for the blog campaign matching SaaS platform

------------------------------------------------------------
-- 1. users (사용자 기본 정보)
-- Supabase Auth와 연동되는 사용자 기본 프로필 테이블
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);

COMMENT ON TABLE public.users IS '사용자 기본 프로필 테이블 (Supabase Auth 연동)';

------------------------------------------------------------
-- 2. user_roles (사용자 역할)
-- 사용자의 역할(광고주/인플루언서) 저장
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('advertiser', 'influencer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

COMMENT ON TABLE public.user_roles IS '사용자 역할 테이블 (광고주/인플루언서)';

------------------------------------------------------------
-- 3. terms_acceptances (약관 동의 이력)
-- 약관 동의 이력 저장
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.terms_acceptances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    terms_type VARCHAR(50) NOT NULL,
    accepted BOOLEAN NOT NULL DEFAULT true,
    accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address VARCHAR(45),
    user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_terms_acceptances_user_id ON public.terms_acceptances(user_id);
CREATE INDEX IF NOT EXISTS idx_terms_acceptances_terms_type ON public.terms_acceptances(terms_type);

COMMENT ON TABLE public.terms_acceptances IS '약관 동의 이력 테이블';

------------------------------------------------------------
-- 4. influencer_profiles (인플루언서 프로필)
-- 인플루언서 전용 프로필 정보
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.influencer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    birth_date DATE NOT NULL,
    profile_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_influencer_profiles_user_id ON public.influencer_profiles(user_id);

COMMENT ON TABLE public.influencer_profiles IS '인플루언서 전용 프로필 정보';

------------------------------------------------------------
-- 5. influencer_channels (인플루언서 SNS 채널)
-- 인플루언서의 SNS 채널 정보
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.influencer_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    influencer_profile_id UUID NOT NULL REFERENCES public.influencer_profiles(id) ON DELETE CASCADE,
    channel_type VARCHAR(20) NOT NULL CHECK (channel_type IN ('naver', 'youtube', 'instagram', 'threads')),
    channel_name VARCHAR(255) NOT NULL,
    channel_url VARCHAR(500) NOT NULL,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_influencer_channels_profile_id ON public.influencer_channels(influencer_profile_id);
CREATE INDEX IF NOT EXISTS idx_influencer_channels_type ON public.influencer_channels(channel_type);
CREATE INDEX IF NOT EXISTS idx_influencer_channels_status ON public.influencer_channels(verification_status);

COMMENT ON TABLE public.influencer_channels IS '인플루언서의 SNS 채널 정보 (Naver, YouTube, Instagram, Threads)';

------------------------------------------------------------
-- 6. advertiser_profiles (광고주 프로필)
-- 광고주 전용 프로필 정보
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.advertiser_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    category VARCHAR(100),
    business_registration_number VARCHAR(50) NOT NULL UNIQUE,
    profile_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_advertiser_profiles_user_id ON public.advertiser_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_advertiser_profiles_business_number ON public.advertiser_profiles(business_registration_number);

COMMENT ON TABLE public.advertiser_profiles IS '광고주 전용 프로필 정보';

------------------------------------------------------------
-- 7. campaigns (체험단)
-- 광고주가 등록한 체험단 정보
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advertiser_profile_id UUID NOT NULL REFERENCES public.advertiser_profiles(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_campaigns_advertiser_id ON public.campaigns(advertiser_profile_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_recruitment_dates ON public.campaigns(recruitment_start_date, recruitment_end_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON public.campaigns(created_at DESC);

COMMENT ON TABLE public.campaigns IS '광고주가 등록한 체험단 정보';

------------------------------------------------------------
-- 8. applications (체험단 지원)
-- 인플루언서가 체험단에 지원한 정보
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    influencer_profile_id UUID NOT NULL REFERENCES public.influencer_profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    planned_visit_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'selected', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(campaign_id, influencer_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_campaign_id ON public.applications(campaign_id);
CREATE INDEX IF NOT EXISTS idx_applications_influencer_id ON public.applications(influencer_profile_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON public.applications(created_at DESC);

COMMENT ON TABLE public.applications IS '인플루언서가 체험단에 지원한 정보';

------------------------------------------------------------
-- Row Level Security 설정 (초기에는 비활성화)
------------------------------------------------------------
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.terms_acceptances DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.influencer_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.influencer_channels DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.advertiser_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.applications DISABLE ROW LEVEL SECURITY;
