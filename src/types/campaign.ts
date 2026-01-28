import type { Database } from "@/lib/supabase/types";

export type Campaign = Database["public"]["Tables"]["campaigns"]["Row"];
export type CampaignInsert = Database["public"]["Tables"]["campaigns"]["Insert"];
export type CampaignUpdate = Database["public"]["Tables"]["campaigns"]["Update"];

export type CampaignStatus = Campaign["status"];

export type CampaignWithAdvertiser = Campaign & {
  advertiser_profile: {
    company_name: string;
    location: string | null;
    category: string | null;
  };
};

export type CampaignWithStats = Campaign & {
  application_count: number;
  selected_count: number;
};
