"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import type { DonationImage } from "@/types/donation";

export interface DonationGalleryProps {
  images: DonationImage[];
  title: string;
}

function EmptyGallery() {
  return (
    <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-2xl bg-[#DCFCE7] text-[#12372A]">
      <span aria-hidden="true" className="text-5xl">
        🍽️
      </span>
      <p className="text-sm font-medium">No photos added</p>
    </div>
  );
}

export function DonationGallery({ images, title }: DonationGalleryProps) {
  const [selected, setSelected] = useState(0);

  if (images.length === 0) {
    return <EmptyGallery />;
  }

  const total = images.length;
  const index = Math.min(selected, total - 1);
  const current = images[index];
  if (!current) {
    return <EmptyGallery />;
  }

  return (
    <div className="flex flex-col gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={current.url}
        alt={`${title} photo ${index + 1} of ${total}`}
        className="aspect-[4/3] w-full rounded-2xl object-cover"
      />

      {total > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, position) => {
            const isSelected = position === index;
            return (
              <button
                key={`${image.path}-${position}`}
                type="button"
                aria-label={`Show photo ${position + 1}`}
                aria-current={isSelected ? "true" : undefined}
                onClick={() => setSelected(position)}
                className={cn(
                  "h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2",
                  isSelected ? "border-[#16A34A]" : "border-transparent hover:border-[#E2E8F0]",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt="" className="h-full w-full object-cover" />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
