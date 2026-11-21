import { DONATION_CATEGORIES } from "@/constants/donation";
import { cn } from "@/lib/utils/cn";

export interface CategoryChipOption {
  id: string;
  label: string;
}

const CHIP_OPTIONS: readonly CategoryChipOption[] = [
  { id: "all", label: "All" },
  ...DONATION_CATEGORIES,
];

export interface CategoryChipsProps {
  value: string;
  onChange: (id: string) => void;
}

export function CategoryChips({ value, onChange }: CategoryChipsProps) {
  return (
    <div role="group" aria-label="Filter by category" className="flex gap-2 overflow-x-auto pb-1">
      {CHIP_OPTIONS.map((option) => {
        const selected = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.id)}
            className={cn(
              "inline-flex min-h-[40px] shrink-0 items-center rounded-full border px-4 text-sm font-semibold transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2",
              selected
                ? "border-[#12372A] bg-[#12372A] text-white"
                : "border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#DCFCE7]/50",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
