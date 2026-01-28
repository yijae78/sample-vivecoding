'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import type { CampaignCreateInput } from '@/features/campaign/backend/schema';

export const useCreateCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CampaignCreateInput & { userId: string; advertiserProfileId: string }) => {
      try {
        const { data } = await apiClient.post('/api/campaigns', input);
        return data;
      } catch (error) {
        const message = extractApiErrorMessage(error, '체험단 등록에 실패했습니다.');
        throw new Error(message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
};
