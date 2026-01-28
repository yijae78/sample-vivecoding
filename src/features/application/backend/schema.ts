import { z } from 'zod';

// 체험단 지원 스키마
export const ApplicationCreateSchema = z.object({
  campaignId: z.string().uuid('올바른 체험단 ID를 입력해주세요.'),
  message: z.string().min(1, '각오 한마디를 입력해주세요.').max(500, '각오 한마디는 500자 이하여야 합니다.'),
  plannedVisitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜 형식을 입력해주세요.'),
});

export type ApplicationCreateInput = z.infer<typeof ApplicationCreateSchema>;

// 지원 목록 조회 파라미터
export const ApplicationListParamsSchema = z.object({
  campaignId: z.string().uuid().optional(),
  influencerId: z.string().uuid().optional(),
  status: z.enum(['pending', 'selected', 'rejected', 'completed']).optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
});

export type ApplicationListParams = z.infer<typeof ApplicationListParamsSchema>;

// 지원 응답 스키마
export const ApplicationResponseSchema = z.object({
  id: z.string().uuid(),
  campaignId: z.string().uuid(),
  influencerId: z.string().uuid(),
  message: z.string(),
  plannedVisitDate: z.string(),
  status: z.enum(['pending', 'selected', 'rejected', 'completed']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ApplicationResponse = z.infer<typeof ApplicationResponseSchema>;
