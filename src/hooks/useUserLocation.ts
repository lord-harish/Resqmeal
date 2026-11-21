import { useCallback, useState } from "react";

export interface UserPosition {
  latitude: number;
  longitude: number;
}

/** Requests the browser location on demand only (never on mount). */
export function useUserLocation(): {
  position: UserPosition | null;
  requesting: boolean;
  denied: boolean;
  request: () => void;
} {
  const [position, setPosition] = useState<UserPosition | null>(null);
  const [requesting, setRequesting] = useState<boolean>(false);
  const [denied, setDenied] = useState<boolean>(false);

  const request = useCallback((): void => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setDenied(true);
      return;
    }

    setRequesting(true);
    navigator.geolocation.getCurrentPosition(
      (result) => {
        setPosition({
          latitude: result.coords.latitude,
          longitude: result.coords.longitude,
        });
        setDenied(false);
        setRequesting(false);
      },
      () => {
        setDenied(true);
        setRequesting(false);
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 },
    );
  }, []);

  return { position, requesting, denied, request };
}
