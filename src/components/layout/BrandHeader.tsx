import { cn } from "@/lib/utils/cn";
import { Logo } from "./Logo";

export interface BrandHeaderProps {
  className?: string;
}

export function BrandHeader({ className }: BrandHeaderProps) {
  return (
    <header className={cn("flex flex-wrap items-center justify-between gap-2 px-4 py-3", className)}>
      <Logo variant="full" />
      <p className="text-sm text-[#64748B]">Rescue Food. Reduce Waste.</p>
    </header>
  );
}
