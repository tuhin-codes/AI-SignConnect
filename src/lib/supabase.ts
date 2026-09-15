/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { SupabaseHealthCheckResult } from '../types/supabase.ts';
import type { Database } from '../types/database.ts';

// Extract client-side environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;

let supabaseInstance: SupabaseClient<Database> | null = null;
let configurationError: string | null = null;

// Validate configuration
if (!supabaseUrl || !supabaseKey) {
  configurationError =
    'Supabase configuration missing: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must be defined in environment variables.';
} else {
  try {
    // Validate URL format
    new URL(supabaseUrl);
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (err) {
    configurationError = `Invalid Supabase configuration: ${err instanceof Error ? err.message : String(err)}`;
  }
}

/**
 * Returns whether Supabase is properly configured with required environment variables.
 */
export function isSupabaseConfigured(): boolean {
  return supabaseInstance !== null && configurationError === null;
}

/**
 * Returns the active Supabase client instance.
 * Throws a descriptive error if accessed when not configured.
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (!supabaseInstance) {
    throw new Error(
      configurationError ||
        'Supabase client is not initialized. Verify VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.'
    );
  }
  return supabaseInstance;
}

/**
 * Performs a safe connectivity check against the configured Supabase instance.
 * Returns CONNECTED, NOT_CONFIGURED, or CONNECTION_ERROR.
 */
export async function checkSupabaseHealth(): Promise<SupabaseHealthCheckResult> {
  if (!isSupabaseConfigured() || !supabaseInstance) {
    return {
      status: 'NOT_CONFIGURED',
      message:
        configurationError ||
        'Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY) are not set.',
    };
  }

  const startTime = performance.now();
  try {
    // Perform a lightweight, safe auth session check to test network connectivity and API key validity
    const { error } = await supabaseInstance.auth.getSession();
    const latencyMs = Math.round(performance.now() - startTime);

    if (error) {
      return {
        status: 'CONNECTION_ERROR',
        message: `Supabase authentication check failed: ${error.message}`,
        details: error.message,
        latencyMs,
      };
    }

    return {
      status: 'CONNECTED',
      message: 'Successfully connected to Supabase.',
      latencyMs,
    };
  } catch (err) {
    const latencyMs = Math.round(performance.now() - startTime);
    return {
      status: 'CONNECTION_ERROR',
      message: `Failed to connect to Supabase: ${err instanceof Error ? err.message : String(err)}`,
      details: err instanceof Error ? err.message : String(err),
      latencyMs,
    };
  }
}

// Export singleton instance (null when unconfigured to prevent hard runtime crashes)
export const supabase = supabaseInstance;
