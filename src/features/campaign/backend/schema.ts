import { z } from 'zod';

// 체험단 목록 조회 파라미터
export const CampaignListParamsSchema = z.object({
  status: z.enum(['recruiting', 'closed', 'completed']).optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
});

export type CampaignListParams = z.infer<typeof CampaignListParamsSchema>;

// 체험단 응답 스키마
export const CampaignResponseSchema = z.object({
  id: z.string().uuid(),
  advertiserProfileId: z.string().uuid(),
  title: z.string(),
  recruitmentStartDate: z.string(),
  recruitmentEndDate: z.string(),
  maxParticipants: z.number().int().positive(),
  benefits: z.string(),
  mission: z.string(),
  storeInfo: z.string(),
  status: z.enum(['recruiting', 'closed', 'completed']),
  createdAt: z.string(),
  updatedAt: z.string(),
  advertiser: z.object({
    companyName: z.string(),
    location: z.string().nullable(),
    category: z.string().nullable(),
  }).optional(),
});

export type CampaignResponse = z.infer<typeof CampaignResponseSchema>;

// 체험단 테이블 행 스키마
export const CampaignTableRowSchema = z.object({
  id: z.string().uuid(),
  advertiser_profile_id: z.string().uuid(),
  title: z.string(),
  recruitment_start_date: z.string(),
  recruitment_end_date: z.string(),
  max_participants: z.number().int(),
  benefits: z.string(),
  mission: z.string(),
  store_info: z.string(),
  status: z.enum(['recruiting', 'closed', 'completed']),
  created_at: z.string(),
  updated_at: z.string(),
});

export type CampaignRow = z.infer<typeof CampaignTableRowSchema>;

// 체험단 상세 조회 파라미터
export const CampaignDetailParamsSchema = z.object({
  id: z.string().uuid(),
});

export type CampaignDetailParams = z.infer<typeof CampaignDetailParamsSchema>;

// 체험단 생성 스키마
export const CampaignCreateSchema = z.object({
  title: z.string().min(1, '체험단명을 입력해주세요.').max(255, '체험단명은 255자 이하여야 합니다.'),
  recruitmentStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜 형식을 입력해주세요.'),
  recruitmentEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜 형식을 입력해주세요.'),
  maxParticipants: z.coerce.number().int().positive().max(1000, '모집 인원은 1000명 이하여야 합니다.'),
  benefits: z.string().min(1, '제공 혜택을 입력해주세요.'),
  mission: z.string().min(1, '미션을 입력해주세요.'),
  storeInfo: z.string().min(1, '매장 정보를 입력해주세요.'),
}).refine((data) => {
  const startDate = new Date(data.recruitmentStartDate);
  const endDate = new Date(data.recruitmentEndDate);
  return endDate >= startDate;
}, {
  message: '모집 종료일은 모집 시작일 이후여야 합니다.',
  path: ['recruitmentEndDate'],
});

export type CampaignCreateInput = z.infer<typeof CampaignCreateSchema>;

// 체험단 업데이트 스키마
export const CampaignUpdateSchema = z.object({
  status: z.enum(['recruiting', 'closed', 'completed']).optional(),
  title: z.string().min(1).max(255).optional(),
  recruitmentStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  recruitmentEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  maxParticipants: z.coerce.number().int().positive().max(1000).optional(),
  benefits: z.string().min(1).optional(),
  mission: z.string().min(1).optional(),
  storeInfo: z.string().min(1).optional(),
});

export type CampaignUpdateInput = z.infer<typeof CampaignUpdateSchema>;
