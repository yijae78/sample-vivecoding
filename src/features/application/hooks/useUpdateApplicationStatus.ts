'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';

export const useUpdateApplicationStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      applicationId: string;
      campaignId: string;
      userId: string;
      advertiserProfileId: string;
      status: 'selected' | 'rejected';
    }) => {
      try {
        const { data } = await apiClient.patch(`/api/applications/${input.applicationId}/status`, {
          userId: input.userId,
          advertiserProfileId: input.advertiserProfileId,
          campaignId: input.campaignId,
          status: input.status,
        });
        return data;
      } catch (error) {
        const message = extractApiErrorMessage(error, '지원 상태 업데이트에 실패했습니다.');
        throw new Error(message);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['applications', { campaignId: variables.campaignId }] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
};
