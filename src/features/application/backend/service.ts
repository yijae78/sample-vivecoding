import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import {
  applicationErrorCodes,
  type ApplicationServiceError,
} from '@/features/application/backend/error';
import type { ApplicationCreateInput } from '@/features/application/backend/schema';

const APPLICATIONS_TABLE = 'applications';
const CAMPAIGNS_TABLE = 'campaigns';
const INFLUENCER_PROFILES_TABLE = 'influencer_profiles';

// 체험단 지원 생성
export const createApplication = async (
  client: SupabaseClient,
  userId: string,
  input: ApplicationCreateInput,
): Promise<HandlerResult<{ applicationId: string }, ApplicationServiceError, unknown>> => {
  // 1. 체험단 존재 및 모집 중인지 확인
  const { data: campaign, error: campaignError } = await client
    .from(CAMPAIGNS_TABLE)
    .select('id, status, recruitment_end_date')
    .eq('id', input.campaignId)
    .single();

  if (campaignError || !campaign) {
    return failure(404, applicationErrorCodes.notFound, '체험단을 찾을 수 없습니다.');
  }

  if (campaign.status !== 'recruiting') {
    return failure(400, applicationErrorCodes.campaignClosed, '모집이 종료된 체험단입니다.');
  }

  // 2. 인플루언서 프로필 확인
  const { data: influencerProfile, error: profileError } = await client
    .from(INFLUENCER_PROFILES_TABLE)
    .select('id, profile_completed')
    .eq('user_id', userId)
    .single();

  if (profileError || !influencerProfile) {
    return failure(403, applicationErrorCodes.influencerNotEligible, '인플루언서 프로필이 등록되지 않았습니다.');
  }

  if (!influencerProfile.profile_completed) {
    return failure(403, applicationErrorCodes.influencerNotEligible, '인플루언서 프로필을 완성해주세요.');
  }

  // 3. 중복 지원 확인
  const { data: existingApplication } = await client
    .from(APPLICATIONS_TABLE)
    .select('id')
    .eq('campaign_id', input.campaignId)
    .eq('influencer_id', influencerProfile.id)
    .maybeSingle();

  if (existingApplication) {
    return failure(409, applicationErrorCodes.duplicateApplication, '이미 지원한 체험단입니다.');
  }

  // 4. 지원 생성
  const { data: applicationData, error: applicationError } = await client
    .from(APPLICATIONS_TABLE)
    .insert({
      campaign_id: input.campaignId,
      influencer_id: influencerProfile.id,
      message: input.message,
      planned_visit_date: input.plannedVisitDate,
      status: 'pending',
    })
    .select('id')
    .single();

  if (applicationError || !applicationData) {
    return failure(500, applicationErrorCodes.createError, applicationError?.message ?? '지원 생성에 실패했습니다.');
  }

  return success({ applicationId: applicationData.id });
};

// 지원 목록 조회
export const getApplications = async (
  client: SupabaseClient,
  params: {
    campaignId?: string;
    influencerId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  },
) => {
  let query = client
    .from(APPLICATIONS_TABLE)
    .select('*');

  if (params.campaignId) {
    query = query.eq('campaign_id', params.campaignId);
  }

  if (params.influencerId) {
    query = query.eq('influencer_id', params.influencerId);
  }

  if (params.status) {
    query = query.eq('status', params.status);
  }

  if (params.limit) {
    query = query.limit(params.limit);
  }

  if (params.offset) {
    query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    return { data: null, error };
  }

  return { data, error: null };
};

// 지원 상태 업데이트 (선정/거절)
export const updateApplicationStatus = async (
  client: SupabaseClient,
  applicationId: string,
  campaignId: string,
  advertiserProfileId: string,
  status: 'selected' | 'rejected',
): Promise<HandlerResult<{ applicationId: string }, ApplicationServiceError, unknown>> => {
  // 권한 확인: 해당 광고주의 체험단인지 확인
  const { data: campaign, error: campaignError } = await client
    .from(CAMPAIGNS_TABLE)
    .select('advertiser_profile_id')
    .eq('id', campaignId)
    .single();

  if (campaignError || !campaign) {
    return failure(404, applicationErrorCodes.notFound, 'Campaign not found');
  }

  if (campaign.advertiser_profile_id !== advertiserProfileId) {
    return failure(403, applicationErrorCodes.invalidParams, 'You do not have permission to update this application');
  }

  // 지원이 해당 체험단의 것인지 확인
  const { data: application, error: appError } = await client
    .from(APPLICATIONS_TABLE)
    .select('campaign_id')
    .eq('id', applicationId)
    .single();

  if (appError || !application) {
    return failure(404, applicationErrorCodes.notFound, 'Application not found');
  }

  if (application.campaign_id !== campaignId) {
    return failure(400, applicationErrorCodes.invalidParams, 'Application does not belong to this campaign');
  }

  // 상태 업데이트
  const { error: updateError } = await client
    .from(APPLICATIONS_TABLE)
    .update({ status })
    .eq('id', applicationId);

  if (updateError) {
    return failure(500, applicationErrorCodes.updateError, updateError.message);
  }

  return success({ applicationId });
};
