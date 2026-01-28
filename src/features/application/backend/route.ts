import type { Hono } from 'hono';
import { z } from 'zod';
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
  ApplicationCreateSchema,
  ApplicationListParamsSchema,
} from '@/features/application/backend/schema';
import {
  createApplication,
  getApplications,
  updateApplicationStatus,
} from './service';
import {
  applicationErrorCodes,
  type ApplicationServiceError,
} from './error';

export const registerApplicationRoutes = (app: Hono<AppEnv>) => {
  // 체험단 지원 생성
  app.post('/applications', async (c) => {
    const body = await c.req.json();
    const userId = body.userId as string | undefined;

    if (!userId) {
      return respond(
        c,
        failure(401, applicationErrorCodes.invalidParams, 'User ID is required.'),
      );
    }

    const parsed = ApplicationCreateSchema.safeParse(body);

    if (!parsed.success) {
      return respond(
        c,
        failure(
          400,
          applicationErrorCodes.validationError,
          'Invalid application data.',
          parsed.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await createApplication(supabase, userId, parsed.data);

    if (!result.ok) {
      const errorResult = result as ErrorResult<ApplicationServiceError, unknown>;
      logger.error('Failed to create application', errorResult.error.message);
      return respond(c, result);
    }

    return respond(c, result);
  });

  // 지원 목록 조회
  app.get('/applications', async (c) => {
    const queryParams = c.req.query();
    const parsed = ApplicationListParamsSchema.safeParse(queryParams);

    if (!parsed.success) {
      return respond(
        c,
        failure(
          400,
          applicationErrorCodes.invalidParams,
          'Invalid query parameters.',
          parsed.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const { data, error } = await getApplications(supabase, parsed.data);

    if (error) {
      logger.error('Failed to fetch applications', error.message);
      return respond(
        c,
        failure(500, applicationErrorCodes.notFound, error.message),
      );
    }

    return respond(c, success(data ?? []));
  });

  // 지원 상태 업데이트 (선정/거절)
  app.patch('/applications/:id/status', async (c) => {
    const body = await c.req.json();
    const userId = body.userId as string | undefined;
    const advertiserProfileId = body.advertiserProfileId as string | undefined;
    const campaignId = body.campaignId as string | undefined;
    const status = body.status as 'selected' | 'rejected' | undefined;

    if (!userId || !advertiserProfileId || !campaignId || !status) {
      return respond(
        c,
        failure(400, applicationErrorCodes.invalidParams, 'Missing required fields.'),
      );
    }

    if (status !== 'selected' && status !== 'rejected') {
      return respond(
        c,
        failure(400, applicationErrorCodes.validationError, 'Status must be "selected" or "rejected".'),
      );
    }

    const parsedParams = z.object({ id: z.string().uuid() }).safeParse({
      id: c.req.param('id'),
    });

    if (!parsedParams.success) {
      return respond(
        c,
        failure(400, applicationErrorCodes.invalidParams, 'Invalid application id.'),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await updateApplicationStatus(
      supabase,
      parsedParams.data.id,
      campaignId,
      advertiserProfileId,
      status,
    );

    if (!result.ok) {
      const errorResult = result as ErrorResult<ApplicationServiceError, unknown>;
      logger.error('Failed to update application status', errorResult.error.message);
      return respond(c, result);
    }

    return respond(c, result);
  });
};
