/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { User, Session, AuthError, Subscription } from '@supabase/supabase-js';

export type SupabaseConnectionStatus = 'CONNECTED' | 'NOT_CONFIGURED' | 'CONNECTION_ERROR';

export interface SupabaseHealthCheckResult {
  status: SupabaseConnectionStatus;
  message: string;
  details?: string;
  latencyMs?: number;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  options?: {
    data?: Record<string, unknown>;
    emailRedirectTo?: string;
  };
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface AuthStateResult {
  user: User | null;
  session: Session | null;
}

export interface AuthOperationResult<T = unknown> {
  data: T | null;
  error: AuthError | Error | null;
}

export type AuthStateChangeCallback = (
  event: string,
  session: Session | null
) => void;

export type UnsubscribeAuthListener = () => void;
