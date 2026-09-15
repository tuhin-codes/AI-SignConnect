/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, type FormEvent } from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.tsx';

interface SignupFormProps {
  onSwitchToLogin: () => void;
}

export function SignupForm({ onSwitchToLogin }: SignupFormProps) {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    const trimmedFullName = fullName.trim();
    if (!trimmedFullName) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signUp({
        fullName: trimmedFullName,
        email: trimmedEmail,
        password,
      });

      if (!result.success) {
        setErrorMessage(result.error || 'Failed to create account.');
      } else if (result.requiresEmailConfirmation) {
        setInfoMessage(
          'Account created successfully! Please check your email inbox to confirm your address before signing in.'
        );
      }
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form id="signconnect-signup-form" onSubmit={handleSubmit} className="space-y-4 text-left">
      {errorMessage && (
        <div
          id="signup-error-banner"
          role="alert"
          className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
          <p id="signup-error-text" className="flex-1 leading-tight">{errorMessage}</p>
        </div>
      )}

      {infoMessage && (
        <div
          id="signup-info-banner"
          role="status"
          className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm"
        >
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
          <p id="signup-info-text" className="flex-1 leading-tight">{infoMessage}</p>
        </div>
      )}

      <div>
        <label
          htmlFor="signup-name-input"
          className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
        >
          Full name
        </label>
        <input
          id="signup-name-input"
          type="text"
          autoComplete="name"
          required
          disabled={isSubmitting || !!infoMessage}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="e.g. Alex Sharma"
          className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </div>

      <div>
        <label
          htmlFor="signup-email-input"
          className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
        >
          Email address
        </label>
        <input
          id="signup-email-input"
          type="email"
          autoComplete="email"
          required
          disabled={isSubmitting || !!infoMessage}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </div>

      <div>
        <label
          htmlFor="signup-password-input"
          className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
        >
          Password (min 6 characters)
        </label>
        <input
          id="signup-password-input"
          type="password"
          autoComplete="new-password"
          required
          disabled={isSubmitting || !!infoMessage}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </div>

      <div>
        <label
          htmlFor="signup-confirm-password-input"
          className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
        >
          Confirm password
        </label>
        <input
          id="signup-confirm-password-input"
          type="password"
          autoComplete="new-password"
          required
          disabled={isSubmitting || !!infoMessage}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </div>

      {!infoMessage && (
        <button
          id="signup-submit-button"
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-xs"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating account...</span>
            </>
          ) : (
            <span>Create Account</span>
          )}
        </button>
      )}

      <div className="pt-2 text-center">
        <p className="text-xs text-slate-600">
          Already have an account?{' '}
          <button
            id="switch-to-login-button"
            type="button"
            onClick={onSwitchToLogin}
            disabled={isSubmitting}
            className="text-blue-600 hover:text-blue-700 font-semibold focus:outline-none focus:underline cursor-pointer disabled:opacity-50"
          >
            Sign in
          </button>
        </p>
      </div>
    </form>
  );
}
