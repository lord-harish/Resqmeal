import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  query,
  Timestamp,
  where,
  type Firestore,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { logTechnicalError } from "@/lib/utils/errors";
import type { PlatformStats } from "@/types/donation";

const DONATIONS = "donations";
const STATS_COLLECTION = "stats";
const PLATFORM_STATS_DOC = "platform";

function requireDb(): Firestore {
  if (!db) {
    throw new Error("Firebase is not configured");
  }
  return db;
}

function toNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

const EMPTY_PLATFORM_STATS: PlatformStats = { mealsRescued: 0, foodSavedKg: 0, activeDonors: 0 };

/** Reads stats/platform (written only by the backend). Falls back to zeros on any failure. */
export async function getPlatformStats(): Promise<PlatformStats> {
  try {
    const snapshot = await getDoc(doc(requireDb(), STATS_COLLECTION, PLATFORM_STATS_DOC));
    const data = snapshot.data();
    if (!snapshot.exists() || !data) {
      return { ...EMPTY_PLATFORM_STATS };
    }
    return {
      mealsRescued: toNumber(data.mealsRescued),
      foodSavedKg: toNumber(data.foodSavedKg),
      activeDonors: toNumber(data.activeDonors),
    };
  } catch (error) {
    logTechnicalError("getPlatformStats", error);
    return { ...EMPTY_PLATFORM_STATS };
  }
}

/** Upper bound on documents read when summing servings; keeps the read cost predictable. */
const SUMMARY_SAMPLE_LIMIT = 500;

/**
 * Counts currently available listings and sums their remaining servings.
 * The count uses a server-side count query (getCountFromServer). The serving sum is computed
 * client-side from up to SUMMARY_SAMPLE_LIMIT documents. Needs a composite index (status + expiresAt).
 */
export async function getAvailableMealsSummary(): Promise<{
  activeListings: number;
  availableServings: number;
}> {
  try {
    const availableQuery = query(
      collection(requireDb(), DONATIONS),
      where("status", "==", "AVAILABLE"),
      where("expiresAt", ">", Timestamp.now()),
    );
    const countSnapshot = await getCountFromServer(availableQuery);
    const activeListings = toNumber(countSnapshot.data().count);

    const listingsSnapshot = await getDocs(query(availableQuery, limit(SUMMARY_SAMPLE_LIMIT)));
    let availableServings = 0;
    listingsSnapshot.forEach((listing) => {
      availableServings += toNumber(listing.data().availableQuantity);
    });

    return { activeListings, availableServings };
  } catch (error) {
    logTechnicalError("getAvailableMealsSummary", error);
    return { activeListings: 0, availableServings: 0 };
  }
}
