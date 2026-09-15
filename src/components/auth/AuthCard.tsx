/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { LoginForm } from './LoginForm.tsx';
import { SignupForm } from './SignupForm.tsx';

export function AuthCard() {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  return (
    <div id="signconnect-auth-card" className="w-full">
      {/* Tab Switcher */}
      <div
        id="auth-mode-tabs"
        role="tablist"
        aria-label="Authentication Options"
        className="flex rounded-lg bg-slate-100 p-1 mb-6"
      >
        <button
          id="tab-login"
          type="button"
          role="tab"
          aria-selected={authMode === 'login'}
          onClick={() => setAuthMode('login')}
          className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer ${
            authMode === 'login'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Sign In
        </button>
        <button
          id="tab-signup"
          type="button"
          role="tab"
          aria-selected={authMode === 'signup'}
          onClick={() => setAuthMode('signup')}
          className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer ${
            authMode === 'signup'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Create Account
        </button>
      </div>

      {/* Form Views */}
      {authMode === 'login' ? (
        <LoginForm onSwitchToSignup={() => setAuthMode('signup')} />
      ) : (
        <SignupForm onSwitchToLogin={() => setAuthMode('login')} />
      )}
    </div>
  );
}
