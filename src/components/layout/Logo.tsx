import { cn } from "@/lib/utils/cn";

export interface LogoProps {
  variant?: "mark" | "full" | "light";
  className?: string;
}

export function Logo({ variant = "full", className }: LogoProps) {
  if (variant === "mark") {
    return (
      <img
        src="/logo_resqmeal.png"
        alt="ResQMeal logo"
        className={cn("h-9 w-9", className)}
      />
    );
  }

  const isLight = variant === "light";
  const image = (
    <img
      src="/logo_resqmeal.png"
      alt=""
      aria-hidden="true"
      className="h-9 w-9 shrink-0"
    />
  );

  return (
    <span className={cn("flex items-center gap-2", className)}>
      {isLight ? <span className="rounded-xl bg-[#FFFFFF] p-1">{image}</span> : image}
      <span className={cn("font-bold", isLight ? "text-[#FFFFFF]" : "text-[#12372A]")}>
        ResQMeal
      </span>
    </span>
  );
}
