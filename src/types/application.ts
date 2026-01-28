import type { Database } from "@/lib/supabase/types";

export type Application = Database["public"]["Tables"]["applications"]["Row"];
export type ApplicationInsert = Database["public"]["Tables"]["applications"]["Insert"];
export type ApplicationUpdate = Database["public"]["Tables"]["applications"]["Update"];

export type ApplicationStatus = Application["status"];

export type ApplicationWithCampaign = Application & {
  campaign: {
    title: string;
    status: string;
    recruitment_end_date: string;
  };
};

export type ApplicationWithInfluencer = Application & {
  influencer_profile: {
    user_id: string;
  };
};
