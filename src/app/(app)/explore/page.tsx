"use client";

import { useMemo, useState, type ReactNode } from "react";
import { CategoryChips, DonationCard } from "@/components/donation";
import { Button, CardSkeleton, EmptyState, ErrorState, Input, Select } from "@/components/ui";
import { DISTANCE_OPTIONS_KM, getCategoryLabel } from "@/constants/donation";
import { useAvailableDonations, useNow } from "@/hooks/useAvailableDonations";
import { useUserLocation } from "@/hooks/useUserLocation";
import { haversineKm } from "@/lib/utils/distance";

const ANY_DISTANCE = "any";
const ALL_CATEGORIES = "all";

const DISTANCE_SELECT_OPTIONS = [
  { value: ANY_DISTANCE, label: "Any distance" },
  ...DISTANCE_OPTIONS_KM.map((km) => ({ value: String(km), label: `Within ${km} km` })),
];

export default function ExplorePage() {
  const now = useNow();
  const { donations, loading, error, reload } = useAvailableDonations();
  const { position, requesting, request } = useUserLocation();

  const [searchText, setSearchText] = useState<string>("");
  const [category, setCategory] = useState<string>(ALL_CATEGORIES);
  const [distanceValue, setDistanceValue] = useState<string>(ANY_DISTANCE);

  const maxKm = distanceValue === ANY_DISTANCE ? null : Number(distanceValue);
  const normalizedSearch = searchText.trim().toLowerCase();
  const filtersActive =
    normalizedSearch !== "" || category !== ALL_CATEGORIES || distanceValue !== ANY_DISTANCE;
  const distanceNeedsLocation = maxKm !== null && position === null;

  const filtered = useMemo(
    () =>
      donations.filter((donation) => {
        if (category !== ALL_CATEGORIES && donation.category !== category) {
          return false;
        }
        if (normalizedSearch !== "") {
          const haystack = [
            donation.title,
            getCategoryLabel(donation.category),
            donation.description,
            donation.approxLocation.area,
          ]
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(normalizedSearch)) {
            return false;
          }
        }
        if (maxKm !== null && position !== null) {
          if (haversineKm(position, donation.approxLocation) > maxKm) {
            return false;
          }
        }
        return true;
      }),
    [donations, category, normalizedSearch, maxKm, position],
  );

  function clearFilters(): void {
    setSearchText("");
    setCategory(ALL_CATEGORIES);
    setDistanceValue(ANY_DISTANCE);
  }

  let results: ReactNode;
  if (loading) {
    results = (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <CardSkeleton key={index} />
        ))}
      </div>
    );
  } else if (error) {
    results = <ErrorState message={error} onRetry={reload} />;
  } else {
    results = (
      <div className="flex flex-col gap-4">
        <p role="status" className="text-sm font-medium text-[#334155]">
          {`${filtered.length} donations found`}
        </p>
        {filtered.length === 0 ? (
          <EmptyState
            title="🍱 No food available nearby"
            description="There are no active food donations matching your current filters. Check again later."
            action={
              filtersActive ? (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((donation) => (
              <DonationCard
                key={donation.id}
                donation={donation}
                now={now}
                distanceKm={position ? haversineKm(position, donation.approxLocation) : null}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-[#12372A]">Explore Food</h1>
        <p className="text-[#64748B]">Find surplus food near you.</p>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-4">
        <Input
          label="Search food"
          type="search"
          placeholder="Search food, category or area"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />

        <CategoryChips value={category} onChange={setCategory} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Select
              label="Distance"
              value={distanceValue}
              options={DISTANCE_SELECT_OPTIONS}
              onChange={(event) => setDistanceValue(event.target.value)}
            />
            {distanceNeedsLocation ? (
              <p className="text-sm text-[#64748B]">Turn on location to filter by distance.</p>
            ) : null}
          </div>
          {position === null ? (
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={request}
                loading={requesting}
                loadingText="Locating…"
                fullWidth
              >
                Use my location
              </Button>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex min-h-[32px] items-center rounded-full bg-[#DCFCE7] px-3 text-xs font-semibold text-[#12372A]">
            Showing available food only
          </span>
        </div>
      </div>

      {results}
    </section>
  );
}
