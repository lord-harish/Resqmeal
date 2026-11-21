import { ACCEPTED_IMAGE_TYPES, DONATION_LIMITS } from "@/constants/donation";

export type ImageValidationResult = { ok: true } | { ok: false; message: string };

const READ_ERROR_MESSAGE = "Could not read this image.";

interface LoadedImage {
  source: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
}

export function validateImageFile(file: File): ImageValidationResult {
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, message: "Please choose a JPG, PNG or WEBP image." };
  }
  if (file.size > DONATION_LIMITS.MAX_INPUT_FILE_BYTES) {
    return { ok: false, message: "Image must be under 15 MB." };
  }
  return { ok: true };
}

async function loadWithImageElement(file: File): Promise<LoadedImage> {
  if (typeof Image === "undefined" || typeof URL === "undefined") {
    throw new Error(READ_ERROR_MESSAGE);
  }

  const url = URL.createObjectURL(file);
  const img = new Image();

  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(READ_ERROR_MESSAGE));
      img.src = url;
    });
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }

  return {
    source: img,
    width: img.naturalWidth,
    height: img.naturalHeight,
    release: () => URL.revokeObjectURL(url),
  };
}

async function loadImage(file: File): Promise<LoadedImage> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        release: () => bitmap.close(),
      };
    } catch {
      // Fall through to the HTMLImageElement path.
    }
  }
  return loadWithImageElement(file);
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error(READ_ERROR_MESSAGE))),
      "image/jpeg",
      quality,
    );
  });
}

/**
 * Scales the image so its longest edge is at most maxEdge and exports it as a JPEG blob.
 * Browser-only.
 */
export async function compressImage(file: File, maxEdge = 1280, quality = 0.8): Promise<Blob> {
  if (typeof document === "undefined") {
    throw new Error(READ_ERROR_MESSAGE);
  }

  let loaded: LoadedImage | null = null;
  try {
    loaded = await loadImage(file);
    if (loaded.width <= 0 || loaded.height <= 0) {
      throw new Error(READ_ERROR_MESSAGE);
    }

    const scale = Math.min(1, maxEdge / Math.max(loaded.width, loaded.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(loaded.width * scale));
    canvas.height = Math.max(1, Math.round(loaded.height * scale));

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error(READ_ERROR_MESSAGE);
    }
    context.drawImage(loaded.source, 0, 0, canvas.width, canvas.height);

    return await canvasToBlob(canvas, quality);
  } catch {
    throw new Error(READ_ERROR_MESSAGE);
  } finally {
    loaded?.release();
  }
}
