import { createContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { TablesUpdate } from "@/types/database";
import type { Role, SignUpParams, UserProfile } from "@/types/auth";

export interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (params: SignUpParams) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>;
  signInWithGoogle: () => Promise<string | null>;
  logout: () => Promise<void>;
  updateProfile: (patch: Partial<Pick<UserProfile, "name" | "phone" | "bio" | "avatar" | "theme" | "accentColor">>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapProfile(row: {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  role: string;
  avatar_url: string | null;
  bio: string;
  phone: string;
  theme: string;
  accent_color: string;
  provider: string;
}): UserProfile {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    email: row.email,
    role: row.role as Role,
    avatar: row.avatar_url,
    bio: row.bio,
    phone: row.phone,
    theme: row.theme as UserProfile["theme"],
    accentColor: row.accent_color,
    provider: row.provider as UserProfile["provider"],
  };
}

function friendlyError(message: string): string {
  if (message.toLowerCase().includes("invalid login credentials")) {
    return "Incorrect email or password.";
  }
  if (message.toLowerCase().includes("user already registered")) {
    return "An account with this email already exists. Please sign in instead.";
  }
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetches (or, on first login after signup, creates) the profile/org for
  // the authenticated Supabase user and syncs it into local state.
  async function syncProfile(authUser: User) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle();

    if (error) {
      console.error("Failed to load profile", error);
      return;
    }

    if (profile) {
      setUser(mapProfile(profile));
      return;
    }

    // No profile yet: this is the first session after signup (metadata was
    // stashed on the auth user at signUp time — needed because org/profile
    // creation can only happen once we have a real session, which may be
    // delayed by email confirmation).
    const meta = authUser.user_metadata as {
      pending_org_name?: string;
      pending_user_name?: string;
      pending_role?: Role;
      pending_seed_demo?: boolean;
    };

    // OAuth sign-ins (e.g. Google) never went through the signup form, so
    // there's no pending_* metadata — bootstrap a sensible default org
    // instead of leaving the user stuck with no profile.
    const orgName = meta.pending_org_name ?? `${authUser.email?.split("@")[0] ?? "My"}'s Business`;
    const userName = meta.pending_user_name ?? authUser.email?.split("@")[0] ?? "Owner";

    const { error: rpcError } = await supabase.rpc("create_account", {
      p_org_name: orgName,
      p_user_name: userName,
      p_role: meta.pending_role ?? "owner",
      p_seed_demo: meta.pending_seed_demo ?? true,
    });
    if (rpcError) {
      console.error("Failed to create account", rpcError);
      return;
    }

    const { data: created } = await supabase.from("profiles").select("*").eq("id", authUser.id).maybeSingle();
    if (created) setUser(mapProfile(created));
  }

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      if (!active) return;
      if (session) {
        syncProfile(session.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      if (session) {
        syncProfile(session.user);
      } else {
        setUser(null);
      }
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? friendlyError(error.message) : null;
  };

  const signUp = async ({
    name,
    businessName,
    email,
    password,
    role,
    seedDemo,
  }: SignUpParams): Promise<{ error: string | null; needsEmailConfirmation: boolean }> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          pending_org_name: businessName,
          pending_user_name: name,
          pending_role: role,
          pending_seed_demo: seedDemo,
        },
      },
    });

    if (error) return { error: friendlyError(error.message), needsEmailConfirmation: false };

    if (data.session) {
      await syncProfile(data.session.user);
      return { error: null, needsEmailConfirmation: false };
    }

    // No session back means Supabase requires email confirmation before
    // the account can sign in; org/profile creation resumes once they do.
    return { error: null, needsEmailConfirmation: true };
  };

  const signInWithGoogle = async (): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    return error ? friendlyError(error.message) : null;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateProfile: AuthContextValue["updateProfile"] = async (patch) => {
    if (!user) return;
    const dbPatch: TablesUpdate<"profiles"> = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.phone !== undefined) dbPatch.phone = patch.phone;
    if (patch.bio !== undefined) dbPatch.bio = patch.bio;
    if (patch.avatar !== undefined) dbPatch.avatar_url = patch.avatar;
    if (patch.theme !== undefined) dbPatch.theme = patch.theme;
    if (patch.accentColor !== undefined) dbPatch.accent_color = patch.accentColor;

    const { error } = await supabase.from("profiles").update(dbPatch).eq("id", user.id);
    if (error) {
      console.error("Failed to update profile", error);
      return;
    }
    setUser({ ...user, ...patch });
  };

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, signIn, signUp, signInWithGoogle, logout, updateProfile }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
