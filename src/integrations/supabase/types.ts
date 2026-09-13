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
      activity: {
        Row: {
          created_at: string
          game_id: string
          id: string
          mode: string
          my_score: number
          summary: string
          their_score: number
          user_id: string
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          mode?: string
          my_score?: number
          summary?: string
          their_score?: number
          user_id: string
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          mode?: string
          my_score?: number
          summary?: string
          their_score?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar: string
          created_at: string
          display_name: string
          haptics_enabled: boolean
          id: string
          invite_code: string
          notifications_enabled: boolean
          partner_id: string | null
          relationship_status: string
          sound_enabled: boolean
          theme: string
          updated_at: string
        }
        Insert: {
          avatar?: string
          created_at?: string
          display_name?: string
          haptics_enabled?: boolean
          id: string
          invite_code: string
          notifications_enabled?: boolean
          partner_id?: string | null
          relationship_status?: string
          sound_enabled?: boolean
          theme?: string
          updated_at?: string
        }
        Update: {
          avatar?: string
          created_at?: string
          display_name?: string
          haptics_enabled?: boolean
          id?: string
          invite_code?: string
          notifications_enabled?: boolean
          partner_id?: string | null
          relationship_status?: string
          sound_enabled?: boolean
          theme?: string
          updated_at?: string
        }
        Relationships: []
      }
      room_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          room_id: string
          sender_avatar: string
          sender_id: string | null
          sender_name: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          room_id: string
          sender_avatar?: string
          sender_id?: string | null
          sender_name?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          room_id?: string
          sender_avatar?: string
          sender_id?: string | null
          sender_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          code: string
          created_at: string
          game_id: string
          guest_id: string | null
          host_id: string
          id: string
          invite_token: string
          state: Json
          status: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          game_id: string
          guest_id?: string | null
          host_id: string
          id?: string
          invite_token?: string
          state?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          game_id?: string
          guest_id?: string | null
          host_id?: string
          id?: string
          invite_token?: string
          state?: Json
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      close_stale_rooms: { Args: { p_game_id: string }; Returns: undefined }
      gen_code: { Args: { len?: number }; Returns: string }
      gen_invite_token: { Args: never; Returns: string }
      join_room: {
        Args: { p_code: string; p_game_id?: string }
        Returns: {
          code: string
          created_at: string
          game_id: string
          guest_id: string | null
          host_id: string
          id: string
          invite_token: string
          state: Json
          status: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "rooms"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      join_room_by_token: {
        Args: { p_game_id?: string; p_token: string }
        Returns: {
          code: string
          created_at: string
          game_id: string
          guest_id: string | null
          host_id: string
          id: string
          invite_token: string
          state: Json
          status: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "rooms"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      link_partner: {
        Args: { p_code: string }
        Returns: {
          avatar: string
          display_name: string
          id: string
        }[]
      }
      lookup_partner: {
        Args: { p_code: string }
        Returns: {
          avatar: string
          display_name: string
          id: string
        }[]
      }
      patch_room_state: {
        Args: { p_patch: Json; p_room_id: string }
        Returns: {
          code: string
          created_at: string
          game_id: string
          guest_id: string | null
          host_id: string
          id: string
          invite_token: string
          state: Json
          status: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "rooms"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      unlink_partner: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
