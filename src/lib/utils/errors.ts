const AUTH_ERROR_MESSAGES: ReadonlyMap<string, string> = new Map<string, string>([
  ["auth/invalid-email", "Please enter a valid email address."],
  ["auth/user-not-found", "Incorrect email or password."],
  ["auth/wrong-password", "Incorrect email or password."],
  ["auth/invalid-credential", "Incorrect email or password."],
  ["auth/email-already-in-use", "An account with this email already exists."],
  ["auth/weak-password", "Please choose a stronger password."],
  ["auth/network-request-failed", "Network error. Check your connection and try again."],
  ["auth/too-many-requests", "Too many attempts. Please wait a few minutes and try again."],
  ["auth/popup-closed-by-user", "Google sign-in was cancelled."],
  ["auth/cancelled-popup-request", "Google sign-in was cancelled."],
  ["auth/user-disabled", "This account has been disabled."],
  ["auth/operation-not-allowed", "This sign-in method is not enabled yet."],
  ["auth/unauthorized-domain", "This domain is not authorised for sign-in."],
  ["auth/requires-recent-login", "Please sign in again to continue."],
]);

const DEFAULT_AUTH_MESSAGE = "Something went wrong. Please try again.";

export function getAuthErrorMessage(code: string): string {
  return AUTH_ERROR_MESSAGES.get(code) ?? DEFAULT_AUTH_MESSAGE;
}

export function getFirestoreErrorMessage(code: string): string {
  switch (code) {
    case "permission-denied":
      return "You do not have permission to do that.";
    case "unavailable":
      return "ResQMeal is temporarily unavailable. Please try again.";
    default:
      return "We could not save your changes. Please try again.";
  }
}

export function logTechnicalError(context: string, error: unknown): void {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[ResQMeal] ${context}`, error);
  }
}

export function extractErrorCode(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }
  return "unknown";
}
