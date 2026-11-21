import { useCallback, useEffect, useState } from "react";
import { getAvailableDonations } from "@/services/donation.service";
import {
  extractErrorCode,
  getFirestoreErrorMessage,
  logTechnicalError,
} from "@/lib/utils/errors";
import type { Donation } from "@/types/donation";

export function useAvailableDonations(): {
  donations: Donation[];
  loading: boolean;
  error: string | null;
  reload: () => void;
} {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      setLoading(true);
      try {
        const result = await getAvailableDonations();
        if (cancelled) {
          return;
        }
        setDonations(result);
        setError(null);
      } catch (e: unknown) {
        if (cancelled) {
          return;
        }
        logTechnicalError("loadDonations", e);
        setError(getFirestoreErrorMessage(extractErrorCode(e)));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [reloadCount]);

  const reload = useCallback((): void => {
    setReloadCount((count) => count + 1);
  }, []);

  return { donations, loading, error, reload };
}

/** Returns the current time, refreshed every intervalMs. Used for expiry countdowns. */
export function useNow(intervalMs: number = 60000): Date {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, intervalMs);
    return () => {
      clearInterval(timer);
    };
  }, [intervalMs]);

  return now;
}
