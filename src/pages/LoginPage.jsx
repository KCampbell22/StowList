import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import AuthForm from "../components/AuthForm";

/** Sign in with email + password. */
export default function LoginPage() {
  const { user, signIn } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  // Where they were headed before being sent here (e.g. a scanned label)
  const from = location.state?.from || "/";

  if (user) return <Navigate to={from} replace />;

  return (
    <main className="login container">
      <h1>StowList</h1>
      <p className="lead">Label your boxes with QR codes. Scan one to see, and change, what's inside.</p>

      <h2>Sign in</h2>
      <AuthForm
        mode="signin"
        submitLabel="Sign in"
        onSubmit={async (email, password) => {
          await signIn(email, password);
          navigate(from, { replace: true });
        }}
      />

      <p className="muted">
        <Link to="/forgot-password">Forgot password?</Link>
      </p>

      <p className="muted">
        New here? <Link to="/signup" state={{ from }}>Create an account</Link>
      </p>
    </main>
  );
}
