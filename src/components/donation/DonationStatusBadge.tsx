import { Badge, type BadgeTone } from "@/components/ui";
import type { DonationStatus } from "@/constants/donation";

const STATUS_LABELS: Record<DonationStatus, { label: string; tone: BadgeTone }> = {
  AVAILABLE: { label: "Available", tone: "success" },
  EXPIRED: { label: "Expired", tone: "warning" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
};

export interface DonationStatusBadgeProps {
  status: DonationStatus;
}

export function DonationStatusBadge({ status }: DonationStatusBadgeProps) {
  const { label, tone } = STATUS_LABELS[status];
  return <Badge tone={tone}>{label}</Badge>;
}
