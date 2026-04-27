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
        }
        Insert: {
          created_at?: string
          generation_id: string
          id?: string
          image_url: string
          materials?: string[] | null
          position?: number
          rationale?: string | null
        }
        Update: {
          created_at?: string
          generation_id?: string
          id?: string
          image_url?: string
          materials?: string[] | null
          position?: number
          rationale?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "design_variations_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "design_generations"
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
        }
        Insert: {
          author_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          kind: string
          lead_id: string
        }
        Update: {
          author_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          lead_id?: string
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
      leads: {
        Row: {
          ai_next_action: string | null
          ai_processed_at: string | null
          ai_red_flags: string[] | null
          ai_reply_draft: string | null
          ai_summary: string | null
          assigned_to: string | null
          brief: string | null
          budget_range: string | null
          created_at: string
          email: string
          fit_score: number | null
          full_name: string
          id: string
          location: string | null
          phone: string | null
          photo_url: string | null
          project_type: string | null
          rooms: string[] | null
          source: string | null
          status: Database["public"]["Enums"]["lead_status"]
          timeline: string | null
          updated_at: string
        }
        Insert: {
          ai_next_action?: string | null
          ai_processed_at?: string | null
          ai_red_flags?: string[] | null
          ai_reply_draft?: string | null
          ai_summary?: string | null
          assigned_to?: string | null
          brief?: string | null
          budget_range?: string | null
          created_at?: string
          email: string
          fit_score?: number | null
          full_name: string
          id?: string
          location?: string | null
          phone?: string | null
          photo_url?: string | null
          project_type?: string | null
          rooms?: string[] | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          timeline?: string | null
          updated_at?: string
        }
        Update: {
          ai_next_action?: string | null
          ai_processed_at?: string | null
          ai_red_flags?: string[] | null
          ai_reply_draft?: string | null
          ai_summary?: string | null
          assigned_to?: string | null
          brief?: string | null
          budget_range?: string | null
          created_at?: string
          email?: string
          fit_score?: number | null
          full_name?: string
          id?: string
          location?: string | null
          phone?: string | null
          photo_url?: string | null
          project_type?: string | null
          rooms?: string[] | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          timeline?: string | null
          updated_at?: string
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
          description: string | null
          id: string
          lead_id: string | null
          name: string
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          client_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          lead_id?: string | null
          name: string
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          client_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          lead_id?: string | null
          name?: string
          status?: Database["public"]["Enums"]["project_status"]
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
          id: string
          name: string
          notes: string | null
          project_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          project_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          project_id?: string
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
      studio_settings: {
        Row: {
          created_at: string
          id: string
          ideal_client: string | null
          intake_intro: string | null
          signature_styles: string[] | null
          studio_name: string
          target_budget_max: number | null
          target_budget_min: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          ideal_client?: string | null
          intake_intro?: string | null
          signature_styles?: string[] | null
          studio_name?: string
          target_budget_max?: number | null
          target_budget_min?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          ideal_client?: string | null
          intake_intro?: string | null
          signature_styles?: string[] | null
          studio_name?: string
          target_budget_max?: number | null
          target_budget_min?: number | null
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_studio_member: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "owner" | "designer"
      lead_status: "new" | "qualified" | "proposal" | "won" | "lost"
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
      lead_status: ["new", "qualified", "proposal", "won", "lost"],
      project_status: ["concept", "development", "final", "delivered"],
    },
  },
} as const
