import type { Hono } from 'hono';
import {
  failure,
  respond,
  type ErrorResult,
} from '@/backend/http/response';
import {
  getLogger,
  getSupabase,
  type AppEnv,
} from '@/backend/hono/context';
import {
  CampaignListParamsSchema,
  CampaignDetailParamsSchema,
  CampaignCreateSchema,
  CampaignUpdateSchema,
} from '@/features/campaign/backend/schema';
import { getCampaigns, getCampaignById, createCampaign, updateCampaign } from './service';
import {
  campaignErrorCodes,
  type CampaignServiceError,
} from './error';

export const registerCampaignRoutes = (app: Hono<AppEnv>) => {
  // 체험단 목록 조회
  app.get('/campaigns', async (c) => {
    const parsedParams = CampaignListParamsSchema.safeParse({
      status: c.req.query('status'),
      limit: c.req.query('limit'),
      offset: c.req.query('offset'),
    });

    if (!parsedParams.success) {
      return respond(
        c,
        failure(
          400,
          campaignErrorCodes.invalidParams,
          'Invalid campaign list parameters.',
          parsedParams.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await getCampaigns(supabase, parsedParams.data);

    if (!result.ok) {
      const errorResult = result as ErrorResult<CampaignServiceError, unknown>;

      if (errorResult.error.code === campaignErrorCodes.fetchError) {
        logger.error('Failed to fetch campaigns', errorResult.error.message);
      }

      return respond(c, result);
    }

    return respond(c, result);
  });

  // 체험단 상세 조회
  app.get('/campaigns/:id', async (c) => {
    const parsedParams = CampaignDetailParamsSchema.safeParse({
      id: c.req.param('id'),
    });

    if (!parsedParams.success) {
      return respond(
        c,
        failure(
          400,
          campaignErrorCodes.invalidParams,
          'Invalid campaign id.',
          parsedParams.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await getCampaignById(supabase, parsedParams.data.id);

    if (!result.ok) {
      const errorResult = result as ErrorResult<CampaignServiceError, unknown>;

      if (errorResult.error.code === campaignErrorCodes.fetchError) {
        logger.error('Failed to fetch campaign', errorResult.error.message);
      }

      return respond(c, result);
    }

    return respond(c, result);
  });

  // 체험단 생성
  app.post('/campaigns', async (c) => {
    const body = await c.req.json();
    const userId = body.userId as string | undefined;
    const advertiserProfileId = body.advertiserProfileId as string | undefined;

    if (!userId || !advertiserProfileId) {
      return respond(
        c,
        failure(401, campaignErrorCodes.invalidParams, 'User ID and advertiser profile ID are required.'),
      );
    }

    const parsed = CampaignCreateSchema.safeParse(body);

    if (!parsed.success) {
      return respond(
        c,
        failure(
          400,
          campaignErrorCodes.validationError,
          'Invalid campaign data.',
          parsed.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await createCampaign(supabase, advertiserProfileId, parsed.data);

    if (!result.ok) {
      const errorResult = result as ErrorResult<CampaignServiceError, unknown>;
      logger.error('Failed to create campaign', errorResult.error.message);
      return respond(c, result);
    }

    return respond(c, result);
  });

  // 체험단 업데이트
  app.patch('/campaigns/:id', async (c) => {
    const body = await c.req.json();
    const userId = body.userId as string | undefined;
    const advertiserProfileId = body.advertiserProfileId as string | undefined;

    if (!userId || !advertiserProfileId) {
      return respond(
        c,
        failure(401, campaignErrorCodes.invalidParams, 'User ID and advertiser profile ID are required.'),
      );
    }

    const parsedParams = CampaignDetailParamsSchema.safeParse({
      id: c.req.param('id'),
    });

    if (!parsedParams.success) {
      return respond(
        c,
        failure(
          400,
          campaignErrorCodes.invalidParams,
          'Invalid campaign id.',
          parsedParams.error.format(),
        ),
      );
    }

    const parsed = CampaignUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return respond(
        c,
        failure(
          400,
          campaignErrorCodes.validationError,
          'Invalid campaign update data.',
          parsed.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await updateCampaign(supabase, parsedParams.data.id, advertiserProfileId, parsed.data);

    if (!result.ok) {
      const errorResult = result as ErrorResult<CampaignServiceError, unknown>;
      logger.error('Failed to update campaign', errorResult.error.message);
      return respond(c, result);
    }

    return respond(c, result);
  });
};
