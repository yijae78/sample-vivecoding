"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getEnv } from "@/constants/env";
import type { Database } from "./types";

let client: SupabaseClient<Database> | null = null;

export const getSupabaseBrowserClient = (): SupabaseClient<Database> => {
  const env = getEnv();
  if (!env) {
    throw new Error(
      "환경 변수를 설정해주세요. .env.local에 NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY를 추가하세요."
    );
  }
  if (!client) {
    client = createBrowserClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }

  return client;
};
