import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { clearTokens, getAccessToken, setTokens } from "~/lib/api/client";
import {
  getMe,
  login as apiLogin,
  logout as apiLogout,
} from "~/lib/api/auth.service";
import type { UserProfile } from "~/lib/api/types";

export type UserRole = "student" | "admin";

export type Session = {
  fullName: string;
  email: string;
  role: UserRole;
  profilePhotoUrl: string | null;
};

type SignInInput = {
  email: string;
  password: string;
};

type AuthContextValue = {
  isReady: boolean;
  session: Session | null;
  signIn: (input: SignInInput) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function profileToSession(user: UserProfile): Session {
  return {
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    profilePhotoUrl: user.profilePhotoUrl,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(false);

  /** Hydrate session from stored token on mount */
  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      setIsReady(true);
      return;
    }

    getMe()
      .then((user) => setSession(profileToSession(user)))
      .catch(() => {
        clearTokens();
      })
      .finally(() => setIsReady(true));
  }, []);

  const signIn = useCallback(async (input: SignInInput) => {
    const authSession = await apiLogin(input);
    setTokens(authSession.accessToken, authSession.refreshToken);
    setSession(profileToSession(authSession.user));
  }, []);

  const signOut = useCallback(async () => {
    await apiLogout().catch(() => {
      // best-effort; always clear locally
    });
    clearTokens();
    setSession(null);
  }, []);

  const refreshSession = useCallback(async () => {
    const user = await getMe();
    setSession(profileToSession(user));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ isReady, session, signIn, signOut, refreshSession }),
    [isReady, session, signIn, signOut, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
