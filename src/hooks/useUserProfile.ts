import { useCallback, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { extractErrorCode, getFirestoreErrorMessage, logTechnicalError } from "@/lib/utils/errors";
import { updateUserProfile } from "@/services/user.service";
import type { AuthStatus } from "@/types/auth";
import type { UserProfile, UserProfileUpdate } from "@/types/user";

export interface UseUserProfileResult {
  profile: UserProfile | null;
  status: AuthStatus;
  saveProfile: (update: UserProfileUpdate) => Promise<void>;
  saving: boolean;
  error: string | null;
}

export function useUserProfile(): UseUserProfileResult {
  const { profile, status, user, refreshProfile } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const performSave = useCallback(
    async (update: UserProfileUpdate): Promise<void> => {
      if (!user) {
        setError("Please sign in again to continue.");
        return;
      }
      try {
        await updateUserProfile(user.uid, update);
        await refreshProfile();
        setError(null);
      } catch (err) {
        logTechnicalError("useUserProfile.saveProfile", err);
        setError(getFirestoreErrorMessage(extractErrorCode(err)));
      }
    },
    [user, refreshProfile],
  );

  const { run, pending } = useAsyncAction(performSave);

  return {
    profile,
    status,
    saveProfile: run,
    saving: pending,
    error,
  };
}
