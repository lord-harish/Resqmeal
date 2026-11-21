"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import { DonationStatusBadge } from "@/components/donation";
import { Button, Card, EmptyState, ErrorState, Input, LoadingSkeleton } from "@/components/ui";
import { getCategoryIcon, type DonationStatus } from "@/constants/donation";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useNow } from "@/hooks/useAvailableDonations";
import { formatDateTime } from "@/lib/utils/datetime";
import { extractErrorCode, getFirestoreErrorMessage, logTechnicalError } from "@/lib/utils/errors";
import { validateName } from "@/lib/utils/validation";
import { getDonationsByDonor, getEffectiveStatus } from "@/services/donation.service";
import type { Donation } from "@/types/donation";

function formatJoined(createdAt: Date | null): string {
  return createdAt ? createdAt.toLocaleDateString() : "Unknown";
}

const DONATION_TABS: readonly { status: DonationStatus; label: string }[] = [
  { status: "AVAILABLE", label: "Available" },
  { status: "EXPIRED", label: "Expired" },
  { status: "CANCELLED", label: "Cancelled" },
];

const EMPTY_TITLES: Record<DonationStatus, string> = {
  AVAILABLE: "You haven't posted any food yet.",
  EXPIRED: "No expired donations.",
  CANCELLED: "No cancelled donations.",
};

