"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase/client";
import { extractErrorCode, getFirestoreErrorMessage, logTechnicalError } from "@/lib/utils/errors";
import { toAuthUser } from "@/services/auth.service";
import { createUserProfile, getUserProfile } from "@/services/user.service";
import type { AuthStatus, AuthUser } from "@/types/auth";
import type { UserProfile } from "@/types/user";

export interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  profile: UserProfile | null;
  profileError: string | null;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const NOT_CONFIGURED_MESSAGE =
  "ResQMeal is not configured yet. Add your Firebase settings to .env.local.";

export function AuthProvider({ children }: { children: ReactNode }): ReactElement {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const mountedRef = useRef<boolean>(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setUser(null);
      setProfile(null);
      setStatus("unauthenticated");
      setProfileError(NOT_CONFIGURED_MESSAGE);
      return;
    }

    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (cancelled) return;

      if (!firebaseUser) {
        setUser(null);
        setProfile(null);
        setProfileError(null);
        setStatus("unauthenticated");
        return;
      }

      const authUser = toAuthUser(firebaseUser);
      setUser(authUser);
      setStatus("authenticated");

      try {
        await createUserProfile(authUser);
        const loaded = await getUserProfile(authUser.uid);
        if (cancelled) return;
        setProfile(loaded);
        setProfileError(null);
      } catch (error) {
        if (cancelled) return;
        logTechnicalError("AuthProvider.loadProfile", error);
        setProfile(null);
        setProfileError(getFirestoreErrorMessage(extractErrorCode(error)));
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const refreshProfile = useCallback(async (): Promise<void> => {
    if (!auth) return;
    const current = auth.currentUser;
    if (!current) return;

    try {
      const loaded = await getUserProfile(current.uid);
      if (!mountedRef.current) return;
      setProfile(loaded);
      setProfileError(null);
    } catch (error) {
      if (!mountedRef.current) return;
      logTechnicalError("AuthProvider.refreshProfile", error);
      setProfileError(getFirestoreErrorMessage(extractErrorCode(error)));
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, profile, profileError, refreshProfile }),
    [status, user, profile, profileError, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
