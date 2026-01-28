'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import type { InfluencerOnboardingInput } from '@/features/user/backend/schema';

export const useInfluencerOnboarding = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (input: InfluencerOnboardingInput & { userId: string }) => {
      try {
        const { data } = await apiClient.post('/api/users/onboarding/influencer', input);
        return data;
      } catch (error) {
        const message = extractApiErrorMessage(error, '온보딩 처리 중 오류가 발생했습니다.');
        throw new Error(message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
      router.replace('/');
    },
  });
};
