import { z } from 'zod';

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const _clientEnv = clientEnvSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

if (!_clientEnv.success) {
  console.error('환경 변수 검증 실패:', _clientEnv.error.flatten().fieldErrors);
}

/**
 * 클라이언트용 환경 변수. 검증 실패 시 null 반환 (앱이 크래시하지 않음).
 * .env.local에 NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY 설정 필요.
 */
export function getEnv(): ClientEnv | null {
  return _clientEnv.success ? _clientEnv.data : null;
}
