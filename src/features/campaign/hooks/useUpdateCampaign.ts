'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import type { CampaignUpdateInput } from '@/features/campaign/backend/schema';

export const useUpdateCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { campaignId: string; userId: string; advertiserProfileId: string } & CampaignUpdateInput) => {
      try {
        const { campaignId, ...body } = input;
        const { data } = await apiClient.patch(`/api/campaigns/${campaignId}`, body);
        return data;
      } catch (error) {
        const message = extractApiErrorMessage(error, '체험단 수정에 실패했습니다.');
        throw new Error(message);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId] });
    },
  });
};
