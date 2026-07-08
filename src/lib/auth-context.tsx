import { createContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as api from "@/lib/api-client";
import type { SignUpParams, UserProfile } from "@/types/auth";

export interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (params: SignUpParams) => Promise<{ error: string | null }>;
  logout: () => void;
  updateProfile: (patch: Partial<Pick<UserProfile, "name" | "phone" | "bio" | "avatar" | "theme" | "accentColor">>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<string | null>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function friendlyError(message: string): string {
  if (message.toLowerCase().includes("incorrect email or password")) {
    return "Incorrect email or password.";
  }
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!api.getToken()) {
      setLoading(false);
      return;
    }
    api
      .fetchMe()
      .then(setUser)
      .catch(() => api.clearToken())
      .finally(() => setLoading(false));
  }, []);

  const signIn = async (email: string, password: string): Promise<string | null> => {
    try {
      const { accessToken, user: profile } = await api.login(email, password);
      api.setToken(accessToken);
      setUser(profile);
      return null;
    } catch (error) {
      return friendlyError(error instanceof Error ? error.message : "Failed to sign in.");
    }
  };

  const signUp = async ({
    name,
    businessName,
    email,
    password,
    role,
    seedDemo,
  }: SignUpParams): Promise<{ error: string | null }> => {
    try {
      const { accessToken, user: profile } = await api.register({
        name,
        businessName,
        email,
        password,
        role,
        seedDemo,
      });
      api.setToken(accessToken);
      setUser(profile);
      return { error: null };
    } catch (error) {
      return { error: friendlyError(error instanceof Error ? error.message : "Failed to create account.") };
    }
  };

  const logout = () => {
    api.clearToken();
    setUser(null);
  };

  const updateProfile: AuthContextValue["updateProfile"] = async (patch) => {
    if (!user) return;
    try {
      const profile = await api.updateProfile(patch);
      setUser(profile);
    } catch (error) {
      console.error("Failed to update profile", error);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<string | null> => {
    try {
      await api.changePassword(currentPassword, newPassword);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : "Failed to change password.";
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, signIn, signUp, logout, updateProfile, changePassword }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
