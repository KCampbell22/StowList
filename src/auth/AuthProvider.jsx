import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

/**
 * Keeps track of who's signed in and exposes signIn / signUp / signOut.
 * Accounts are plain email + password, stored by Supabase Auth (auth.users),
 * so passwords are hashed for us and auth.uid() works in the RLS policies.
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => setSession(newSession));
    return () => data.subscription.unsubscribe();
  }, []);

  /** Signs in with email + password. Throws a friendly Error if it fails. */
  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw new Error(friendlyMessage(error));
  }

  /**
   * Creates an account. With "Confirm email" turned off in Supabase (this is a
   * demo), the new user is signed in straight away.
   * Returns { needsConfirmation: true } if Supabase is still set to confirm emails.
   */
  async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
    if (error) throw new Error(friendlyMessage(error));
    return { needsConfirmation: !data.session };
  }

  const signOut = () => supabase.auth.signOut();

  /**
   * Emails a password-reset link. The link signs the user in and opens
   * /reset-password, where they choose a new password.
   * Supabase doesn't say whether the email has an account, so neither do we.
   */
  async function requestPasswordReset(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw new Error(friendlyMessage(error));
  }

  /** Sets a new password for the signed-in user (used after a reset link). */
  async function updatePassword(password) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(friendlyMessage(error));
  }

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, loading, signIn, signUp, signOut, requestPasswordReset, updatePassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/** Turns Supabase's auth errors into plain-English messages. */
function friendlyMessage(error) {
  const msg = error.message || "";
  if (/invalid login credentials/i.test(msg)) return "That email and password don't match an account.";
  if (/already registered|already exists/i.test(msg)) return "An account with that email already exists. Try signing in instead.";
  if (/password should be at least/i.test(msg)) return "Password must be at least 6 characters.";
  if (/should be different from the old/i.test(msg)) return "Choose a password you haven't used for this account before.";
  if (/rate limit|too many/i.test(msg)) return "Too many attempts. Wait a minute and try again.";
  if (/failed to fetch|network/i.test(msg)) return "Couldn't reach the server. Check your connection and try again.";
  return msg || "Something went wrong. Please try again.";
}
