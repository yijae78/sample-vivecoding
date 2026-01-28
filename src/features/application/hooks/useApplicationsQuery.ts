'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { ApplicationResponseSchema } from '@/features/application/backend/schema';
import type { ApplicationListParams } from '@/features/application/backend/schema';

const fetchApplications = async (params?: ApplicationListParams) => {
  try {
    const searchParams = new URLSearchParams();
    if (params?.campaignId) {
      searchParams.set('campaignId', params.campaignId);
    }
    if (params?.influencerId) {
      searchParams.set('influencerId', params.influencerId);
    }
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
    const url = `/api/applications${queryString ? `?${queryString}` : ''}`;

    const { data } = await apiClient.get(url);
    
    if (Array.isArray(data)) {
      return data.map((item) => ApplicationResponseSchema.parse(item));
    }
    
    return [];
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Failed to fetch applications.');
    throw new Error(message);
  }
};

export const useApplicationsQuery = (params?: ApplicationListParams) =>
  useQuery({
    queryKey: ['applications', params],
    queryFn: () => fetchApplications(params),
    staleTime: 30 * 1000, // 30초
  });
