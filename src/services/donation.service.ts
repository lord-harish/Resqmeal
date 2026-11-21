import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type Firestore,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import {
  ALLERGEN_OPTIONS,
  DONATION_LIMITS,
  PACKAGING_OPTIONS,
  QUANTITY_UNITS,
  type AllergenOption,
  type DonationStatus,
  type PackagingOption,
  type QuantityUnit,
} from "@/constants/donation";
import { logTechnicalError } from "@/lib/utils/errors";
import { roundCoordinate } from "@/lib/utils/distance";
import type {
  ApproximateLocation,
  Donation,
  DonationImage,
  DonationPrivateLocation,
  NewDonationInput,
  PickupWindow,
} from "@/types/donation";

/** The ONLY module that touches the donations collection. */

const DONATIONS = "donations";
const PRIVATE_LOCATION_SUBPATH = ["private", "location"] as const;

function requireDb(): Firestore {
  if (!db) {
    throw new Error("Firebase is not configured");
  }
  return db;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toDateOrNull(value: unknown): Date | null {
  return value instanceof Timestamp ? value.toDate() : null;
}

function toNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function toStringOrDefault(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function pickOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === "string" && (options as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

function mapImages(value: unknown): DonationImage[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const images: DonationImage[] = [];
  for (const item of value) {
    if (!isRecord(item)) {
      continue;
    }
    const url = item.url;
    const path = item.path;
    if (typeof url === "string" && typeof path === "string") {
      images.push({ url, path, order: toNumber(item.order) });
    }
  }
  return images;
}

function mapAllergens(value: unknown): AllergenOption[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(
    (item): item is AllergenOption =>
      typeof item === "string" && (ALLERGEN_OPTIONS as readonly string[]).includes(item),
  );
}

function mapApproxLocation(value: unknown): ApproximateLocation {
  const data: Record<string, unknown> = isRecord(value) ? value : {};
  return {
    area: toStringOrDefault(data.area),
    latitude: toNumber(data.latitude),
    longitude: toNumber(data.longitude),
  };
}

function mapPickupWindow(value: unknown): PickupWindow {
  const data: Record<string, unknown> = isRecord(value) ? value : {};
  // Pickup windows are always written by createDonation; the epoch fallback only covers malformed docs.
  const epoch = new Date(0);
  return {
    from: toDateOrNull(data.from) ?? epoch,
    until: toDateOrNull(data.until) ?? epoch,
  };
}

function isPermissionDenied(error: unknown): boolean {
  return isRecord(error) && error.code === "permission-denied";
}

/**
 * Stored status is AVAILABLE until expiry; once expiresAt has passed it is
 * effectively EXPIRED. Status is never written back by the client.
 */
export function getEffectiveStatus(
  donation: Pick<Donation, "status" | "expiresAt">,
  now: Date = new Date(),
): DonationStatus {
  if (
    donation.status === "AVAILABLE" &&
    donation.expiresAt !== null &&
    donation.expiresAt.getTime() <= now.getTime()
  ) {
    return "EXPIRED";
  }
  return donation.status;
}

/** Generates a Firestore document id client-side so image storage paths can use it. */
export function newDonationId(): string {
  return doc(collection(requireDb(), DONATIONS)).id;
}

function validateNewDonation(input: NewDonationInput, now: Date): {
  title: string;
  description: string;
} {
  const title = input.title.trim();
  const description = input.description.trim();

  if (!title) {
    throw new Error("Please enter a title for your donation.");
  }
  if (title.length > DONATION_LIMITS.TITLE_MAX) {
    throw new Error(`Title must be ${DONATION_LIMITS.TITLE_MAX} characters or fewer.`);
  }
  if (description.length > DONATION_LIMITS.DESCRIPTION_MAX) {
    throw new Error(`Description must be ${DONATION_LIMITS.DESCRIPTION_MAX} characters or fewer.`);
  }
  if (!Number.isInteger(input.originalQuantity) || input.originalQuantity <= 0) {
    throw new Error("Quantity must be a whole number greater than zero.");
  }
  if (input.originalQuantity > DONATION_LIMITS.MAX_QUANTITY) {
    throw new Error(`Quantity cannot exceed ${DONATION_LIMITS.MAX_QUANTITY}.`);
  }
  if (input.expiresAt.getTime() <= input.cookedAt.getTime()) {
    throw new Error("Expiry time must be after the cooked time.");
  }
  if (input.expiresAt.getTime() <= now.getTime()) {
    throw new Error("Expiry time must be in the future.");
  }
  if (input.pickupWindow.from.getTime() >= input.pickupWindow.until.getTime()) {
    throw new Error("Pickup end time must be after the start time.");
  }
  if (input.pickupWindow.until.getTime() > input.expiresAt.getTime()) {
    throw new Error("Pickup must finish before the food expires.");
  }

  return { title, description };
}

/**
 * Writes the public donation document and the donor-only private location in one batch,
 * so both succeed or fail together.
 */
export async function createDonation(
  donationId: string,
  donor: { uid: string; name: string; rating: number },
  input: NewDonationInput,
  images: DonationImage[],
): Promise<void> {
  const firestore = requireDb();
  const { title, description } = validateNewDonation(input, new Date());

  const area = input.location.area.trim();
  const displayAddress = input.location.displayAddress.trim();

  const batch = writeBatch(firestore);

  batch.set(doc(firestore, DONATIONS, donationId), {
    id: donationId,
    donorId: donor.uid,
    donorName: donor.name.trim(),
    donorRating: donor.rating,
    title,
    category: input.category,
    description,
    images,
    originalQuantity: input.originalQuantity,
    availableQuantity: input.originalQuantity,
    unit: input.unit,
    cookedAt: Timestamp.fromDate(input.cookedAt),
    expiresAt: Timestamp.fromDate(input.expiresAt),
    approxLocation: {
      area,
      latitude: roundCoordinate(input.location.latitude),
      longitude: roundCoordinate(input.location.longitude),
    },
    pickupWindow: {
      from: Timestamp.fromDate(input.pickupWindow.from),
      until: Timestamp.fromDate(input.pickupWindow.until),
    },
    packaging: input.packaging,
    allergens: input.allergens,
    status: "AVAILABLE",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  batch.set(doc(firestore, DONATIONS, donationId, ...PRIVATE_LOCATION_SUBPATH), {
    displayAddress,
    area,
    latitude: input.location.latitude,
    longitude: input.location.longitude,
  });

  try {
    await batch.commit();
  } catch (error) {
    logTechnicalError("createDonation", error);
    throw new Error("Could not publish your donation. Please try again.");
  }
}

/** Converts raw Firestore data into a Donation, tolerating missing or malformed fields. */
export function mapDonation(id: string, data: DocumentData): Donation {
  return {
    id,
    donorId: toStringOrDefault(data.donorId),
    donorName: toStringOrDefault(data.donorName),
    donorRating: toNumber(data.donorRating),
    title: toStringOrDefault(data.title),
    category: toStringOrDefault(data.category),
    description: toStringOrDefault(data.description),
    images: mapImages(data.images),
    originalQuantity: toNumber(data.originalQuantity),
    availableQuantity: toNumber(data.availableQuantity),
    unit: pickOption<QuantityUnit>(data.unit, QUANTITY_UNITS, "Other"),
    cookedAt: toDateOrNull(data.cookedAt),
    expiresAt: toDateOrNull(data.expiresAt),
    approxLocation: mapApproxLocation(data.approxLocation),
    pickupWindow: mapPickupWindow(data.pickupWindow),
    packaging: pickOption<PackagingOption>(data.packaging, PACKAGING_OPTIONS, "Other"),
    allergens: mapAllergens(data.allergens),
    // Unknown stored status is shown as CANCELLED so it is never presented as available.
    status: pickOption<DonationStatus>(data.status, ["AVAILABLE", "EXPIRED", "CANCELLED"], "CANCELLED"),
    createdAt: toDateOrNull(data.createdAt),
    updatedAt: toDateOrNull(data.updatedAt),
  };
}

export async function getDonation(id: string): Promise<Donation | null> {
  const snapshot = await getDoc(doc(requireDb(), DONATIONS, id));
  const data = snapshot.data();
  if (!snapshot.exists() || !data) {
    return null;
  }
  return mapDonation(snapshot.id, data);
}

export async function getAvailableDonations(options?: { limit?: number }): Promise<Donation[]> {
  const donationsQuery = query(
    collection(requireDb(), DONATIONS),
    where("status", "==", "AVAILABLE"),
    where("expiresAt", ">", Timestamp.now()),
    orderBy("expiresAt", "asc"),
    limit(options?.limit ?? DONATION_LIMITS.EXPLORE_FETCH_LIMIT),
  );

  const snapshot = await getDocs(donationsQuery);
  const now = new Date();

  return snapshot.docs
    .map((item) => mapDonation(item.id, item.data()))
    .filter((donation) => getEffectiveStatus(donation, now) === "AVAILABLE");
}

export async function getDonationsByDonor(
  donorId: string,
  options?: { limit?: number },
): Promise<Donation[]> {
  const donationsQuery = query(
    collection(requireDb(), DONATIONS),
    where("donorId", "==", donorId),
    orderBy("createdAt", "desc"),
    limit(options?.limit ?? 100),
  );

  const snapshot = await getDocs(donationsQuery);
  return snapshot.docs.map((item) => mapDonation(item.id, item.data()));
}

export async function cancelDonation(id: string, donorId: string): Promise<void> {
  const firestore = requireDb();
  const ref = doc(firestore, DONATIONS, id);

  const snapshot = await getDoc(ref);
  const data = snapshot.data();
  if (!snapshot.exists() || !data) {
    throw new Error("This donation no longer exists.");
  }

  const donation = mapDonation(snapshot.id, data);
  if (donation.donorId !== donorId) {
    throw new Error("You can only cancel your own donations.");
  }
  if (getEffectiveStatus(donation) !== "AVAILABLE") {
    throw new Error("Only available donations can be cancelled.");
  }

  await updateDoc(ref, { status: "CANCELLED", updatedAt: serverTimestamp() });
}

/**
 * Reads the exact pickup location. Returns null when missing or when the caller
 * is not the donor (permission-denied).
 */
export async function getDonationPrivateLocation(
  id: string,
): Promise<DonationPrivateLocation | null> {
  try {
    const snapshot = await getDoc(
      doc(requireDb(), DONATIONS, id, ...PRIVATE_LOCATION_SUBPATH),
    );
    const data = snapshot.data();
    if (!snapshot.exists() || !data) {
      return null;
    }
    return {
      displayAddress: toStringOrDefault(data.displayAddress),
      area: toStringOrDefault(data.area),
      latitude: toNumber(data.latitude),
      longitude: toNumber(data.longitude),
    };
  } catch (error) {
    if (isPermissionDenied(error)) {
      return null;
    }
    throw error;
  }
}
