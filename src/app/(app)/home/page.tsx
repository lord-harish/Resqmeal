"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { DonationCard } from "@/components/donation";
import { Button, CardSkeleton, EmptyState, ErrorState, LoadingSkeleton } from "@/components/ui";
import { DONATION_LIMITS } from "@/constants/donation";
import { useAuth } from "@/hooks/useAuth";
import { useAvailableDonations, useNow } from "@/hooks/useAvailableDonations";
import { useUserLocation } from "@/hooks/useUserLocation";
import { haversineKm } from "@/lib/utils/distance";
import { getAvailableMealsSummary, getPlatformStats } from "@/services/stats.service";
import type { PlatformStats } from "@/types/donation";

interface MealsSummary {
  activeListings: number;
  availableServings: number;
}

const EMPTY_STATS: PlatformStats = { mealsRescued: 0, foodSavedKg: 0, activeDonors: 0 };
const EMPTY_SUMMARY: MealsSummary = { activeListings: 0, availableServings: 0 };

function getGreeting(hour: number): string {
  if (hour < 12) {
    return "Good morning";
  }
  if (hour < 17) {
    return "Good afternoon";
  }
  return "Good evening";
}

const PRIMARY_ACTION_CLASS =
  "flex min-h-[120px] flex-col justify-center gap-2 rounded-2xl bg-[#16A34A] p-6 text-white transition-colors hover:bg-[#15803D] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2";

const MINT_ACTION_CLASS =
  "flex min-h-[120px] flex-col justify-center gap-2 rounded-2xl bg-[#DCFCE7] p-6 text-[#12372A] transition-colors hover:bg-[#bbf7d0] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2";

export default function HomePage() {
  const { user, profile } = useAuth();
  const now = useNow();
  const name = profile?.name || user?.displayName || "there";

  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [mealsSummary, setMealsSummary] = useState<MealsSummary | null>(null);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;

    async function loadStats(): Promise<void> {
      try {
        const [platform, summary] = await Promise.all([getPlatformStats(), getAvailableMealsSummary()]);
        if (cancelled) {
          return;
        }
        setPlatformStats(platform);
        setMealsSummary(summary);
      } catch {
        if (cancelled) {
          return;
        }
        setPlatformStats(EMPTY_STATS);
        setMealsSummary(EMPTY_SUMMARY);
      } finally {
        if (!cancelled) {
          setStatsLoading(false);
        }
      }
    }

    void loadStats();

    return () => {
      cancelled = true;
    };
  }, []);

  const { donations, loading, error, reload } = useAvailableDonations();
  const { position, requesting, request } = useUserLocation();
  const featured = donations.slice(0, DONATION_LIMITS.HOME_FEED_LIMIT);

  const tiles = [
    { key: "meals", label: "🍱 Meals rescued", value: String(platformStats?.mealsRescued ?? 0) },
    { key: "food", label: "⚖️ Food saved (est.)", value: `${platformStats?.foodSavedKg ?? 0} kg` },
    { key: "donors", label: "👥 Active donors", value: String(platformStats?.activeDonors ?? 0) },
    { key: "available", label: "🍽️ Available meals", value: String(mealsSummary?.availableServings ?? 0) },
  ];

  let feed: ReactNode;
  if (loading) {
    feed = (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <CardSkeleton key={index} />
        ))}
      </div>
    );
  } else if (error) {
    feed = <ErrorState message={error} onRetry={reload} />;
  } else if (featured.length === 0) {
    feed = (
      <EmptyState
        title="🍱 No food available nearby"
        description="There are no active food donations right now. Check again later."
      />
    );
  } else {
    feed = (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {featured.map((donation) => (
          <DonationCard
            key={donation.id}
            donation={donation}
            now={now}
            distanceKm={position ? haversineKm(position, donation.approxLocation) : null}
          />
        ))}
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-[#12372A]">{`${getGreeting(now.getHours())}, ${name} 👋`}</h1>
        <p className="text-[#64748B]">Ready to rescue some food today?</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/donate" className={PRIMARY_ACTION_CLASS}>
          <span className="text-xl font-bold">🍱 DONATE FOOD</span>
          <span className="text-sm text-white/90">Share surplus food with people nearby.</span>
        </Link>
        <Link href="/explore" className={MINT_ACTION_CLASS}>
          <span className="text-xl font-bold">🤝 RECEIVE FOOD</span>
          <span className="text-sm text-[#334155]">Find available food near you.</span>
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-bold text-[#12372A]">Platform impact</h2>
        <div className="grid grid-cols-2 gap-3">
          {tiles.map((tile) => (
            <div
              key={tile.key}
              className="flex flex-col gap-1 rounded-2xl border border-[#E2E8F0] bg-white p-4"
            >
              <p className="text-sm text-[#64748B]">{tile.label}</p>
              {statsLoading ? (
                <LoadingSkeleton lines={1} />
              ) : (
                <p className="text-2xl font-bold text-[#12372A]">{tile.value}</p>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-[#64748B]">
          Impact figures are rough estimates for planning, not scientific measurements.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-bold text-[#12372A]">Food Available Near You</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={request}
            loading={requesting}
            loadingText="Locating…"
          >
            Use my location for distance
          </Button>
        </div>

        {feed}

        <Link
          href="/explore"
          className="self-start rounded-md text-sm font-semibold text-[#16A34A] hover:text-[#15803D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2"
        >
          See all in Explore
        </Link>
      </div>
    </section>
  );
}
