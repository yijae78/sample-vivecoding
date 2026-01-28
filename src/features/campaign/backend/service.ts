import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import {
  CampaignResponseSchema,
  CampaignTableRowSchema,
  type CampaignResponse,
  type CampaignRow,
  type CampaignListParams,
  type CampaignCreateInput,
  type CampaignUpdateInput,
} from '@/features/campaign/backend/schema';
import {
  campaignErrorCodes,
  type CampaignServiceError,
} from '@/features/campaign/backend/error';

const CAMPAIGNS_TABLE = 'campaigns';
const ADVERTISER_PROFILES_TABLE = 'advertiser_profiles';

export const getCampaigns = async (
  client: SupabaseClient,
  params: CampaignListParams,
): Promise<HandlerResult<CampaignResponse[], CampaignServiceError, unknown>> => {
  let query = client
    .from(CAMPAIGNS_TABLE)
    .select(`
      *,
      advertiser_profile:advertiser_profiles!campaigns_advertiser_profile_id_fkey (
        company_name,
        location,
        category
      )
    `)
    .order('created_at', { ascending: false })
    .range(params.offset, params.offset + params.limit - 1);

  if (params.status) {
    query = query.eq('status', params.status);
  }

  const { data, error } = await query;

  if (error) {
    return failure(500, campaignErrorCodes.fetchError, error.message);
  }

  if (!data || data.length === 0) {
    return success([]);
  }

  const campaigns: CampaignResponse[] = [];

  for (const row of data) {
    const rowParse = CampaignTableRowSchema.safeParse(row);

    if (!rowParse.success) {
      return failure(
        500,
        campaignErrorCodes.validationError,
        'Campaign row failed validation.',
        rowParse.error.format(),
      );
    }

    const advertiserProfile = row.advertiser_profile as {
      company_name: string;
      location: string | null;
      category: string | null;
    } | null;

    const mapped: CampaignResponse = {
      id: rowParse.data.id,
      advertiserProfileId: rowParse.data.advertiser_profile_id,
      title: rowParse.data.title,
      recruitmentStartDate: rowParse.data.recruitment_start_date,
      recruitmentEndDate: rowParse.data.recruitment_end_date,
      maxParticipants: rowParse.data.max_participants,
      benefits: rowParse.data.benefits,
      mission: rowParse.data.mission,
      storeInfo: rowParse.data.store_info,
      status: rowParse.data.status,
      createdAt: rowParse.data.created_at,
      updatedAt: rowParse.data.updated_at,
      advertiser: advertiserProfile
        ? {
            companyName: advertiserProfile.company_name,
            location: advertiserProfile.location,
            category: advertiserProfile.category,
          }
        : undefined,
    };

    const parsed = CampaignResponseSchema.safeParse(mapped);

    if (!parsed.success) {
      return failure(
        500,
        campaignErrorCodes.validationError,
        'Campaign payload failed validation.',
        parsed.error.format(),
      );
    }

    campaigns.push(parsed.data);
  }

  return success(campaigns);
};

