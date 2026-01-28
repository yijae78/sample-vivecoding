import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import type { SignupInput } from '@/features/user/backend/schema';
import type { InfluencerOnboardingInput } from '@/features/user/backend/schema';
import type { AdvertiserOnboardingInput } from '@/features/user/backend/schema';
import {
  userErrorCodes,
  type UserServiceError,
} from '@/features/user/backend/error';

const USERS_TABLE = 'users';
const USER_ROLES_TABLE = 'user_roles';
const TERMS_ACCEPTANCES_TABLE = 'terms_acceptances';
const INFLUENCER_PROFILES_TABLE = 'influencer_profiles';
const INFLUENCER_CHANNELS_TABLE = 'influencer_channels';
const ADVERTISER_PROFILES_TABLE = 'advertiser_profiles';

// 회원가입 후 프로필 생성
export const createUserProfile = async (
  client: SupabaseClient,
  userId: string,
  input: SignupInput,
): Promise<HandlerResult<{ userId: string }, UserServiceError, unknown>> => {
  // users 테이블에 프로필 생성
  const { error: userError } = await client
    .from(USERS_TABLE)
    .insert({
      id: userId,
      name: input.name,
      phone: input.phone,
      email: input.email,
    });

  if (userError) {
    return failure(500, userErrorCodes.createError, userError.message);
  }

  // user_roles 테이블에 역할 저장
  const { error: roleError } = await client
    .from(USER_ROLES_TABLE)
    .insert({
      user_id: userId,
      role: input.role,
    });

  if (roleError) {
    return failure(500, userErrorCodes.createError, roleError.message);
  }

  // 약관 동의 이력 저장
  const { error: termsError } = await client
    .from(TERMS_ACCEPTANCES_TABLE)
    .insert({
      user_id: userId,
      terms_type: 'service',
      accepted: true,
    });

  if (termsError) {
    // 약관 동의 실패는 치명적이지 않으므로 로그만 남기고 계속 진행
    console.warn('Failed to save terms acceptance:', termsError.message);
  }

  return success({ userId });
};

// 인플루언서 온보딩
export const createInfluencerProfile = async (
  client: SupabaseClient,
  userId: string,
  input: InfluencerOnboardingInput,
): Promise<HandlerResult<{ profileId: string }, UserServiceError, unknown>> => {
  // 기존 프로필 확인
  const { data: existingProfile } = await client
    .from(INFLUENCER_PROFILES_TABLE)
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existingProfile) {
    return failure(409, userErrorCodes.duplicateProfile, '이미 인플루언서 프로필이 존재합니다.');
  }

  // influencer_profiles 생성
  const { data: profileData, error: profileError } = await client
    .from(INFLUENCER_PROFILES_TABLE)
    .insert({
      user_id: userId,
      birth_date: input.birthDate,
      profile_completed: true,
    })
    .select('id')
    .single();

  if (profileError || !profileData) {
    return failure(500, userErrorCodes.createError, profileError?.message ?? 'Failed to create influencer profile');
  }

  // influencer_channels 생성
  if (input.channels.length > 0) {
    const channelsToInsert = input.channels.map((channel) => ({
      influencer_profile_id: profileData.id,
      channel_type: channel.channelType,
      channel_name: channel.channelName,
      channel_url: channel.channelUrl,
      verification_status: 'pending' as const,
    }));

    const { error: channelsError } = await client
      .from(INFLUENCER_CHANNELS_TABLE)
      .insert(channelsToInsert);

    if (channelsError) {
      // 채널 생성 실패 시 프로필도 롤백 (수동 삭제)
      await client.from(INFLUENCER_PROFILES_TABLE).delete().eq('id', profileData.id);
      return failure(500, userErrorCodes.createError, channelsError.message);
    }
  }

  return success({ profileId: profileData.id });
};

// 광고주 온보딩
export const createAdvertiserProfile = async (
  client: SupabaseClient,
  userId: string,
  input: AdvertiserOnboardingInput,
): Promise<HandlerResult<{ profileId: string }, UserServiceError, unknown>> => {
  const { data: profileData, error: profileError } = await client
    .from(ADVERTISER_PROFILES_TABLE)
    .insert({
      user_id: userId,
      company_name: input.companyName,
      location: input.location ?? null,
      category: input.category ?? null,
      business_registration_number: input.businessRegistrationNumber,
      profile_completed: true,
    })
    .select('id')
    .single();

  if (profileError || !profileData) {
    return failure(500, userErrorCodes.createError, profileError?.message ?? 'Failed to create advertiser profile');
  }

  return success({ profileId: profileData.id });
};
