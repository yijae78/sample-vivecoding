import { Hono } from "hono";
import { errorBoundary } from "@/backend/middleware/error";
import { withAppContext } from "@/backend/middleware/context";
import { withSupabase } from "@/backend/middleware/supabase";
import { registerExampleRoutes } from "@/features/example/backend/route";
import { registerCampaignRoutes } from "@/features/campaign/backend/route";
import { registerUserRoutes } from "@/features/user/backend/route";
import { registerApplicationRoutes } from "@/features/application/backend/route";
import type { AppEnv } from "@/backend/hono/context";

let singletonApp: Hono<AppEnv> | null = null;

export const createHonoApp = () => {
  if (singletonApp && process.env.NODE_ENV === "production") {
    return singletonApp;
  }

  const app = new Hono<AppEnv>();
  const api = new Hono<AppEnv>();

  api.use("*", errorBoundary());
  api.use("*", withAppContext());
  api.use("*", withSupabase());

  registerExampleRoutes(api);
  registerCampaignRoutes(api);
  registerUserRoutes(api);
  registerApplicationRoutes(api);

  api.notFound((c) => {
    return c.json(
      {
        error: {
          code: "NOT_FOUND",
          message: `Route not found: ${c.req.method} ${c.req.path}`,
        },
      },
      404
    );
  });

  app.route("/api", api);

  if (process.env.NODE_ENV === "production") {
    singletonApp = app;
  }

  return app;
};
