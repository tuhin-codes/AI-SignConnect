/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase.ts';
import type {
  Profile,
  ProfileUpdate,
  Conversation,
  ConversationInsert,
  ConversationUpdate,
  Message,
  MessageInsert,
  UserPreferences,
  UserPreferencesUpdate,
} from '../types/database.ts';

export interface DbResult<T> {
  data: T | null;
  error: Error | null;
}

/**
 * Foundation Database Service for SignConnect.
 * Encapsulates PostgreSQL queries via Supabase with RLS compliance and type safety.
 */
export const dbService = {
  // --------------------------------------------------
  // Profiles
  // --------------------------------------------------

  async getProfile(userId: string): Promise<DbResult<Profile>> {
    if (!isSupabaseConfigured()) {
      return { data: null, error: new Error('Supabase is not configured.') };
    }

    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as Profile | null, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error(String(err)),
      };
    }
  },

  async updateProfile(userId: string, updates: ProfileUpdate): Promise<DbResult<Profile>> {
    if (!isSupabaseConfigured()) {
      return { data: null, error: new Error('Supabase is not configured.') };
    }

    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as Profile, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error(String(err)),
      };
    }
  },

  // --------------------------------------------------
  // Conversations
  // --------------------------------------------------

  async getConversations(userId: string): Promise<DbResult<Conversation[]>> {
    if (!isSupabaseConfigured()) {
      return { data: null, error: new Error('Supabase is not configured.') };
    }

    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return { data: (data || []) as Conversation[], error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error(String(err)),
      };
    }
  },

  async getConversation(conversationId: string): Promise<DbResult<Conversation>> {
    if (!isSupabaseConfigured()) {
      return { data: null, error: new Error('Supabase is not configured.') };
    }

    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .maybeSingle();

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as Conversation | null, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error(String(err)),
      };
    }
  },

  async createConversation(conversation: ConversationInsert): Promise<DbResult<Conversation>> {
    if (!isSupabaseConfigured()) {
      return { data: null, error: new Error('Supabase is not configured.') };
    }

    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('conversations')
        .insert(conversation)
        .select()
        .single();

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as Conversation, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error(String(err)),
      };
    }
  },

  async updateConversation(
    conversationId: string,
    updates: ConversationUpdate
  ): Promise<DbResult<Conversation>> {
    if (!isSupabaseConfigured()) {
      return { data: null, error: new Error('Supabase is not configured.') };
    }

    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('conversations')
        .update(updates)
        .eq('id', conversationId)
        .select()
        .single();

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as Conversation, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error(String(err)),
      };
    }
  },

  async deleteConversation(conversationId: string): Promise<DbResult<void>> {
    if (!isSupabaseConfigured()) {
      return { data: null, error: new Error('Supabase is not configured.') };
    }

    try {
      const client = getSupabaseClient();
      const { error } = await client
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return { data: null, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error(String(err)),
      };
    }
  },

  // --------------------------------------------------
  // Messages
  // --------------------------------------------------

  async getMessages(conversationId: string): Promise<DbResult<Message[]>> {
    if (!isSupabaseConfigured()) {
      return { data: null, error: new Error('Supabase is not configured.') };
    }

    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return { data: (data || []) as Message[], error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error(String(err)),
      };
    }
  },

  async createMessage(message: MessageInsert): Promise<DbResult<Message>> {
    if (!isSupabaseConfigured()) {
      return { data: null, error: new Error('Supabase is not configured.') };
    }

    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('messages')
        .insert(message)
        .select()
        .single();

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as Message, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error(String(err)),
      };
    }
  },

  // --------------------------------------------------
  // User Preferences
  // --------------------------------------------------

  async getUserPreferences(userId: string): Promise<DbResult<UserPreferences>> {
    if (!isSupabaseConfigured()) {
      return { data: null, error: new Error('Supabase is not configured.') };
    }

    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as UserPreferences | null, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error(String(err)),
      };
    }
  },

  async updateUserPreferences(
    userId: string,
    updates: UserPreferencesUpdate
  ): Promise<DbResult<UserPreferences>> {
    if (!isSupabaseConfigured()) {
      return { data: null, error: new Error('Supabase is not configured.') };
    }

    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('user_preferences')
        .upsert({ user_id: userId, ...updates })
        .select()
        .single();

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as UserPreferences, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error(String(err)),
      };
    }
  },
};
