import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import Spinner from "../components/Spinner";

/** Wraps signed-in-only pages. Signed-out visitors go to /login, then come back here. */
export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner label="Checking sign-in" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return children;
}
