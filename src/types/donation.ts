import type {
  AllergenOption,
  DonationStatus,
  PackagingOption,
  QuantityUnit,
} from "@/constants/donation";

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface DonationImage {
  url: string;
  path: string;
  order: number;
}

export interface PickupWindow {
  from: Date;
  until: Date;
}

/** Public-safe location: coordinates rounded to 2 decimals (~1 km). */
export interface ApproximateLocation {
  area: string;
  latitude: number;
  longitude: number;
}

export interface Donation {
  id: string;
  donorId: string;
  donorName: string;
  donorRating: number;
  title: string;
  category: string;
  description: string;
  images: DonationImage[];
  originalQuantity: number;
  availableQuantity: number;
  unit: QuantityUnit;
  cookedAt: Date | null;
  expiresAt: Date | null;
  approxLocation: ApproximateLocation;
  pickupWindow: PickupWindow;
  packaging: PackagingOption;
  allergens: AllergenOption[];
  /** Stored status. Use getEffectiveStatus() to account for expiry. */
  status: DonationStatus;
  createdAt: Date | null;
  updatedAt: Date | null;
}

/** Exact pickup location, stored in donations/{id}/private/location. Donor-only read. */
export interface DonationPrivateLocation {
  displayAddress: string;
  area: string;
  latitude: number;
  longitude: number;
}

export interface NewDonationInput {
  title: string;
  category: string;
  description: string;
  originalQuantity: number;
  unit: QuantityUnit;
  cookedAt: Date;
  expiresAt: Date;
  pickupWindow: PickupWindow;
  packaging: PackagingOption;
  allergens: AllergenOption[];
  location: DonationPrivateLocation;
}

/** Stored in stats/platform. Written only by the backend. */
export interface PlatformStats {
  mealsRescued: number;
  foodSavedKg: number;
  activeDonors: number;
}
