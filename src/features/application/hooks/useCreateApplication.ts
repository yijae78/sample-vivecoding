'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import type { ApplicationCreateInput } from '@/features/application/backend/schema';

export const useCreateApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ApplicationCreateInput & { userId: string }) => {
      try {
        const { data } = await apiClient.post('/api/applications', input);
        return data;
      } catch (error) {
        const message = extractApiErrorMessage(error, '지원에 실패했습니다.');
        throw new Error(message);
      }
    },
    onSuccess: () => {
      // 지원 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
};
