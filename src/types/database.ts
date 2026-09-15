/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          preferred_language: string | null;
          role: string | null;
          avatar_preferences: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          preferred_language?: string | null;
          role?: string | null;
          avatar_preferences?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          preferred_language?: string | null;
          role?: string | null;
          avatar_preferences?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          language: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          language?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string | null;
          language?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'conversations_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender: string;
          input_type: string | null;
          input_text: string | null;
          output_text: string | null;
          confidence: number | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender: string;
          input_type?: string | null;
          input_text?: string | null;
          output_text?: string | null;
          confidence?: number | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender?: string;
          input_type?: string | null;
          input_text?: string | null;
          output_text?: string | null;
          confidence?: number | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'messages_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
        ];
      };
      user_preferences: {
        Row: {
          user_id: string;
          interface_language: string | null;
          speech_enabled: boolean;
          captions_enabled: boolean;
          avatar_enabled: boolean;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          interface_language?: string | null;
          speech_enabled?: boolean;
          captions_enabled?: boolean;
          avatar_enabled?: boolean;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          interface_language?: string | null;
          speech_enabled?: boolean;
          captions_enabled?: boolean;
          avatar_enabled?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_preferences_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
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
};

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

export type Profile = Tables<'profiles'>;
export type ProfileInsert = TablesInsert<'profiles'>;
export type ProfileUpdate = TablesUpdate<'profiles'>;

export type Conversation = Tables<'conversations'>;
export type ConversationInsert = TablesInsert<'conversations'>;
export type ConversationUpdate = TablesUpdate<'conversations'>;

export type Message = Tables<'messages'>;
export type MessageInsert = TablesInsert<'messages'>;
export type MessageUpdate = TablesUpdate<'messages'>;

export type UserPreferences = Tables<'user_preferences'>;
export type UserPreferencesInsert = TablesInsert<'user_preferences'>;
export type UserPreferencesUpdate = TablesUpdate<'user_preferences'>;
