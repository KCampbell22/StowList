import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { MIN_PASSWORD } from "../components/AuthForm";
import ErrorMessage from "../components/ErrorMessage";
import Spinner from "../components/Spinner";

/**
 * Where the reset email's link lands. Supabase reads the token from the URL and
 * signs the user in, then they choose a new password here.
 */
export default function ResetPasswordPage() {
  const { user, loading, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (loading) return <Spinner label="Checking reset link" />;

  // Opened without a valid link (expired, already used, or typed in by hand)
  if (!user) {
    return (
      <main className="login container">
        <h1>Link expired</h1>
        <p className="lead">This reset link is no longer valid. Request a new one and use it within an hour.</p>
        <Link to="/forgot-password" className="btn btn-primary">Send a new link</Link>
      </main>
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (password.length < MIN_PASSWORD) return setError(`Password must be at least ${MIN_PASSWORD} characters.`);
    if (password !== confirm) return setError("The passwords don't match.");

    setSubmitting(true);
    setError(null);
    try {
      await updatePassword(password);
      navigate("/", { replace: true });
    } catch (e) {
      setError(e);
      setSubmitting(false);
    }
  }

  const passwordType = showPassword ? "text" : "password";

  return (
    <main className="login container">
      <h1>StowList</h1>
      <h2>Choose a new password</h2>
      <p className="muted">For {user.email}</p>

      <form className="card auth-form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="reset-password">New password</label>
          <input
            id="reset-password"
            type={passwordType}
            autoComplete="new-password"
            aria-describedby="reset-password-hint"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <span id="reset-password-hint" className="hint">At least {MIN_PASSWORD} characters.</span>
        </div>

        <div className="field">
          <label htmlFor="reset-confirm">Confirm new password</label>
          <input
            id="reset-confirm"
            type={passwordType}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>

        <label className="checkbox">
          <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
          Show password
        </label>

        <ErrorMessage error={error} />

        <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={submitting}>
          {submitting ? "Please wait…" : "Save new password"}
        </button>
      </form>
    </main>
  );
}
