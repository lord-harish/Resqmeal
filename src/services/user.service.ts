import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  updateDoc,
  Timestamp,
  type DocumentData,
  type Firestore,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { logTechnicalError } from "@/lib/utils/errors";
import type { AuthUser } from "@/types/auth";
import type { UserProfile, UserProfileUpdate } from "@/types/user";

const USERS_COLLECTION = "users";

function requireDb(): Firestore {
  if (!db) {
    throw new Error("Firebase is not configured");
  }
  return db;
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

function toStringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function mapUserProfile(id: string, data: DocumentData): UserProfile {
  const badges: string[] = Array.isArray(data.badges)
    ? data.badges.filter((badge: unknown): badge is string => typeof badge === "string")
    : [];

  return {
    uid: id,
    name: toStringOrDefault(data.name),
    email: toStringOrDefault(data.email),
    profileImage: toStringOrNull(data.profileImage),
    phone: toStringOrNull(data.phone),
    createdAt: toDateOrNull(data.createdAt),
    updatedAt: toDateOrNull(data.updatedAt),
    rating: toNumber(data.rating),
    totalReviews: toNumber(data.totalReviews),
    completedDonations: toNumber(data.completedDonations),
    totalMealsDonated: toNumber(data.totalMealsDonated),
    totalMealsReceived: toNumber(data.totalMealsReceived),
    badges,
  };
}

/**
 * Idempotently creates the users/{uid} document. An existing document is
 * returned untouched (no write), so repeated sign-ins never duplicate or reset data.
 */
export async function createUserProfile(user: AuthUser, name?: string): Promise<UserProfile> {
  const firestore = requireDb();
  const ref = doc(firestore, USERS_COLLECTION, user.uid);

  await runTransaction(firestore, async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (snapshot.exists()) {
      return;
    }

    transaction.set(ref, {
      uid: user.uid,
      name: name ?? user.displayName ?? "",
      email: user.email ?? "",
      profileImage: user.photoURL ?? null,
      phone: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      rating: 0,
      totalReviews: 0,
      completedDonations: 0,
      totalMealsDonated: 0,
      totalMealsReceived: 0,
      badges: [],
    });
  });

  const profile = await getUserProfile(user.uid);
  if (!profile) {
    throw new Error("User profile could not be created.");
  }
  return profile;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(doc(requireDb(), USERS_COLLECTION, uid));
  const data = snapshot.data();
  if (!snapshot.exists() || !data) {
    return null;
  }
  return mapUserProfile(snapshot.id, data);
}

/**
 * Updates only client-editable fields (name, phone, profileImage).
 * Rating, badges and donation counters can never be written from the client.
 */
export async function updateUserProfile(uid: string, update: UserProfileUpdate): Promise<void> {
  const payload: DocumentData = { updatedAt: serverTimestamp() };

  if (update.name !== undefined) {
    const trimmedName = update.name.trim();
    if (!trimmedName) {
      throw new Error("Name cannot be empty.");
    }
    payload.name = trimmedName;
  }
  if (update.phone !== undefined) {
    payload.phone = update.phone;
  }
  if (update.profileImage !== undefined) {
    payload.profileImage = update.profileImage;
  }

  try {
    await updateDoc(doc(requireDb(), USERS_COLLECTION, uid), payload);
  } catch (error) {
    logTechnicalError("updateUserProfile", error);
    throw error;
  }
}
