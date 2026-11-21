"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DonationGallery, DonationInfo, DonationStatusBadge } from "@/components/donation";
import { Button, ErrorState, LoadingSkeleton } from "@/components/ui";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { useAuth } from "@/hooks/useAuth";
import { useNow } from "@/hooks/useAvailableDonations";
import { useToast } from "@/hooks/useToast";
import { getCategoryIcon, getCategoryLabel, type QuantityUnit } from "@/constants/donation";
import { ROUTES } from "@/constants/routes";
import {
  extractErrorCode,
  getFirestoreErrorMessage,
  logTechnicalError,
} from "@/lib/utils/errors";
import {
  cancelDonation,
  getDonation,
  getDonationPrivateLocation,
  getEffectiveStatus,
} from "@/services/donation.service";
import type { Donation, DonationPrivateLocation } from "@/types/donation";

type LoadState =
  | { kind: "loading" }
  | { kind: "missing" }
  | { kind: "error"; message: string }
  | { kind: "ready"; donation: Donation };

const LINK_CLASS =
  "inline-flex min-h-[44px] items-center rounded-lg text-sm font-medium text-[#16A34A] hover:text-[#15803D] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2";

function formatQuantity(quantity: number, unit: QuantityUnit): string {
  return unit === "Other" ? String(quantity) : `${quantity} ${unit}`;
}

function toActionMessage(error: unknown): string {
  // Plain Errors from the service carry user-facing text; Firebase errors carry a code.
  if (error instanceof Error && !("code" in error)) {
    return error.message;
  }
  return getFirestoreErrorMessage(extractErrorCode(error));
}

export default function DonationDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const now = useNow();

  const rawId = params.id;
  const id = Array.isArray(rawId) ? (rawId[0] ?? "") : (rawId ?? "");
  const posted = searchParams.get("posted") === "1";
  const uid = user?.uid ?? null;

  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [reloadCount, setReloadCount] = useState<number>(0);
  const [privateLocation, setPrivateLocation] = useState<DonationPrivateLocation | null>(null);
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  function reload(): void {
    setReloadCount((count) => count + 1);
  }

  useEffect(() => {
    if (!id) {
      setState({ kind: "missing" });
      return;
    }

    let cancelled = false;
    setState({ kind: "loading" });

    async function load(): Promise<void> {
      try {
        const donation = await getDonation(id);
        if (cancelled) {
          return;
        }
        setState(donation ? { kind: "ready", donation } : { kind: "missing" });
      } catch (e: unknown) {
        if (cancelled) {
          return;
        }
        logTechnicalError("loadDonation", e);
        setState({ kind: "error", message: getFirestoreErrorMessage(extractErrorCode(e)) });
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [id, reloadCount]);

  const donation = state.kind === "ready" ? state.donation : null;
  const isDonor = uid !== null && donation !== null && donation.donorId === uid;

  useEffect(() => {
    // Exact pickup address is donor-only, so it is only requested for the donor.
    if (!isDonor || !id) {
      setPrivateLocation(null);
      return;
    }

    let cancelled = false;
    void getDonationPrivateLocation(id)
      .then((location) => {
        if (!cancelled) {
          setPrivateLocation(location);
        }
      })
      .catch((e: unknown) => {
        logTechnicalError("loadPrivateLocation", e);
      });

    return () => {
      cancelled = true;
    };
  }, [id, isDonor]);

  const { run: runCancel, pending: cancelling } = useAsyncAction(async (): Promise<void> => {
    if (!id || !uid) {
      return;
    }
    setActionError(null);
    try {
      await cancelDonation(id, uid);
      reload();
      showToast("Donation cancelled.", "info");
    } catch (e: unknown) {
      logTechnicalError("cancelDonation", e);
      setActionError(toActionMessage(e));
    } finally {
      setConfirmOpen(false);
    }
  });

  const effectiveStatus = donation ? getEffectiveStatus(donation, now) : null;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <Link href={ROUTES.explore} className={LINK_CLASS}>
        ← Back
      </Link>

      {state.kind === "loading" ? <LoadingSkeleton lines={6} /> : null}

      {state.kind === "missing" ? (
        <div className="flex flex-col items-start gap-4">
          <ErrorState
            title="Donation not found"
            message="This donation may have been removed."
          />
          <Link href={ROUTES.explore} className={LINK_CLASS}>
            Browse food nearby
          </Link>
        </div>
      ) : null}

      {state.kind === "error" ? (
        <ErrorState message={state.message} onRetry={reload} />
      ) : null}

      {donation !== null && effectiveStatus !== null ? (
        <>
          {posted ? (
            <div
              role="status"
              className="flex flex-col gap-1 rounded-2xl border border-[#16A34A]/30 bg-[#DCFCE7] p-4 text-[#12372A]"
            >
              <p className="text-sm font-semibold">
                🎉 Food posted successfully. Your donation is now available for people nearby.
              </p>
              <p className="text-sm">
                {formatQuantity(donation.availableQuantity, donation.unit)} available
              </p>
            </div>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            <DonationGallery images={donation.images} title={donation.title} />

            <section className="flex flex-col gap-5">
              <DonationStatusBadge status={effectiveStatus} />

              <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-[#12372A]">{donation.title}</h1>
                <p className="text-sm font-medium text-[#334155]">
                  <span aria-hidden="true">{getCategoryIcon(donation.category)}</span>{" "}
                  {getCategoryLabel(donation.category)}
                </p>
                <p className="text-lg font-semibold text-[#12372A]">
                  {formatQuantity(donation.availableQuantity, donation.unit)} available
                </p>
                <p className="text-sm text-[#64748B]">Original: {donation.originalQuantity}</p>
              </div>

              <p className="whitespace-pre-line text-sm text-[#334155]">
                {donation.description || "No description added."}
              </p>

              <DonationInfo donation={donation} now={now} />

              {isDonor ? (
                <div className="flex flex-col items-start gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-5">
                  <h2 className="text-base font-semibold text-[#12372A]">Your donation</h2>
                  {privateLocation ? (
                    <p className="text-sm text-[#334155]">
                      Pickup address (private): {privateLocation.displayAddress}
                    </p>
                  ) : null}
                  {effectiveStatus === "AVAILABLE" ? (
                    <Button
                      variant="outline"
                      loading={cancelling}
                      loadingText="Cancelling..."
                      onClick={() => setConfirmOpen(true)}
                    >
                      Cancel donation
                    </Button>
                  ) : (
                    <p className="text-sm text-[#64748B]">
                      This donation can no longer be cancelled.
                    </p>
                  )}
                  {actionError ? (
                    <p role="alert" className="text-sm text-[#DC2626]">
                      {actionError}
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="flex flex-col items-start gap-2 rounded-2xl border border-[#E2E8F0] bg-white p-5">
                  <Button disabled>Contact / Request Food</Button>
                  <p className="text-sm text-[#64748B]">Requests arrive in a later update.</p>
                </div>
              )}
            </section>
          </div>

          <ConfirmDialog
            open={confirmOpen}
            title="Cancel this donation?"
            message="This food will no longer be available to other users."
            confirmLabel="Cancel Donation"
            cancelLabel="Keep Donation"
            destructive
            loading={cancelling}
            onConfirm={() => runCancel()}
            onCancel={() => setConfirmOpen(false)}
          />
        </>
      ) : null}
    </div>
  );
}