export const getCampaignById = async (
  client: SupabaseClient,
  id: string,
): Promise<HandlerResult<CampaignResponse, CampaignServiceError, unknown>> => {
  const { data, error } = await client
    .from(CAMPAIGNS_TABLE)
    .select(`
      *,
      advertiser_profile:advertiser_profiles!campaigns_advertiser_profile_id_fkey (
        company_name,
        location,
        category
      )
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    return failure(500, campaignErrorCodes.fetchError, error.message);
  }

  if (!data) {
    return failure(404, campaignErrorCodes.notFound, 'Campaign not found');
  }

  const rowParse = CampaignTableRowSchema.safeParse(data);

  if (!rowParse.success) {
    return failure(
      500,
      campaignErrorCodes.validationError,
      'Campaign row failed validation.',
      rowParse.error.format(),
    );
  }

  const advertiserProfile = data.advertiser_profile as {
    company_name: string;
    location: string | null;
    category: string | null;
  } | null;

  const mapped: CampaignResponse = {
    id: rowParse.data.id,
    advertiserProfileId: rowParse.data.advertiser_profile_id,
    title: rowParse.data.title,
    recruitmentStartDate: rowParse.data.recruitment_start_date,
    recruitmentEndDate: rowParse.data.recruitment_end_date,
    maxParticipants: rowParse.data.max_participants,
    benefits: rowParse.data.benefits,
    mission: rowParse.data.mission,
    storeInfo: rowParse.data.store_info,
    status: rowParse.data.status,
    createdAt: rowParse.data.created_at,
    updatedAt: rowParse.data.updated_at,
    advertiser: advertiserProfile
      ? {
          companyName: advertiserProfile.company_name,
          location: advertiserProfile.location,
          category: advertiserProfile.category,
        }
      : undefined,
  };

  const parsed = CampaignResponseSchema.safeParse(mapped);

  if (!parsed.success) {
    return failure(
      500,
      campaignErrorCodes.validationError,
      'Campaign payload failed validation.',
      parsed.error.format(),
    );
  }

  return success(parsed.data);
};

// 체험단 생성
export const createCampaign = async (
  client: SupabaseClient,
  advertiserProfileId: string,
  input: CampaignCreateInput,
): Promise<HandlerResult<{ campaignId: string }, CampaignServiceError, unknown>> => {
  const { data: campaignData, error: campaignError } = await client
    .from(CAMPAIGNS_TABLE)
    .insert({
      advertiser_profile_id: advertiserProfileId,
      title: input.title,
      recruitment_start_date: input.recruitmentStartDate,
      recruitment_end_date: input.recruitmentEndDate,
      max_participants: input.maxParticipants,
      benefits: input.benefits,
      mission: input.mission,
      store_info: input.storeInfo,
      status: 'recruiting',
    })
    .select('id')
    .single();

  if (campaignError || !campaignData) {
    return failure(500, campaignErrorCodes.createError, campaignError?.message ?? 'Failed to create campaign');
  }

  return success({ campaignId: campaignData.id });
};

// 체험단 업데이트
export const updateCampaign = async (
  client: SupabaseClient,
  campaignId: string,
  advertiserProfileId: string,
  input: CampaignUpdateInput,
): Promise<HandlerResult<{ campaignId: string }, CampaignServiceError, unknown>> => {
  // 권한 확인: 해당 광고주의 체험단인지 확인
  const { data: existingCampaign, error: checkError } = await client
    .from(CAMPAIGNS_TABLE)
    .select('advertiser_profile_id')
    .eq('id', campaignId)
    .single();

  if (checkError || !existingCampaign) {
    return failure(404, campaignErrorCodes.notFound, 'Campaign not found');
  }

  if (existingCampaign.advertiser_profile_id !== advertiserProfileId) {
    return failure(403, campaignErrorCodes.forbidden, 'You do not have permission to update this campaign');
  }

  // 업데이트 데이터 준비
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.status !== undefined) {
    updateData.status = input.status;
  }
  if (input.title !== undefined) {
    updateData.title = input.title;
  }
  if (input.recruitmentStartDate !== undefined) {
    updateData.recruitment_start_date = input.recruitmentStartDate;
  }
  if (input.recruitmentEndDate !== undefined) {
    updateData.recruitment_end_date = input.recruitmentEndDate;
  }
  if (input.maxParticipants !== undefined) {
    updateData.max_participants = input.maxParticipants;
  }
  if (input.benefits !== undefined) {
    updateData.benefits = input.benefits;
  }
  if (input.mission !== undefined) {
    updateData.mission = input.mission;
  }
  if (input.storeInfo !== undefined) {
    updateData.store_info = input.storeInfo;
  }

  const { error: updateError } = await client
    .from(CAMPAIGNS_TABLE)
    .update(updateData)
    .eq('id', campaignId);

  if (updateError) {
    return failure(500, campaignErrorCodes.updateError, updateError.message);
  }

  return success({ campaignId });
};
