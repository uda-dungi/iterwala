import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { setPixelIdentity } from "@/lib/pixel";

type Result = { error?: string };

type AuthCtx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  configured: boolean;
  signUp: (name: string, email: string, password: string) => Promise<Result>;
  signIn: (email: string, password: string) => Promise<Result>;
  sendMagicLink: (email: string) => Promise<Result>;
  signInWithGoogle: (redirectTo?: string) => Promise<Result>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

const NOT_CONFIGURED =
  "Authentication isn't connected yet. Add your Supabase keys to the .env file (see README).";

/** A signed-in visitor's email is the strongest Meta match signal we have, and it's known
 *  from the very first page load — so hand it to the pixel layer, which hashes it
 *  server-side before any of it reaches Meta. */
function rememberForPixel(user: User | null) {
  const email = user?.email;
  const phone = user?.phone || (user?.user_metadata?.phone as string | undefined);
  // Supabase stores whatever the sign-up form or OAuth provider supplied; both spellings
  // are common, and a full name is split so fn/ln line up with what checkout sends.
  const meta = (user?.user_metadata ?? {}) as Record<string, any>;
  const full = String(meta.full_name || meta.name || "").trim();
  const firstName = String(meta.first_name || meta.given_name || full.split(/\s+/)[0] || "");
  const lastName = String(meta.last_name || meta.family_name || full.split(/\s+/).slice(1).join(" ") || "");
  if (email || phone) setPixelIdentity({ email, phone, firstName, lastName });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    // Load any existing session, then subscribe to future changes.
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      rememberForPixel(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      rememberForPixel(sess?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signUp = async (name: string, email: string, password: string): Promise<Result> => {
    if (!supabase) return { error: NOT_CONFIGURED };
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error: error?.message };
  };

  const signIn = async (email: string, password: string): Promise<Result> => {
    if (!supabase) return { error: NOT_CONFIGURED };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message };
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  /** Passwordless sign-in — handy since orders placed at checkout auto-create an
   *  account without ever setting a password. */
  const sendMagicLink = async (email: string): Promise<Result> => {
    if (!supabase) return { error: NOT_CONFIGURED };
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    return { error: error?.message };
  };

  /** Redirects to Google's consent screen; Supabase creates/matches the account by
   *  email on return, so this works whether or not the customer has ordered before. */
  const signInWithGoogle = async (redirectTo?: string): Promise<Result> => {
    if (!supabase) return { error: NOT_CONFIGURED };
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo || window.location.origin },
    });
    return { error: error?.message };
  };

  return (
    <Ctx.Provider value={{ user, session, loading, configured: isSupabaseConfigured, signUp, signIn, sendMagicLink, signInWithGoogle, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be inside AuthProvider");
  return c;
};

/** Friendly display name from Supabase user metadata, falling back to the email handle. */
export const displayName = (user: User | null) =>
  (user?.user_metadata?.full_name as string | undefined) || user?.email?.split("@")[0] || "Account";
