/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { User, Session, AuthResponse } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase.ts';
import type {
  SignUpCredentials,
  SignInCredentials,
  AuthOperationResult,
  AuthStateChangeCallback,
  UnsubscribeAuthListener,
} from '../types/supabase.ts';

/**
 * Foundation authentication service for SignConnect.
 * Wraps Supabase Auth methods with consistent error handling and configuration guards.
 */
export const authService = {
  /**
   * Registers a new user with email and password.
   */
  async signUp(credentials: SignUpCredentials): Promise<AuthOperationResult<AuthResponse['data']>> {
    if (!isSupabaseConfigured()) {
      return {
        data: null,
        error: new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.'),
      };
    }

    try {
      const client = getSupabaseClient();
      const { data, error } = await client.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: credentials.options,
      });

      return { data, error };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error(String(err)),
      };
    }
  },

  /**
   * Signs in an existing user with email and password.
   */
  async signIn(credentials: SignInCredentials): Promise<AuthOperationResult<AuthResponse['data']>> {
    if (!isSupabaseConfigured()) {
      return {
        data: null,
        error: new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.'),
      };
    }

    try {
      const client = getSupabaseClient();
      const { data, error } = await client.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      return { data, error };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error(String(err)),
      };
    }
  },

  /**
   * Signs out the currently authenticated user.
   */
  async signOut(): Promise<AuthOperationResult<void>> {
    if (!isSupabaseConfigured()) {
      return {
        data: null,
        error: new Error('Supabase is not configured.'),
      };
    }

    try {
      const client = getSupabaseClient();
      const { error } = await client.auth.signOut();
      return { data: null, error };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error(String(err)),
      };
    }
  },

  /**
   * Retrieves the currently active user session, if any.
   */
  async getSession(): Promise<AuthOperationResult<Session | null>> {
    if (!isSupabaseConfigured()) {
      return {
        data: null,
        error: null,
      };
    }

    try {
      const client = getSupabaseClient();
      const { data, error } = await client.auth.getSession();
      return { data: data.session, error };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error(String(err)),
      };
    }
  },

  /**
   * Retrieves the currently authenticated user, if any.
   */
  async getUser(): Promise<AuthOperationResult<User | null>> {
    if (!isSupabaseConfigured()) {
      return {
        data: null,
        error: null,
      };
    }

    try {
      const client = getSupabaseClient();
      const { data, error } = await client.auth.getUser();
      return { data: data.user, error };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error(String(err)),
      };
    }
  },

  /**
   * Subscribes to authentication state changes.
   * Returns an unsubscribe function to remove the listener.
   */
  onAuthStateChange(callback: AuthStateChangeCallback): UnsubscribeAuthListener {
    if (!isSupabaseConfigured()) {
      return () => {};
    }

    try {
      const client = getSupabaseClient();
      const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
        callback(event, session);
      });

      return () => {
        subscription.unsubscribe();
      };
    } catch {
      return () => {};
    }
  },
};
