import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import ErrorMessage from "../components/ErrorMessage";

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Asks for an email and sends a password-reset link to it. */
export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!EMAIL_FORMAT.test(email.trim())) return setError("Enter a valid email address.");

    setSubmitting(true);
    setError(null);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (e) {
      setError(e);
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <main className="login container">
        <h1>Check your email</h1>
        <p className="lead">
          If an account exists for <strong>{email.trim()}</strong>, we've sent it a link to reset the password.
          The link works once and expires after an hour.
        </p>
        <Link to="/login" className="btn btn-primary">Back to sign in</Link>
      </main>
    );
  }

  return (
    <main className="login container">
      <h1>StowList</h1>
      <h2>Reset your password</h2>
      <p className="muted">Enter the email you signed up with and we'll send you a reset link.</p>

      <form className="card auth-form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="forgot-email">Email</label>
          <input
            id="forgot-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <ErrorMessage error={error} />

        <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={submitting}>
          {submitting ? "Please wait…" : "Send reset link"}
        </button>
      </form>

      <p className="muted">
        Remembered it? <Link to="/login">Sign in</Link>
      </p>
    </main>
  );
}
