import type { Database } from "@/lib/supabase/types";

export type User = Database["public"]["Tables"]["users"]["Row"];
export type UserInsert = Database["public"]["Tables"]["users"]["Insert"];
export type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

export type UserRole = Database["public"]["Tables"]["user_roles"]["Row"]["role"];

export type UserWithRole = User & {
  role: UserRole | null;
};

export type InfluencerProfile = Database["public"]["Tables"]["influencer_profiles"]["Row"];
export type InfluencerProfileInsert = Database["public"]["Tables"]["influencer_profiles"]["Insert"];

export type InfluencerChannel = Database["public"]["Tables"]["influencer_channels"]["Row"];
export type InfluencerChannelInsert = Database["public"]["Tables"]["influencer_channels"]["Insert"];

export type AdvertiserProfile = Database["public"]["Tables"]["advertiser_profiles"]["Row"];
export type AdvertiserProfileInsert = Database["public"]["Tables"]["advertiser_profiles"]["Insert"];

export type InfluencerProfileWithChannels = InfluencerProfile & {
  channels: InfluencerChannel[];
};

export type AdvertiserProfileWithUser = AdvertiserProfile & {
  user: User;
};
