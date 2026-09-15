/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { authService } from '../services/authService.ts';
import type {
  AuthContextType,
  SignUpParams,
  SignInParams,
  AuthActionResult,
} from '../types/auth.ts';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function formatAuthError(error: Error | { message: string }): string {
  const msg = error.message.toLowerCase();

  if (msg.includes('invalid login credentials')) {
    return 'Invalid email or password. Please verify your credentials.';
  }
  if (msg.includes('user already registered')) {
    return 'An account with this email already exists. Please sign in instead.';
  }
  if (msg.includes('password should be at least')) {
    return 'Password must be at least 6 characters long.';
  }
  if (msg.includes('email rate limit') || msg.includes('too many requests')) {
    return 'Too many attempts. Please wait a moment before trying again.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Please confirm your email address before signing in.';
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return 'Network connection error. Please check your internet connection.';
  }

  return error.message || 'An unexpected authentication error occurred.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    // 1. Initial session restoration on application startup
    async function initializeSession() {
      try {
        const { data: initialSession, error } = await authService.getSession();
        if (isMounted) {
          if (!error && initialSession) {
            setSession(initialSession);
            setUser(initialSession.user);
          } else {
            setSession(null);
            setUser(null);
          }
          setIsLoading(false);
        }
      } catch {
        if (isMounted) {
          setSession(null);
          setUser(null);
          setIsLoading(false);
        }
      }
    }

    initializeSession();

    // 2. Subscribe to live auth state changes (login, logout, token refresh)
    const unsubscribe = authService.onAuthStateChange((_event, currentSession) => {
      if (isMounted) {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const signUp = async ({
    fullName,
    email,
    password,
  }: SignUpParams): Promise<AuthActionResult> => {
    // Derive dynamic application origin for email confirmation redirect
    // Works across Google AI Studio Preview, local dev, and future production deployments
    const emailRedirectTo =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : undefined;

    const { data, error } = await authService.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
        ...(emailRedirectTo ? { emailRedirectTo } : {}),
      },
    });

    if (error) {
      return {
        success: false,
        error: formatAuthError(error),
      };
    }

    // Check if Supabase project requires email confirmation before establishing a session
    const requiresEmailConfirmation = !data?.session;

    return {
      success: true,
      error: null,
      requiresEmailConfirmation,
    };
  };

  const signIn = async ({
    email,
    password,
  }: SignInParams): Promise<AuthActionResult> => {
    const { data, error } = await authService.signIn({
      email: email.trim(),
      password,
    });

    if (error) {
      return {
        success: false,
        error: formatAuthError(error),
      };
    }

    if (data?.session) {
      setSession(data.session);
      setUser(data.session.user);
    }

    return {
      success: true,
      error: null,
    };
  };

  const signOut = async (): Promise<{ success: boolean; error: string | null }> => {
    const { error } = await authService.signOut();
    // In all cases, clear local state immediately
    setSession(null);
    setUser(null);

    if (error) {
      return {
        success: false,
        error: formatAuthError(error),
      };
    }

    return {
      success: true,
      error: null,
    };
  };

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
