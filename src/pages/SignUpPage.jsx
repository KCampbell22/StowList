import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import AuthForm from "../components/AuthForm";

/** Create an account with email + password. Signs the new user straight in. */
export default function SignUpPage() {
  const { user, signUp } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from || "/";
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  if (user) return <Navigate to={from} replace />;

  // Only shown if "Confirm email" is still switched on in Supabase
  if (needsConfirmation) {
    return (
      <main className="login container">
        <h1>Check your email</h1>
        <p className="lead">We sent you a link to confirm your account. Open it, then sign in.</p>
        <Link to="/login" state={{ from }} className="btn btn-primary">Go to sign in</Link>
      </main>
    );
  }

  return (
    <main className="login container">
      <h1>StowList</h1>
      <p className="lead">Create a free account to start labelling your boxes.</p>

      <h2>Create an account</h2>
      <AuthForm
        mode="signup"
        submitLabel="Create account"
        onSubmit={async (email, password) => {
          const { needsConfirmation } = await signUp(email, password);
          if (needsConfirmation) setNeedsConfirmation(true);
          else navigate(from, { replace: true });
        }}
      />

      <p className="muted">
        Already have an account? <Link to="/login" state={{ from }}>Sign in</Link>
      </p>
    </main>
  );
}
