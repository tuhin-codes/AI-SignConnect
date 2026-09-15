/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { User, Session } from '@supabase/supabase-js';

export interface SignUpParams {
  fullName: string;
  email: string;
  password: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

export interface AuthActionResult {
  success: boolean;
  error: string | null;
  requiresEmailConfirmation?: boolean;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (params: SignUpParams) => Promise<AuthActionResult>;
  signIn: (params: SignInParams) => Promise<AuthActionResult>;
  signOut: () => Promise<{ success: boolean; error: string | null }>;
}
