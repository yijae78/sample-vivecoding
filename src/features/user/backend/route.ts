import type { Hono } from 'hono';
import {
  failure,
  success,
  respond,
  type ErrorResult,
} from '@/backend/http/response';
import {
  getLogger,
  getSupabase,
  type AppEnv,
} from '@/backend/hono/context';
import {
  InfluencerOnboardingSchema,
  AdvertiserOnboardingSchema,
} from '@/features/user/backend/schema';
import {
  createInfluencerProfile,
  createAdvertiserProfile,
  createUserProfile,
} from './service';
import {
  userErrorCodes,
  type UserServiceError,
} from './error';

export const registerUserRoutes = (app: Hono<AppEnv>) => {
  // 회원가입 후 프로필 생성
  app.post('/users/profile', async (c) => {
    const body = await c.req.json();
    const { userId, name, phone, email, role } = body;

    if (!userId || !name || !phone || !email || !role) {
      return respond(
        c,
        failure(400, userErrorCodes.invalidParams, 'Missing required fields.'),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await createUserProfile(supabase, userId, {
      name,
      phone,
      email,
      password: '', // 프로필 생성 시에는 비밀번호 불필요
      role,
      termsAccepted: true,
    });

    if (!result.ok) {
      const errorResult = result as ErrorResult<UserServiceError, unknown>;
      logger.error('Failed to create user profile', errorResult.error.message);
      return respond(c, result);
    }

    return respond(c, result);
  });

  // 인플루언서 온보딩
  app.post('/users/onboarding/influencer', async (c) => {
    const body = await c.req.json();
    const userId = body.userId as string | undefined;
    
    if (!userId) {
      return respond(
        c,
        failure(401, userErrorCodes.invalidParams, 'User ID is required.'),
      );
    }

    const parsed = InfluencerOnboardingSchema.safeParse(body);

    if (!parsed.success) {
      return respond(
        c,
        failure(
          400,
          userErrorCodes.validationError,
          'Invalid influencer onboarding data.',
          parsed.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await createInfluencerProfile(supabase, userId, parsed.data);

    if (!result.ok) {
      const errorResult = result as ErrorResult<UserServiceError, unknown>;
      logger.error('Failed to create influencer profile', errorResult.error.message);
      return respond(c, result);
    }

    return respond(c, result);
  });

  // 광고주 온보딩
  app.post('/users/onboarding/advertiser', async (c) => {
    const body = await c.req.json();
    const userId = body.userId as string | undefined;
    
    if (!userId) {
      return respond(
        c,
        failure(401, userErrorCodes.invalidParams, 'User ID is required.'),
      );
    }

    const parsed = AdvertiserOnboardingSchema.safeParse(body);

    if (!parsed.success) {
      return respond(
        c,
        failure(
          400,
          userErrorCodes.validationError,
          'Invalid advertiser onboarding data.',
          parsed.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await createAdvertiserProfile(supabase, userId, parsed.data);

    if (!result.ok) {
      const errorResult = result as ErrorResult<UserServiceError, unknown>;
      logger.error('Failed to create advertiser profile', errorResult.error.message);
      return respond(c, result);
    }

    return respond(c, result);
  });

  // 광고주 프로필 조회 (user_id로)
  app.get('/users/advertiser-profile', async (c) => {
    const userId = c.req.query('userId');

    if (!userId) {
      return respond(
        c,
        failure(400, userErrorCodes.invalidParams, 'User ID is required.'),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const { data, error } = await supabase
      .from('advertiser_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      logger.error('Failed to fetch advertiser profile', error.message);
      return respond(
        c,
        failure(500, userErrorCodes.notFound, error.message),
      );
    }

    if (!data) {
      return respond(
        c,
        failure(404, userErrorCodes.notFound, 'Advertiser profile not found'),
      );
    }

    return respond(c, success({ id: data.id }));
  });
};
