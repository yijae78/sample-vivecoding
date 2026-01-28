'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { CampaignResponseSchema } from '@/features/campaign/backend/schema';

const fetchCampaign = async (id: string) => {
  try {
    const { data } = await apiClient.get(`/api/campaigns/${id}`);
    return CampaignResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Failed to fetch campaign.');
    throw new Error(message);
  }
};

export const useCampaignQuery = (id: string) =>
  useQuery({
    queryKey: ['campaign', id],
    queryFn: () => fetchCampaign(id),
    enabled: Boolean(id),
    staleTime: 60 * 1000, // 1분
  });
