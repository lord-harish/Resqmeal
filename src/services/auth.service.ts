import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  type Auth,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { extractErrorCode, logTechnicalError } from "@/lib/utils/errors";
import type { AuthUser } from "@/types/auth";

export function toAuthUser(user: User): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
}

function requireAuth(): Auth {
  if (!auth) {
    throw new Error("Firebase is not configured");
  }
  return auth;
}

// Services throw raw Firebase errors; the UI maps them with getAuthErrorMessage(extractErrorCode(err)).

export async function registerWithEmail(name: string, email: string, password: string): Promise<AuthUser> {
  try {
    const credential = await createUserWithEmailAndPassword(requireAuth(), email.trim(), password);
    await updateProfile(credential.user, { displayName: name.trim() });
    return toAuthUser(credential.user);
  } catch (error) {
    logTechnicalError("registerWithEmail", error);
    throw error;
  }
}

export async function loginWithEmail(email: string, password: string): Promise<AuthUser> {
  try {
    const credential = await signInWithEmailAndPassword(requireAuth(), email.trim(), password);
    return toAuthUser(credential.user);
  } catch (error) {
    logTechnicalError("loginWithEmail", error);
    throw error;
  }
}

export async function loginWithGoogle(): Promise<AuthUser> {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const credential = await signInWithPopup(requireAuth(), provider);
    return toAuthUser(credential.user);
  } catch (error) {
    logTechnicalError("loginWithGoogle", error);
    throw error;
  }
}

/** Resolves normally for unknown emails so the UI cannot be used to enumerate accounts. */
export async function sendPasswordReset(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(requireAuth(), email.trim());
  } catch (error) {
    if (extractErrorCode(error) === "auth/user-not-found") {
      return;
    }
    logTechnicalError("sendPasswordReset", error);
    throw error;
  }
}

export async function logout(): Promise<void> {
  try {
    await signOut(requireAuth());
  } catch (error) {
    logTechnicalError("logout", error);
    throw error;
  }
}
