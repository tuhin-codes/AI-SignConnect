/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, type FormEvent } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.tsx';

interface LoginFormProps {
  onSwitchToSignup: () => void;
}

export function LoginForm({ onSwitchToSignup }: LoginFormProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signIn({
        email: trimmedEmail,
        password,
      });

      if (!result.success && result.error) {
        setErrorMessage(result.error);
      }
    } catch {
      setErrorMessage('Failed to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form id="signconnect-login-form" onSubmit={handleSubmit} className="space-y-4 text-left">
      {errorMessage && (
        <div
          id="login-error-banner"
          role="alert"
          className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
          <p id="login-error-text" className="flex-1 leading-tight">{errorMessage}</p>
        </div>
      )}

      <div>
        <label
          htmlFor="login-email-input"
          className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
        >
          Email address
        </label>
        <input
          id="login-email-input"
          type="email"
          autoComplete="email"
          required
          disabled={isSubmitting}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </div>

      <div>
        <label
          htmlFor="login-password-input"
          className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
        >
          Password
        </label>
        <input
          id="login-password-input"
          type="password"
          autoComplete="current-password"
          required
          disabled={isSubmitting}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </div>

      <button
        id="login-submit-button"
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-xs"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Signing in...</span>
          </>
        ) : (
          <span>Sign In</span>
        )}
      </button>

      <div className="pt-2 text-center">
        <p className="text-xs text-slate-600">
          Don&apos;t have an account?{' '}
          <button
            id="switch-to-signup-button"
            type="button"
            onClick={onSwitchToSignup}
            disabled={isSubmitting}
            className="text-blue-600 hover:text-blue-700 font-semibold focus:outline-none focus:underline cursor-pointer disabled:opacity-50"
          >
            Create account
          </button>
        </p>
      </div>
    </form>
  );
}
