import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type UserRole = "student" | "admin";

export type Session = {
  fullName: string;
  email: string;
  role: UserRole;
};

type SignInInput = {
  fullName: string;
  email: string;
  role: UserRole;
};

type AuthContextValue = {
  isReady: boolean;
  session: Session | null;
  signIn: (input: SignInInput) => void;
  signOut: () => void;
};

const SESSION_KEY = "gmc-academy.session.v1";

const AuthContext = createContext<AuthContextValue | null>(null);

function isSession(value: unknown): value is Session {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.fullName === "string" &&
    typeof record.email === "string" &&
    (record.role === "student" || record.role === "admin")
  );
}

function readSession(): Session | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return isSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeSession(session: Session | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!session) {
    window.localStorage.removeItem(SESSION_KEY);
    return;
  }

  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setSession(readSession());
    setIsReady(true);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isReady,
      session,
      signIn: (input) => {
        const nextSession: Session = {
          fullName: input.fullName.trim(),
          email: input.email.trim().toLowerCase(),
          role: input.role,
        };
        setSession(nextSession);
        writeSession(nextSession);
      },
      signOut: () => {
        setSession(null);
        writeSession(null);
      },
    }),
    [isReady, session],
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
