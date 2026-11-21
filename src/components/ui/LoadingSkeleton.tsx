import { cn } from "@/lib/utils/cn";
import { Card } from "./Card";

export function LoadingSkeleton({ className, lines = 3 }: { className?: string; lines?: number }) {
  return (
    <div role="status" aria-label="Loading" className={cn("flex w-full animate-pulse flex-col gap-3", className)}>
      {Array.from({ length: lines }, (_, index) => (
        <div
          key={index}
          className={cn("h-4 rounded-md bg-[#E2E8F0]", index === lines - 1 && lines > 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <Card className="p-6">
      <LoadingSkeleton lines={3} />
    </Card>
  );
}
