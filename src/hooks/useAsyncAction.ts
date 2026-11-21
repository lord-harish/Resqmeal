import { useCallback, useEffect, useRef, useState } from "react";

export function useAsyncAction<TArgs extends unknown[]>(
  action: (...args: TArgs) => Promise<void>,
): { run: (...args: TArgs) => Promise<void>; pending: boolean } {
  const [pending, setPending] = useState<boolean>(false);
  // Ref blocks re-entry synchronously, before React re-renders with pending=true.
  const busyRef = useRef<boolean>(false);
  const mountedRef = useRef<boolean>(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const run = useCallback(
    async (...args: TArgs): Promise<void> => {
      if (busyRef.current) return;
      busyRef.current = true;
      if (mountedRef.current) setPending(true);
      try {
        await action(...args);
      } finally {
        busyRef.current = false;
        if (mountedRef.current) setPending(false);
      }
    },
    [action],
  );

  return { run, pending };
}
