import { useState } from "react";
import ErrorMessage from "./ErrorMessage";

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD = 6; // Supabase's default minimum

/**
 * Email + password form shared by the sign-in and create-account pages.
 *
 *   <AuthForm mode="signin" submitLabel="Sign in" onSubmit={async (email, password) => {...}} />
 *   <AuthForm mode="signup" submitLabel="Create account" onSubmit={...} />
 *
 * mode="signup" adds a "Confirm password" field and checks the minimum length.
 * onSubmit may throw; the message is shown and what the user typed is kept.
 */
export default function AuthForm({ mode, submitLabel, onSubmit }) {
  const isSignUp = mode === "signup";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!EMAIL_FORMAT.test(email.trim())) return setError("Enter a valid email address.");
    if (!password) return setError("Enter your password.");
    if (isSignUp && password.length < MIN_PASSWORD) return setError(`Password must be at least ${MIN_PASSWORD} characters.`);
    if (isSignUp && password !== confirm) return setError("The passwords don't match.");

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(email, password);
    } catch (e) {
      setError(e);
      setSubmitting(false);
    }
    // On success the page navigates away, so there's nothing to reset
  }

  const passwordType = showPassword ? "text" : "password";

  return (
    <form className="card auth-form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="auth-email">Email</label>
        <input
          id="auth-email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="auth-password">Password</label>
        <input
          id="auth-password"
          type={passwordType}
          autoComplete={isSignUp ? "new-password" : "current-password"}
          aria-describedby={isSignUp ? "auth-password-hint" : undefined}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {isSignUp && <span id="auth-password-hint" className="hint">At least {MIN_PASSWORD} characters.</span>}
      </div>

      {isSignUp && (
        <div className="field">
          <label htmlFor="auth-confirm">Confirm password</label>
          <input
            id="auth-confirm"
            type={passwordType}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>
      )}

      <label className="checkbox">
        <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
        Show password
      </label>

      <ErrorMessage error={error} />

      <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={submitting}>
        {submitting ? "Please wait…" : submitLabel}
      </button>
    </form>
  );
}