export default function ProfilePage() {
  const { status, user } = useAuth();
  const { profile, saveProfile, saving, error } = useUserProfile();
  const { showToast } = useToast();

  const [draftName, setDraftName] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | undefined>(undefined);
  const [saveRequested, setSaveRequested] = useState<boolean>(false);

  // Show the success toast only when a requested save finishes without an error.
  useEffect(() => {
    if (saveRequested && !saving) {
      if (!error) {
        showToast("Profile updated.", "success");
      }
      setSaveRequested(false);
    }
  }, [saveRequested, saving, error, showToast]);

  const now = useNow();
  const uid: string | null = user ? user.uid : null;
  const [donations, setDonations] = useState<Donation[]>([]);
  const [donationsLoading, setDonationsLoading] = useState<boolean>(true);
  const [donationsError, setDonationsError] = useState<string | null>(null);
  const [donationsReloadCount, setDonationsReloadCount] = useState<number>(0);
  const [selectedStatus, setSelectedStatus] = useState<DonationStatus>("AVAILABLE");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Load the signed-in donor's own donations once per user (and again on retry).
  useEffect(() => {
    if (uid === null) return;
    const donorId: string = uid;
    let cancelled = false;

    async function loadMyDonations(): Promise<void> {
      setDonationsLoading(true);
      setDonationsError(null);
      try {
        const result = await getDonationsByDonor(donorId);
        if (cancelled) return;
        setDonations(result);
      } catch (e: unknown) {
        if (cancelled) return;
        logTechnicalError("loadMyDonations", e);
        setDonationsError(getFirestoreErrorMessage(extractErrorCode(e)));
      } finally {
        if (!cancelled) {
          setDonationsLoading(false);
        }
      }
    }

    void loadMyDonations();

    return () => {
      cancelled = true;
    };
  }, [uid, donationsReloadCount]);

  const visibleDonations = donations.filter(
    (donation) => getEffectiveStatus(donation, now) === selectedStatus,
  );

  // Arrow keys, Home and End move between tabs (WAI-ARIA tabs pattern).
  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number): void {
    let nextIndex: number;
    switch (event.key) {
      case "ArrowRight":
        nextIndex = (index + 1) % DONATION_TABS.length;
        break;
      case "ArrowLeft":
        nextIndex = (index - 1 + DONATION_TABS.length) % DONATION_TABS.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = DONATION_TABS.length - 1;
        break;
      default:
        return;
    }
    const next = DONATION_TABS.at(nextIndex);
    if (!next) return;
    event.preventDefault();
    setSelectedStatus(next.status);
    tabRefs.current[nextIndex]?.focus();
  }

  if (status === "loading") {
    return (
      <section className="flex flex-col gap-6">
        <LoadingSkeleton lines={4} />
      </section>
    );
  }

  const nameValue = draftName ?? profile?.name ?? "";

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const validation = validateName(nameValue);
    setNameError(validation ?? undefined);
    if (validation) return;
    setSaveRequested(true);
    void saveProfile({ name: nameValue.trim() });
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-[#12372A]">Profile</h1>
        <p className="text-[#64748B]">Manage how you appear to other ResQMeal members.</p>
      </div>

      <Card className="flex flex-col gap-4 p-6">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-[#64748B]">Name</dt>
            <dd className="font-medium text-[#334155]">{profile?.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-[#64748B]">Email</dt>
            <dd className="font-medium text-[#334155]">{profile?.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-[#64748B]">Phone</dt>
            <dd className="font-medium text-[#334155]">{profile?.phone ?? "Not added"}</dd>
          </div>
          <div>
            <dt className="text-sm text-[#64748B]">Joined</dt>
            <dd className="font-medium text-[#334155]">{formatJoined(profile?.createdAt ?? null)}</dd>
          </div>
        </dl>
      </Card>

      {error ? <ErrorState message={error} /> : null}

      <Card className="p-6">
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <Input
            label="Name"
            autoComplete="name"
            value={nameValue}
            onChange={(event) => setDraftName(event.target.value)}
            error={nameError}
          />
          <Button type="submit" variant="primary" loading={saving} loadingText="Saving...">
            Save changes
          </Button>
        </form>
      </Card>

      {user ? (
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-[#12372A]">My donations</h2>

          <div role="tablist" aria-label="Donation status" className="flex flex-wrap gap-2">
            {DONATION_TABS.map((tab, index) => {
              const selected = tab.status === selectedStatus;
              return (
                <button
                  key={tab.status}
                  ref={(element) => {
                    tabRefs.current[index] = element;
                  }}
                  type="button"
                  role="tab"
                  id={`my-donations-tab-${tab.status}`}
                  aria-selected={selected}
                  aria-controls="my-donations-panel"
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setSelectedStatus(tab.status)}
                  onKeyDown={(event) => handleTabKeyDown(event, index)}
                  className={`min-h-[44px] rounded-xl border px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#16A34A] ${
                    selected
                      ? "border-[#12372A] bg-[#12372A] text-white"
                      : "border-[#E2E8F0] bg-white text-[#334155] hover:border-[#16A34A]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div
            role="tabpanel"
            id="my-donations-panel"
            aria-labelledby={`my-donations-tab-${selectedStatus}`}
            className="flex flex-col gap-3"
          >
            {donationsLoading ? (
              <LoadingSkeleton lines={4} />
            ) : donationsError ? (
              <ErrorState
                message={donationsError}
                onRetry={() => setDonationsReloadCount((count) => count + 1)}
              />
            ) : visibleDonations.length === 0 ? (
              <EmptyState
                title={EMPTY_TITLES[selectedStatus]}
                description={selectedStatus === "AVAILABLE" ? "Have surplus food?" : undefined}
                action={
                  selectedStatus === "AVAILABLE" ? (
                    <Link
                      href="/donate"
                      className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#12372A] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#0E2A20]"
                    >
                      Donate Food
                    </Link>
                  ) : undefined
                }
              />
            ) : (
              <ul className="flex flex-col gap-3">
                {visibleDonations.map((donation) => {
                  const firstImage = donation.images.at(0);
                  const unitText = donation.unit === "Other" ? "" : ` ${donation.unit}`;
                  return (
                    <li key={donation.id}>
                      <Link
                        href={`/donation/${donation.id}`}
                        className="flex gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-4 transition-colors hover:border-[#16A34A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#16A34A]"
                      >
                        {firstImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={firstImage.url}
                            alt={donation.title}
                            className="h-16 w-16 shrink-0 rounded-xl object-cover"
                          />
                        ) : (
                          <div
                            aria-hidden="true"
                            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[#D1FAE5] text-2xl"
                          >
                            {getCategoryIcon(donation.category)}
                          </div>
                        )}
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="truncate font-semibold text-[#12372A]">{donation.title}</p>
                            <DonationStatusBadge status={getEffectiveStatus(donation, now)} />
                          </div>
                          <p className="text-sm text-[#334155]">
                            {`${donation.availableQuantity}/${donation.originalQuantity}${unitText}`}
                          </p>
                          <p className="text-xs text-[#64748B]">
                            Expires {formatDateTime(donation.expiresAt)}
                          </p>
                          <p className="text-xs text-[#64748B]">
                            Created {formatDateTime(donation.createdAt)}
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
