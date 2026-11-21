import Link from "next/link";
import { getCategoryIcon, getCategoryLabel } from "@/constants/donation";
import { formatRelativeExpiry, formatTimeOnly } from "@/lib/utils/datetime";
import { formatDistanceKm } from "@/lib/utils/distance";
import { getEffectiveStatus } from "@/services/donation.service";
import type { Donation } from "@/types/donation";
import { DonationStatusBadge } from "./DonationStatusBadge";

export interface DonationCardProps {
  donation: Donation;
  now: Date;
  distanceKm?: number | null;
}

export function DonationCard({ donation, now, distanceKm }: DonationCardProps) {
  const cover = donation.images[0];
  const status = getEffectiveStatus(donation, now);
  const quantity =
    donation.unit === "Other"
      ? `${donation.availableQuantity} available`
      : `${donation.availableQuantity} ${donation.unit} available`;
  const donorLine = `${donation.donorRating === 0 ? "New donor" : `⭐ ${donation.donorRating.toFixed(1)}`} · ${donation.donorName}`;
  const location =
    typeof distanceKm === "number"
      ? `📍 ${donation.approxLocation.area} · ${formatDistanceKm(distanceKm)}`
      : `📍 ${donation.approxLocation.area}`;

  return (
    <Link
      href={`/donation/${donation.id}`}
      aria-label={`View ${donation.title}`}
      className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2"
    >
      <article className="flex h-full flex-col gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-4 transition-colors hover:border-[#16A34A]">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover.url}
            alt={donation.title}
            loading="lazy"
            className="aspect-video w-full rounded-xl object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex aspect-video w-full items-center justify-center rounded-xl bg-[#DCFCE7] text-4xl"
          >
            {getCategoryIcon(donation.category)}
          </div>
        )}

        <p className="text-xs font-medium text-[#64748B]">{getCategoryLabel(donation.category)}</p>
        <h3 className="text-lg font-bold text-[#12372A]">{donation.title}</h3>

        <div className="flex flex-col gap-1.5 text-sm text-[#334155]">
          <p className="font-semibold text-[#12372A]">{quantity}</p>
          <p>{location}</p>
          <p>⏰ Pickup before {formatTimeOnly(donation.pickupWindow.until)}</p>
          <p>{donorLine}</p>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-col gap-1">
            <DonationStatusBadge status={status} />
            <span className="text-xs text-[#64748B]">{formatRelativeExpiry(donation.expiresAt, now)}</span>
          </div>
          <span className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#E2E8F0] bg-white px-4 text-sm font-semibold text-[#12372A]">
            View food
          </span>
        </div>
      </article>
    </Link>
  );
}
