import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getAppConfig } from "@/backend/config";

export async function createClient() {
  const config = getAppConfig();
  const cookieStore = await cookies();

  return createServerClient(
    config.supabase.url,
    config.supabase.serviceRoleKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

export async function createPureClient() {
  const config = getAppConfig();
  return createServerClient(
    config.supabase.url,
    config.supabase.serviceRoleKey,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
    }
  );
}
