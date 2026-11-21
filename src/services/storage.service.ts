import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
  type FirebaseStorage,
  type UploadTask,
} from "firebase/storage";
import { storage } from "@/lib/firebase/client";
import { logTechnicalError } from "@/lib/utils/errors";
import type { DonationImage } from "@/types/donation";

function requireStorage(): FirebaseStorage {
  if (!storage) {
    throw new Error("Firebase is not configured");
  }
  return storage;
}

export function donationImagePath(uid: string, donationId: string, index: number): string {
  return `users/${uid}/donations/${donationId}/${index}.jpg`;
}

export interface DonationImageUpload {
  promise: Promise<DonationImage>;
  cancel: () => void;
}

const UPLOAD_ERROR_MESSAGE = "Image upload failed. Please try again.";

export function uploadDonationImage(params: {
  uid: string;
  donationId: string;
  index: number;
  blob: Blob;
  onProgress?: (fraction: number) => void;
}): DonationImageUpload {
  const { uid, donationId, index, blob, onProgress } = params;
  const path = donationImagePath(uid, donationId, index);

  const task: UploadTask = uploadBytesResumable(ref(requireStorage(), path), blob, {
    contentType: "image/jpeg",
  });

  const promise = new Promise<DonationImage>((resolve, reject) => {
    task.on(
      "state_changed",
      (snapshot) => {
        if (onProgress && snapshot.totalBytes > 0) {
          onProgress(snapshot.bytesTransferred / snapshot.totalBytes);
        }
      },
      (error) => {
        logTechnicalError("uploadDonationImage", error);
        reject(new Error(UPLOAD_ERROR_MESSAGE));
      },
      () => {
        getDownloadURL(task.snapshot.ref)
          .then((url) => resolve({ url, path, order: index }))
          .catch((error: unknown) => {
            logTechnicalError("uploadDonationImage.getDownloadURL", error);
            reject(new Error(UPLOAD_ERROR_MESSAGE));
          });
      },
    );
  });

  return {
    promise,
    cancel: () => {
      task.cancel();
    },
  };
}

export async function deleteDonationImage(path: string): Promise<void> {
  try {
    await deleteObject(ref(requireStorage(), path));
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "storage/object-not-found") {
      return;
    }
    logTechnicalError("deleteDonationImage", error);
    throw error;
  }
}
