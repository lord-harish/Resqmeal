import type { ReactNode } from "react";
import { formatDateTime, formatRelativeExpiry, formatTimeOnly } from "@/lib/utils/datetime";
import type { Donation } from "@/types/donation";

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-[#E2E8F0] py-3 last:border-b-0 sm:flex-row sm:gap-4">
      <dt className="text-sm font-medium text-[#64748B] sm:w-40 sm:shrink-0">{label}</dt>
      <dd className="text-sm text-[#12372A]">{children}</dd>
    </div>
  );
}

export function DonationInfo({ donation, now }: { donation: Donation; now: Date }) {
  const allergens = donation.allergens.filter((item) => item !== "None specified");
  const ratingText =
    donation.donorRating > 0 ? `⭐ ${donation.donorRating.toFixed(1)}` : "New donor";

  return (
    <dl className="flex flex-col rounded-2xl border border-[#E2E8F0] bg-white px-4">
      <InfoRow label="Cooked at">{formatDateTime(donation.cookedAt)}</InfoRow>
      <InfoRow label="Expires">
        {formatDateTime(donation.expiresAt)}{" "}
        <span className="text-[#64748B]">({formatRelativeExpiry(donation.expiresAt, now)})</span>
      </InfoRow>
      <InfoRow label="Pickup window">
        {`${formatDateTime(donation.pickupWindow.from)} → ${formatTimeOnly(donation.pickupWindow.until)}`}
      </InfoRow>
      <InfoRow label="Packaging">{donation.packaging}</InfoRow>
      <InfoRow label="Allergen information">
        {allergens.length > 0 ? (
          <ul className="list-disc pl-4">
            {allergens.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          "None specified"
        )}
        <p className="mt-1 text-xs text-[#64748B]">Information only</p>
      </InfoRow>
      <InfoRow label="Created">{formatDateTime(donation.createdAt)}</InfoRow>
      <InfoRow label="Area">{donation.approxLocation.area || "—"}</InfoRow>
      <InfoRow label="Donor">
        {donation.donorName || "—"} <span className="text-[#64748B]">· {ratingText}</span>
      </InfoRow>
    </dl>
  );
}
