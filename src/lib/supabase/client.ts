import { createBrowserClient } from "@supabase/ssr";
import { getEnv } from "@/constants/env";

export function createClient() {
  const env = getEnv();
  if (!env) {
    throw new Error(
      "환경 변수를 설정해주세요. .env.local에 NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY를 추가하세요."
    );
  }
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
