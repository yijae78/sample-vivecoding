import { createMiddleware } from 'hono/factory';
import { contextKeys, type AppEnv, type AppContext } from '@/backend/hono/context';

// 인증 미들웨어 - 요청 헤더나 쿠키에서 사용자 ID 추출
// 실제 구현은 Next.js Route Handler에서 쿠키를 읽어서 처리
export const withAuth = () =>
  createMiddleware<AppEnv>(async (c, next) => {
    // Authorization 헤더에서 토큰 추출 시도
    const authHeader = c.req.header('Authorization');
    let userId: string | undefined;

    if (authHeader?.startsWith('Bearer ')) {
      // 토큰에서 사용자 ID 추출 (실제로는 JWT 디코딩 필요)
      // 임시로 요청 본문에서 userId를 받도록 함
    }

    // 요청 본문에서 userId 확인 (클라이언트에서 보낼 경우)
    try {
      const body = await c.req.json().catch(() => null);
      if (body && typeof body === 'object' && 'userId' in body) {
        userId = body.userId as string;
      }
    } catch {
      // 본문이 없거나 파싱 실패 시 무시
    }

    c.set(contextKeys.userId, userId);
    await next();
  });

export const getCurrentUserId = (c: AppContext): string | undefined => {
  return c.get(contextKeys.userId) as string | undefined;
};
