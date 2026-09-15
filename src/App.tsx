/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { Loader2, LogOut, User as UserIcon, ShieldCheck } from 'lucide-react';
import { checkSupabaseHealth } from './lib/supabase.ts';
import type { SupabaseHealthCheckResult } from './types/supabase.ts';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import { AuthCard } from './components/auth/AuthCard.tsx';
import { CameraCapture } from './components/camera/CameraCapture.tsx';
import { dbService } from './services/dbService.ts';
import type { Profile } from './types/database.ts';

function SignConnectContent() {
  const { user, isLoading, signOut } = useAuth();
  const [supabaseHealth, setSupabaseHealth] = useState<SupabaseHealthCheckResult | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    checkSupabaseHealth().then((result) => {
      setSupabaseHealth(result);
    });
  }, []);

  useEffect(() => {
    if (user?.id) {
      dbService.getProfile(user.id).then(({ data }) => {
        if (data) {
          setProfile(data);
        }
      });
    } else {
      setProfile(null);
    }
  }, [user?.id]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
    } finally {
      setIsLoggingOut(false);
    }
  };

  // 1. Initial Session Loading State (prevents flash of content)
  if (isLoading) {
    return (
      <div id="signconnect-loading" className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-800">
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <p className="text-sm font-medium">Checking session...</p>
        </div>
      </div>
    );
  }

  // 2. Authenticated State
  if (user) {
    const displayName =
      profile?.full_name ||
      (user.user_metadata?.full_name as string) ||
      user.email?.split('@')[0] ||
      'User';

    return (
      <div id="signconnect-root" className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 text-slate-800">
        <div className="max-w-xl w-full space-y-4">
          <div id="signconnect-authenticated-card" className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 text-center">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div>
                  <h1 id="app-title" className="text-base font-semibold text-slate-900 leading-tight">
                    SignConnect
                  </h1>
                  <p id="user-greeting" className="text-xs text-slate-600">
                    Hello, <span className="font-semibold text-slate-800">{displayName}</span>
                  </p>
                </div>
              </div>

              <button
                id="logout-button"
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="py-2 px-3.5 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-medium text-xs flex items-center gap-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shrink-0"
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Signing out...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </>
                )}
              </button>
            </div>

            <div id="user-details-card" className="mt-3.5 p-2.5 bg-slate-50 rounded-lg border border-slate-200/70 text-left flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Email:</span>
                <span id="authenticated-user-email" className="text-slate-800 font-medium font-mono">{user.email}</span>
              </div>
              <div className="flex items-center gap-3">
                {profile?.role && (
                  <span className="text-slate-600 capitalize">Role: {profile.role}</span>
                )}
                <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" /> Supabase Verified
                </span>
              </div>
            </div>
          </div>

          <CameraCapture />

          {supabaseHealth && (
            <div id="supabase-status-badge" className="flex items-center justify-center gap-2 pt-1">
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  supabaseHealth.status === 'CONNECTED'
                    ? 'bg-emerald-500'
                    : supabaseHealth.status === 'NOT_CONFIGURED'
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
              />
              <span className="text-xs font-medium text-slate-600">
                Supabase: {supabaseHealth.status.replace('_', ' ')}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. Unauthenticated State (Login / Sign Up)
  return (
    <div id="signconnect-root" className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-800">
      <div id="signconnect-auth-container" className="max-w-md w-full bg-white rounded-xl shadow-xs border border-slate-200 p-6 text-center">
        <div className="mb-5">
          <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center mx-auto mb-2 font-bold text-lg">
            🤟
          </div>
          <h1 id="app-title" className="text-xl font-semibold text-slate-900">SignConnect</h1>
          <p id="app-tagline" className="text-xs text-slate-500 mt-1">
            Bridging Indian Sign Language and Spoken Language
          </p>
        </div>

        <AuthCard />

        {supabaseHealth && (
          <div id="supabase-status-badge" className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center gap-2">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                supabaseHealth.status === 'CONNECTED'
                  ? 'bg-emerald-500'
                  : supabaseHealth.status === 'NOT_CONFIGURED'
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
            />
            <span className="text-xs font-medium text-slate-600">
              Supabase: {supabaseHealth.status.replace('_', ' ')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SignConnectContent />
    </AuthProvider>
  );
}
