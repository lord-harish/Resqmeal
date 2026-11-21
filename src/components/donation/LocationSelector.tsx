"use client";

import { useEffect, useState } from "react";
import { Button, Input } from "@/components/ui";

export interface LocationValue {
  latitude: number | null;
  longitude: number | null;
  area: string;
  displayAddress: string;
}

export interface LocationSelectorProps {
  value: LocationValue;
  onChange: (next: LocationValue) => void;
  disabled?: boolean;
}

const DENIED_MESSAGE = "Location permission was denied. You can enter the pickup area manually below.";
const UNAVAILABLE_MESSAGE = "Location is unavailable on this device. You can enter the pickup area manually below.";

export function LocationSelector({ value, onChange, disabled = false }: LocationSelectorProps) {
  const [isSupported, setIsSupported] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);

  // Checked after mount so server and client markup match.
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setIsSupported(false);
    }
  }, []);

  const isCaptured = value.latitude !== null && value.longitude !== null;

  function useCurrentLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setIsSupported(false);
      return;
    }

    setIsLocating(true);
    setFallbackMessage(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        onChange({
          ...value,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        setIsLocating(false);
        setFallbackMessage(error.code === error.PERMISSION_DENIED ? DENIED_MESSAGE : UNAVAILABLE_MESSAGE);
      },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  }

  let statusText = "No location captured yet.";
  if (isCaptured) {
    statusText = "Location captured";
  } else if (isLocating) {
    statusText = "Finding your location...";
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          onClick={useCurrentLocation}
          disabled={disabled || isLocating || !isSupported}
          loading={isLocating}
          loadingText="Finding your location..."
          aria-describedby="location-status"
          className="self-start"
        >
          Use my current location
        </Button>
        <p id="location-status" role="status" className="text-sm font-medium text-[#12372A]">
          {statusText}
        </p>
        {!isSupported || fallbackMessage ? (
          <p className="text-sm text-[#DC2626]">{fallbackMessage ?? UNAVAILABLE_MESSAGE}</p>
        ) : null}
      </div>

      <Input
        label="Area / neighbourhood"
        placeholder="e.g. Peelamedu"
        required
        value={value.area}
        disabled={disabled}
        autoComplete="off"
        onChange={(event) => onChange({ ...value, area: event.target.value })}
      />

      <Input
        label="Full pickup address (private — shared only with the people you approve)"
        hint="Kept private. Shared only with people you approve."
        required
        value={value.displayAddress}
        disabled={disabled}
        autoComplete="street-address"
        onChange={(event) => onChange({ ...value, displayAddress: event.target.value })}
      />

      <p className="text-sm text-[#64748B]">
        Approximate area is shown publicly. Your exact address stays private.
      </p>
    </div>
  );
}
