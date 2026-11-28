export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "17.1";
  };
  public: {
    Tables: {
      badges: {
        Row: {
          awarded_at: string;
          event_date: string;
          event_title: string;
          id: string;
          is_hidden: boolean;
          opportunity_id: string | null;
          org_name: string;
          place: number | null;
          profile_id: string;
          result_id: string | null;
        };
        Insert: {
          awarded_at?: string;
          event_date: string;
          event_title: string;
          id?: string;
          is_hidden?: boolean;
          opportunity_id?: string | null;
          org_name: string;
          place?: number | null;
          profile_id: string;
          result_id?: string | null;
        };
        Update: {
          awarded_at?: string;
          event_date?: string;
          event_title?: string;
          id?: string;
          is_hidden?: boolean;
          opportunity_id?: string | null;
          org_name?: string;
          place?: number | null;
          profile_id?: string;
          result_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "badges_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: false;
            referencedRelation: "opportunities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "badges_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "badges_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "public_organizers";
            referencedColumns: ["profile_id"];
          },
          {
            foreignKeyName: "badges_result_id_fkey";
            columns: ["result_id"];
            isOneToOne: false;
            referencedRelation: "event_results";
            referencedColumns: ["id"];
          },
        ];
      };
      event_results: {
        Row: {
          created_at: string;
          email: string | null;
          full_name: string;
          id: string;
          opportunity_id: string;
          profile_id: string | null;
          rank: number | null;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          full_name: string;
          id?: string;
          opportunity_id: string;
          profile_id?: string | null;
          rank?: number | null;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          full_name?: string;
          id?: string;
          opportunity_id?: string;
          profile_id?: string | null;
          rank?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "event_results_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: false;
            referencedRelation: "opportunities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_results_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_results_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "public_organizers";
            referencedColumns: ["profile_id"];
          },
        ];
      };
      opportunities: {
        Row: {
          audience: Database["public"]["Enums"]["audience"];
          city: string | null;
          created_at: string;
          deadline_at: string | null;
          description: string | null;
          ends_at: string | null;
          external_url: string | null;
          id: string;
          image_url: string | null;
          is_online: boolean;
          organizer_id: string | null;
          search_vector: unknown;
          source: Database["public"]["Enums"]["opportunity_source"];
          source_url: string | null;
          starts_at: string | null;
          status: Database["public"]["Enums"]["opportunity_status"];
          title: string;
          type: Database["public"]["Enums"]["opportunity_type"];
          updated_at: string;
        };
        Insert: {
          audience?: Database["public"]["Enums"]["audience"];
          city?: string | null;
          created_at?: string;
          deadline_at?: string | null;
          description?: string | null;
          ends_at?: string | null;
          external_url?: string | null;
          id?: string;
          image_url?: string | null;
          is_online?: boolean;
          organizer_id?: string | null;
          search_vector?: unknown;
          source?: Database["public"]["Enums"]["opportunity_source"];
          source_url?: string | null;
          starts_at?: string | null;
          status?: Database["public"]["Enums"]["opportunity_status"];
          title: string;
          type: Database["public"]["Enums"]["opportunity_type"];
          updated_at?: string;
        };
        Update: {
          audience?: Database["public"]["Enums"]["audience"];
          city?: string | null;
          created_at?: string;
          deadline_at?: string | null;
          description?: string | null;
          ends_at?: string | null;
          external_url?: string | null;
          id?: string;
          image_url?: string | null;
          is_online?: boolean;
          organizer_id?: string | null;
          search_vector?: unknown;
          source?: Database["public"]["Enums"]["opportunity_source"];
          source_url?: string | null;
          starts_at?: string | null;
          status?: Database["public"]["Enums"]["opportunity_status"];
          title?: string;
          type?: Database["public"]["Enums"]["opportunity_type"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "opportunities_organizer_id_fkey";
            columns: ["organizer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "opportunities_organizer_id_fkey";
            columns: ["organizer_id"];
            isOneToOne: false;
            referencedRelation: "public_organizers";
            referencedColumns: ["profile_id"];
          },
        ];
      };
      opportunity_tags: {
        Row: {
          opportunity_id: string;
          tag_id: number;
        };
        Insert: {
          opportunity_id: string;
          tag_id: number;
        };
        Update: {
          opportunity_id?: string;
          tag_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "opportunity_tags_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: false;
            referencedRelation: "opportunities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "opportunity_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          },
        ];
      };
      organizer_details: {
        Row: {
          org_name: string;
          org_type: Database["public"]["Enums"]["org_type"];
          profile_id: string;
          verification_status: Database["public"]["Enums"]["verification_status"];
          verified_at: string | null;
          website: string | null;
        };
        Insert: {
          org_name: string;
          org_type: Database["public"]["Enums"]["org_type"];
          profile_id: string;
          verification_status?: Database["public"]["Enums"]["verification_status"];
          verified_at?: string | null;
          website?: string | null;
        };
        Update: {
          org_name?: string;
          org_type?: Database["public"]["Enums"]["org_type"];
          profile_id?: string;
          verification_status?: Database["public"]["Enums"]["verification_status"];
          verified_at?: string | null;
          website?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "organizer_details_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "organizer_details_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "public_organizers";
            referencedColumns: ["profile_id"];
          },
        ];
      };
      profile_interests: {
        Row: {
          profile_id: string;
          tag_id: number;
        };
        Insert: {
          profile_id: string;
          tag_id: number;
        };
        Update: {
          profile_id?: string;
          tag_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "profile_interests_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profile_interests_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "public_organizers";
            referencedColumns: ["profile_id"];
          },
          {
            foreignKeyName: "profile_interests_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"];
          avatar_url: string | null;
          created_at: string;
          display_name: string;
          id: string;
          terms_accepted_at: string;
          username: string;
        };
        Insert: {
          account_type: Database["public"]["Enums"]["account_type"];
          avatar_url?: string | null;
          created_at?: string;
          display_name: string;
          id: string;
          terms_accepted_at: string;
          username: string;
        };
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"];
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string;
          id?: string;
          terms_accepted_at?: string;
          username?: string;
        };
        Relationships: [];
      };
      saved_opportunities: {
        Row: {
          created_at: string;
          opportunity_id: string;
          profile_id: string;
        };
        Insert: {
          created_at?: string;
          opportunity_id: string;
          profile_id: string;
        };
        Update: {
          created_at?: string;
          opportunity_id?: string;
          profile_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "saved_opportunities_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: false;
            referencedRelation: "opportunities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "saved_opportunities_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "saved_opportunities_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "public_organizers";
            referencedColumns: ["profile_id"];
          },
        ];
      };
      student_details: {
        Row: {
          bio: string | null;
          birth_date: string;
          city: string | null;
          consent_granted_at: string | null;
          consent_token_hash: string | null;
          gender: Database["public"]["Enums"]["gender"] | null;
          grade: number | null;
          guardian_email: string | null;
          is_public: boolean;
          profile_id: string;
          school: string | null;
        };
        Insert: {
          bio?: string | null;
          birth_date: string;
          city?: string | null;
          consent_granted_at?: string | null;
          consent_token_hash?: string | null;
          gender?: Database["public"]["Enums"]["gender"] | null;
          grade?: number | null;
          guardian_email?: string | null;
          is_public?: boolean;
          profile_id: string;
          school?: string | null;
        };
        Update: {
          bio?: string | null;
          birth_date?: string;
          city?: string | null;
          consent_granted_at?: string | null;
          consent_token_hash?: string | null;
          gender?: Database["public"]["Enums"]["gender"] | null;
          grade?: number | null;
          guardian_email?: string | null;
          is_public?: boolean;
          profile_id?: string;
          school?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "student_details_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "student_details_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "public_organizers";
            referencedColumns: ["profile_id"];
          },
        ];
      };
      tags: {
        Row: {
          id: number;
          is_parent: boolean;
          kind: Database["public"]["Enums"]["tag_kind"];
          name: string;
          slug: string;
        };
        Insert: {
          id?: never;
          is_parent?: boolean;
          kind?: Database["public"]["Enums"]["tag_kind"];
          name: string;
          slug: string;
        };
        Update: {
          id?: never;
          is_parent?: boolean;
          kind?: Database["public"]["Enums"]["tag_kind"];
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      public_badges: {
        Row: {
          awarded_at: string | null;
          event_date: string | null;
          event_title: string | null;
          id: string | null;
          opportunity_id: string | null;
          org_name: string | null;
          place: number | null;
          username: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "badges_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: false;
            referencedRelation: "opportunities";
            referencedColumns: ["id"];
          },
        ];
      };
      public_organizers: {
        Row: {
          avatar_url: string | null;
          display_name: string | null;
          org_name: string | null;
          org_type: Database["public"]["Enums"]["org_type"] | null;
          profile_id: string | null;
          username: string | null;
          verification_status: Database["public"]["Enums"]["verification_status"] | null;
          website: string | null;
        };
        Relationships: [];
      };
      public_profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          display_name: string | null;
          interests: string[] | null;
          school: string | null;
          username: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      check_rate_limit: {
        Args: { p_key: string; p_limit: number; p_window_seconds: number };
        Returns: boolean;
      };
      my_opportunity_stats: {
        Args: never;
        Returns: {
          opportunity_id: string;
          saves: number;
          status: Database["public"]["Enums"]["opportunity_status"];
          title: string;
        }[];
      };
      recommended_feed: {
        Args: { p_limit?: number; p_min_rating?: number };
        Returns: {
          history: number;
          interest: number;
          location: number;
          opportunity_id: string;
          rating: number;
          urgency: number;
        }[];
      };
    };
    Enums: {
      account_type: "student" | "organizer";
      audience: "school" | "university" | "both";
      gender: "male" | "female" | "other" | "prefer_not_to_say";
      opportunity_source: "organizer" | "scraper";
      opportunity_status: "draft" | "published" | "archived";
      opportunity_type:
        "competition" | "scholarship" | "internship" | "open_day" | "university_program";
      org_type: "school" | "university" | "ngo" | "company" | "public_body";
      tag_kind: "topic" | "format" | "level" | "cost" | "grade";
      verification_status: "pending" | "verified" | "rejected";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      account_type: ["student", "organizer"],
      audience: ["school", "university", "both"],
      gender: ["male", "female", "other", "prefer_not_to_say"],
      opportunity_source: ["organizer", "scraper"],
      opportunity_status: ["draft", "published", "archived"],
      opportunity_type: [
        "competition",
        "scholarship",
        "internship",
        "open_day",
        "university_program",
      ],
      org_type: ["school", "university", "ngo", "company", "public_body"],
      tag_kind: ["topic", "format", "level", "cost", "grade"],
      verification_status: ["pending", "verified", "rejected"],
    },
  },
} as const;
