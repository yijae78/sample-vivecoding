'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { CampaignResponseSchema } from '@/features/campaign/backend/schema';
import type { CampaignListParams } from '@/features/campaign/backend/schema';

const fetchCampaigns = async (params?: CampaignListParams) => {
  try {
    const searchParams = new URLSearchParams();
    if (params?.status) {
      searchParams.set('status', params.status);
    }
    if (params?.limit) {
      searchParams.set('limit', params.limit.toString());
    }
    if (params?.offset) {
      searchParams.set('offset', params.offset.toString());
    }

    const queryString = searchParams.toString();
    const url = `/api/campaigns${queryString ? `?${queryString}` : ''}`;

    const { data } = await apiClient.get(url);
    
    if (Array.isArray(data)) {
      return data.map((item) => CampaignResponseSchema.parse(item));
    }
    
    return [];
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Failed to fetch campaigns.');
    throw new Error(message);
  }
};

export const useCampaignsQuery = (params?: CampaignListParams) =>
  useQuery({
    queryKey: ['campaigns', params],
    queryFn: () => fetchCampaigns(params),
    staleTime: 30 * 1000, // 30초
  });
