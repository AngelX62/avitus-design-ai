export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agent_runs: {
        Row: {
          agent_name: string
          completion_tokens: number
          confidence: number | null
          corrected_at: string | null
          corrected_by: string | null
          cost_usd: number
          created_at: string
          created_by: string | null
          human_correction_jsonb: Json | null
          input_hash: string | null
          latency_ms: number
          lead_id: string | null
          model: string | null
          prompt_pack_version: string
          prompt_tokens: number
          raw_text: string | null
          run_id: string
          schema_version: string
          service_name: string
          status: string
          structured_output_jsonb: Json
          studio_id: string
          tier: number
        }
        Insert: {
          agent_name: string
          completion_tokens?: number
          confidence?: number | null
          corrected_at?: string | null
          corrected_by?: string | null
          cost_usd?: number
          created_at?: string
          created_by?: string | null
          human_correction_jsonb?: Json | null
          input_hash?: string | null
          latency_ms?: number
          lead_id?: string | null
          model?: string | null
          prompt_pack_version?: string
          prompt_tokens?: number
          raw_text?: string | null
          run_id?: string
          schema_version?: string
          service_name: string
          status?: string
          structured_output_jsonb?: Json
          studio_id: string
          tier?: number
        }
        Update: {
          agent_name?: string
          completion_tokens?: number
          confidence?: number | null
          corrected_at?: string | null
          corrected_by?: string | null
          cost_usd?: number
          created_at?: string
          created_by?: string | null
          human_correction_jsonb?: Json | null
          input_hash?: string | null
          latency_ms?: number
          lead_id?: string | null
          model?: string | null
          prompt_pack_version?: string
          prompt_tokens?: number
          raw_text?: string | null
          run_id?: string
          schema_version?: string
          service_name?: string
          status?: string
          structured_output_jsonb?: Json
          studio_id?: string
          tier?: number
        }
        Relationships: [
          {
            foreignKeyName: "agent_runs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_runs_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      design_generations: {
        Row: {
          brief: string | null
          budget_tier: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          error_message: string | null
          floor_plan_url: string | null
          id: string
          palette: string[] | null
          project_id: string | null
          room_id: string | null
          room_photo_url: string | null
          status: string
          studio_id: string
          style: string | null
          variation_count: number
        }
        Insert: {
          brief?: string | null
          budget_tier?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          floor_plan_url?: string | null
          id?: string
          palette?: string[] | null
          project_id?: string | null
          room_id?: string | null
          room_photo_url?: string | null
          status?: string
          studio_id?: string
          style?: string | null
          variation_count?: number
        }
        Update: {
          brief?: string | null
          budget_tier?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          floor_plan_url?: string | null
          id?: string
          palette?: string[] | null
          project_id?: string | null
          room_id?: string | null
          room_photo_url?: string | null
          status?: string
          studio_id?: string
          style?: string | null
          variation_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "design_generations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_generations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      design_variations: {
        Row: {
          created_at: string
          generation_id: string
          id: string
          image_url: string
          materials: string[] | null
          position: number
          rationale: string | null
          studio_id: string
        }
        Insert: {
          created_at?: string
          generation_id: string
          id?: string
          image_url: string
          materials?: string[] | null
          position?: number
          rationale?: string | null
          studio_id?: string
        }
        Update: {
          created_at?: string
          generation_id?: string
          id?: string
          image_url?: string
          materials?: string[] | null
          position?: number
          rationale?: string | null
          studio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_variations_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "design_generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_variations_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_activities: {
        Row: {
          author_id: string | null
          body: string | null
          created_at: string
          id: string
          kind: string
          lead_id: string
          studio_id: string
        }
        Insert: {
          author_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          kind: string
          lead_id: string
          studio_id?: string
        }
        Update: {
          author_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          lead_id?: string
          studio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_status_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          from_status: string | null
          id: string
          lead_id: string
          studio_id: string
          to_status: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          from_status?: string | null
          id?: string
          lead_id: string
          studio_id?: string
          to_status: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          from_status?: string | null
          id?: string
          lead_id?: string
          studio_id?: string
          to_status?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          ai_next_action: string | null
          ai_analysis_error: string | null
          ai_analysis_status: string
          ai_model: string | null
          ai_processed_at: string | null
          ai_red_flags: string[] | null
          ai_reply_draft: string | null
          ai_summary: string | null
          assigned_to: string | null
          brief: string | null
          budget_range: string | null
          classification: string | null
          created_at: string
          created_by: string | null
          custom_fields: Json | null
          email: string
          fit_score: number | null
          full_name: string
          id: string
          imported_by: string | null
          last_contacted_at: string | null
          last_scored_by: string | null
          location: string | null
          missing_info: string[] | null
          phone: string | null
          photo_url: string | null
          project_type: string | null
          property_type: string | null
          raw_inquiry: string | null
          reminder_at: string | null
          rooms: string[] | null
          score_breakdown: Json | null
          source: string | null
          status: Database["public"]["Enums"]["lead_status"]
          studio_id: string
          style_preference: string | null
          suggested_followup: string | null
          temperature: string | null
          timeline: string | null
          updated_at: string
          urgency: string | null
        }
        Insert: {
          ai_next_action?: string | null
          ai_analysis_error?: string | null
          ai_analysis_status?: string
          ai_model?: string | null
          ai_processed_at?: string | null
          ai_red_flags?: string[] | null
          ai_reply_draft?: string | null
          ai_summary?: string | null
          assigned_to?: string | null
          brief?: string | null
          budget_range?: string | null
          classification?: string | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json | null
          email: string
          fit_score?: number | null
          full_name: string
          id?: string
          imported_by?: string | null
          last_contacted_at?: string | null
          last_scored_by?: string | null
          location?: string | null
          missing_info?: string[] | null
          phone?: string | null
          photo_url?: string | null
          project_type?: string | null
          property_type?: string | null
          raw_inquiry?: string | null
          reminder_at?: string | null
          rooms?: string[] | null
          score_breakdown?: Json | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          studio_id: string
          style_preference?: string | null
          suggested_followup?: string | null
          temperature?: string | null
          timeline?: string | null
          updated_at?: string
          urgency?: string | null
        }
        Update: {
          ai_next_action?: string | null
          ai_analysis_error?: string | null
          ai_analysis_status?: string
          ai_model?: string | null
          ai_processed_at?: string | null
          ai_red_flags?: string[] | null
          ai_reply_draft?: string | null
          ai_summary?: string | null
          assigned_to?: string | null
          brief?: string | null
          budget_range?: string | null
          classification?: string | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json | null
          email?: string
          fit_score?: number | null
          full_name?: string
          id?: string
          imported_by?: string | null
          last_contacted_at?: string | null
          last_scored_by?: string | null
          location?: string | null
          missing_info?: string[] | null
          phone?: string | null
          photo_url?: string | null
          project_type?: string | null
          property_type?: string | null
          raw_inquiry?: string | null
          reminder_at?: string | null
          rooms?: string[] | null
          score_breakdown?: Json | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          studio_id?: string
          style_preference?: string | null
          suggested_followup?: string | null
          temperature?: string | null
          timeline?: string | null
          updated_at?: string
          urgency?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          client_name: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          lead_id: string | null
          name: string
          status: Database["public"]["Enums"]["project_status"]
          studio_id: string
          updated_at: string
        }
        Insert: {
          client_name?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          lead_id?: string | null
          name: string
          status?: Database["public"]["Enums"]["project_status"]
          studio_id: string
          updated_at?: string
        }
        Update: {
          client_name?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          lead_id?: string | null
          name?: string
          status?: Database["public"]["Enums"]["project_status"]
          studio_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          notes: string | null
          project_id: string
          studio_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          notes?: string | null
          project_id: string
          studio_id?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          notes?: string | null
          project_id?: string
          studio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_invites: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          studio_id: string
          token_hash: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          studio_id: string
          token_hash: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          studio_id?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_invites_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_memberships: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          studio_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          studio_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          studio_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_memberships_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_settings: {
        Row: {
          budget_conversation_style: string | null
          business_type: string | null
          created_at: string
          currency: string
          followup_tone: string
          id: string
          ideal_client: string | null
          intake_intro: string | null
          intake_thank_you_message: string | null
          low_fit_signs: string | null
          monthly_cost_ceiling: number | null
          preferred_locations: string[] | null
          preferred_project_types: string[] | null
          prompt_pack_version: string | null
          signature_styles: string[] | null
          studio_id: string
          studio_name: string
          target_budget_max: number | null
          target_budget_min: number | null
          updated_at: string
        }
        Insert: {
          budget_conversation_style?: string | null
          business_type?: string | null
          created_at?: string
          currency?: string
          followup_tone?: string
          id?: string
          ideal_client?: string | null
          intake_intro?: string | null
          intake_thank_you_message?: string | null
          low_fit_signs?: string | null
          monthly_cost_ceiling?: number | null
          preferred_locations?: string[] | null
          preferred_project_types?: string[] | null
          prompt_pack_version?: string | null
          signature_styles?: string[] | null
          studio_id: string
          studio_name?: string
          target_budget_max?: number | null
          target_budget_min?: number | null
          updated_at?: string
        }
        Update: {
          budget_conversation_style?: string | null
          business_type?: string | null
          created_at?: string
          currency?: string
          followup_tone?: string
          id?: string
          ideal_client?: string | null
          intake_intro?: string | null
          intake_thank_you_message?: string | null
          low_fit_signs?: string | null
          monthly_cost_ceiling?: number | null
          preferred_locations?: string[] | null
          preferred_project_types?: string[] | null
          prompt_pack_version?: string | null
          signature_styles?: string[] | null
          studio_id?: string
          studio_name?: string
          target_budget_max?: number | null
          target_budget_min?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      studios: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_public_studio: {
        Args: { _slug: string }
        Returns: {
          business_type: string | null
          currency: string
          intake_intro: string | null
          intake_thank_you_message: string | null
          preferred_locations: string[] | null
          preferred_project_types: string[] | null
          slug: string
          studio_id: string
          studio_name: string
          target_budget_max: number | null
          target_budget_min: number | null
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_studio_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _studio_id: string
          _user_id?: string
        }
        Returns: boolean
      }
      is_studio_member: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "owner" | "designer"
      lead_status:
        | "new"
        | "qualified"
        | "proposal"
        | "won"
        | "lost"
        | "needs_review"
        | "high_fit"
        | "contacted"
        | "consultation_booked"
      project_status: "concept" | "development" | "final" | "delivered"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["owner", "designer"],
      lead_status: [
        "new",
        "qualified",
        "proposal",
        "won",
        "lost",
        "needs_review",
        "high_fit",
        "contacted",
        "consultation_booked",
      ],
      project_status: ["concept", "development", "final", "delivered"],
    },
  },
} as const
