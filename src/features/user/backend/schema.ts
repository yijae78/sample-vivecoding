import { z } from 'zod';
import { validateMinimumAge, MINIMUM_INFLUENCER_AGE as MINIMUM_INFLUENCER_AGE_CONST } from '@/lib/validation/age';
import { validateChannelUrl, checkDuplicateChannels, type ChannelType, type ChannelInput } from '@/lib/validation/channel';

// 회원가입 스키마
export const SignupSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요.'),
  phone: z.string().regex(/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/, '올바른 휴대폰 번호를 입력해주세요.'),
  email: z.string().email('올바른 이메일을 입력해주세요.'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다.'),
  role: z.enum(['advertiser', 'influencer'], {
    required_error: '역할을 선택해주세요.',
  }),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: '약관에 동의해주세요.',
  }),
});

export type SignupInput = z.infer<typeof SignupSchema>;

// 채널 관련 상수
export const CHANNEL_TYPES: readonly ChannelType[] = ['naver', 'youtube', 'instagram', 'threads'] as const;

export const CHANNEL_TYPE_LABELS: Record<ChannelType, string> = {
  naver: '네이버 블로그',
  youtube: 'YouTube',
  instagram: 'Instagram',
  threads: 'Threads',
};

// 인플루언서 최소 나이 상수 (lib/validation/age에서 re-export)
export const MINIMUM_INFLUENCER_AGE = MINIMUM_INFLUENCER_AGE_CONST;

// 인플루언서 온보딩 스키마
export const InfluencerOnboardingSchema = z.object({
  birthDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜 형식을 입력해주세요.')
    .refine((date) => validateMinimumAge(date, MINIMUM_INFLUENCER_AGE_CONST), {
      message: '만 14세 이상만 가입 가능합니다.',
    }),
  channels: z.array(
    z
      .object({
        channelType: z.enum(['naver', 'youtube', 'instagram', 'threads']),
        channelName: z.string().min(1, '채널명을 입력해주세요.'),
        channelUrl: z.string().url('올바른 URL을 입력해주세요.'),
      })
      .refine((channel) => validateChannelUrl(channel.channelType as ChannelType, channel.channelUrl), {
        message: '채널 유형에 맞는 URL을 입력해주세요.',
      })
  )
    .min(1, '최소 1개 이상의 SNS 채널을 등록해주세요.')
    .refine((channels) => !checkDuplicateChannels(channels as ChannelInput[]), {
      message: '동일한 채널 유형을 중복으로 등록할 수 없습니다.',
    }),
});

export type InfluencerOnboardingInput = z.infer<typeof InfluencerOnboardingSchema>;

// 광고주 온보딩 스키마
export const AdvertiserOnboardingSchema = z.object({
  companyName: z.string().min(1, '업체명을 입력해주세요.'),
  location: z.string().optional(),
  category: z.string().optional(),
  businessRegistrationNumber: z.string().min(1, '사업자등록번호를 입력해주세요.'),
});

export type AdvertiserOnboardingInput = z.infer<typeof AdvertiserOnboardingSchema>;
