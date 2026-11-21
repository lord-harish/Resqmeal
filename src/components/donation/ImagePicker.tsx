"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { DONATION_LIMITS } from "@/constants/donation";
import { cn } from "@/lib/utils/cn";
import { compressImage, validateImageFile } from "@/lib/utils/image";

export interface PickedImage {
  id: string;
  file: Blob;
  previewUrl: string;
  name: string;
}

export interface ImagePickerProps {
  images: PickedImage[];
  onChange: (next: PickedImage[]) => void;
  disabled?: boolean;
}

const CAP_MESSAGE = `You can add up to ${DONATION_LIMITS.MAX_IMAGES} photos.`;

export function ImagePicker({ images, onChange, disabled = false }: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previousRef = useRef<PickedImage[]>(images);
  const [isPreparing, setIsPreparing] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);

  const isFull = images.length >= DONATION_LIMITS.MAX_IMAGES;
  const controlsDisabled = disabled || isFull || isPreparing;

  // Revoke preview URLs of images that were removed since the last render.
  useEffect(() => {
    const currentIds = new Set(images.map((item) => item.id));
    for (const item of previousRef.current) {
      if (!currentIds.has(item.id)) {
        URL.revokeObjectURL(item.previewUrl);
      }
    }
    previousRef.current = images;
  }, [images]);

  async function handleSelect(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) {
      return;
    }

    const problems: string[] = [];
    const valid: File[] = [];
    for (const file of files) {
      const result = validateImageFile(file);
      if (result.ok) {
        valid.push(file);
      } else {
        problems.push(`${file.name}: ${result.message}`);
      }
    }

    const room = Math.max(0, DONATION_LIMITS.MAX_IMAGES - images.length);
    if (valid.length > room) {
      problems.push(CAP_MESSAGE);
    }
    const toProcess = valid.slice(0, room);
    setMessages(problems);
    if (toProcess.length === 0) {
      return;
    }

    setIsPreparing(true);
    const added: PickedImage[] = [];
    try {
      for (const file of toProcess) {
        try {
          const blob = await compressImage(file);
          added.push({
            id: crypto.randomUUID(),
            file: blob,
            previewUrl: URL.createObjectURL(blob),
            name: file.name,
          });
        } catch {
          problems.push(`${file.name}: Could not read this image.`);
        }
      }
    } finally {
      setIsPreparing(false);
    }

    setMessages(problems);
    if (added.length > 0) {
      onChange([...images, ...added]);
    }
  }

  function move(index: number, delta: -1 | 1) {
    const target = index + delta;
    const current = images[index];
    const other = images[target];
    if (!current || !other) {
      return;
    }
    const next = [...images];
    next[index] = other;
    next[target] = current;
    onChange(next);
  }

  function remove(id: string) {
    onChange(images.filter((item) => item.id !== id));
  }

  const buttonBase =
    "inline-flex min-h-[44px] items-center justify-center rounded-xl px-3 text-sm font-semibold transition-colors " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2 " +
    "disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="flex flex-col gap-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        disabled={controlsDisabled}
        onChange={handleSelect}
        aria-label="Choose photos"
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={controlsDisabled}
        className={cn(
          buttonBase,
          "w-full gap-2 border-2 border-dashed border-[#16A34A] bg-white py-6 text-base text-[#12372A] hover:bg-[#DCFCE7]/40",
        )}
      >
        <span aria-hidden="true">📷</span>
        Add photos
      </button>

      <p className="text-sm text-[#64748B]">
        {isFull
          ? CAP_MESSAGE
          : `${images.length} of ${DONATION_LIMITS.MAX_IMAGES} photos. The first photo is the cover.`}
      </p>

      {isPreparing ? (
        <p role="status" className="text-sm font-medium text-[#12372A]">
          Preparing photos...
        </p>
      ) : null}

      {messages.length > 0 ? (
        <div role="alert" className="flex flex-col gap-1 text-sm text-[#DC2626]">
          {messages.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      ) : null}

      {images.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((item, index) => {
            const position = index + 1;
            return (
              <li key={item.id} className="flex flex-col gap-2">
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.previewUrl}
                    alt={`Photo ${position}: ${item.name}`}
                    className="aspect-square w-full rounded-xl object-cover"
                  />
                  {index === 0 ? (
                    <span className="absolute left-2 top-2 rounded-full bg-[#12372A] px-2.5 py-0.5 text-xs font-semibold text-white">
                      Cover
                    </span>
                  ) : null}
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    type="button"
                    aria-label={`Move photo ${position} earlier`}
                    onClick={() => move(index, -1)}
                    disabled={disabled || index === 0}
                    className={cn(buttonBase, "border border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#DCFCE7]/40")}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    aria-label={`Move photo ${position} later`}
                    onClick={() => move(index, 1)}
                    disabled={disabled || index === images.length - 1}
                    className={cn(buttonBase, "border border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#DCFCE7]/40")}
                  >
                    →
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove photo ${position}`}
                    onClick={() => remove(item.id)}
                    disabled={disabled}
                    className={cn(buttonBase, "bg-[#FEE2E2] text-[#DC2626] hover:bg-[#fecaca]")}
                  >
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
