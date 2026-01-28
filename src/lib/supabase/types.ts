export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          phone: string;
          email: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          phone: string;
          email: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string;
          email?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "users_id_fkey";
            columns: ["id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: "advertiser" | "influencer";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: "advertiser" | "influencer";
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: "advertiser" | "influencer";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      terms_acceptances: {
        Row: {
          id: string;
          user_id: string;
          terms_type: string;
          accepted: boolean;
          accepted_at: string;
          ip_address: string | null;
          user_agent: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          terms_type: string;
          accepted?: boolean;
          accepted_at?: string;
          ip_address?: string | null;
          user_agent?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          terms_type?: string;
          accepted?: boolean;
          accepted_at?: string;
          ip_address?: string | null;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "terms_acceptances_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      influencer_profiles: {
        Row: {
          id: string;
          user_id: string;
          birth_date: string;
          profile_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          birth_date: string;
          profile_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          birth_date?: string;
          profile_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "influencer_profiles_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      influencer_channels: {
        Row: {
          id: string;
          influencer_profile_id: string;
          channel_type: "naver" | "youtube" | "instagram" | "threads";
          channel_name: string;
          channel_url: string;
          verification_status: "pending" | "verified" | "failed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          influencer_profile_id: string;
          channel_type: "naver" | "youtube" | "instagram" | "threads";
          channel_name: string;
          channel_url: string;
          verification_status?: "pending" | "verified" | "failed";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          influencer_profile_id?: string;
          channel_type?: "naver" | "youtube" | "instagram" | "threads";
          channel_name?: string;
          channel_url?: string;
          verification_status?: "pending" | "verified" | "failed";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "influencer_channels_influencer_profile_id_fkey";
            columns: ["influencer_profile_id"];
            referencedRelation: "influencer_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      advertiser_profiles: {
        Row: {
          id: string;
          user_id: string;
          company_name: string;
          location: string | null;
          category: string | null;
          business_registration_number: string;
          profile_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_name: string;
          location?: string | null;
          category?: string | null;
          business_registration_number: string;
          profile_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_name?: string;
          location?: string | null;
          category?: string | null;
          business_registration_number?: string;
          profile_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "advertiser_profiles_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      campaigns: {
        Row: {
          id: string;
          advertiser_profile_id: string;
          title: string;
          recruitment_start_date: string;
          recruitment_end_date: string;
          max_participants: number;
          benefits: string;
          mission: string;
          store_info: string;
          status: "recruiting" | "closed" | "completed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          advertiser_profile_id: string;
          title: string;
          recruitment_start_date: string;
          recruitment_end_date: string;
          max_participants: number;
          benefits: string;
          mission: string;
          store_info: string;
          status?: "recruiting" | "closed" | "completed";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          advertiser_profile_id?: string;
          title?: string;
          recruitment_start_date?: string;
          recruitment_end_date?: string;
          max_participants?: number;
          benefits?: string;
          mission?: string;
          store_info?: string;
          status?: "recruiting" | "closed" | "completed";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "campaigns_advertiser_profile_id_fkey";
            columns: ["advertiser_profile_id"];
            referencedRelation: "advertiser_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      applications: {
        Row: {
          id: string;
          campaign_id: string;
          influencer_profile_id: string;
          message: string;
          planned_visit_date: string;
          status: "pending" | "selected" | "rejected";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          influencer_profile_id: string;
          message: string;
          planned_visit_date: string;
          status?: "pending" | "selected" | "rejected";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          influencer_profile_id?: string;
          message?: string;
          planned_visit_date?: string;
          status?: "pending" | "selected" | "rejected";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "applications_campaign_id_fkey";
            columns: ["campaign_id"];
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "applications_influencer_profile_id_fkey";
            columns: ["influencer_profile_id"];
            referencedRelation: "influencer_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type SupabaseUserMetadata = Record<string, unknown>;
