import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { Spinner } from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "outline" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
}

const baseClasses =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl font-semibold transition-colors " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-[#16A34A] text-white hover:bg-[#15803D]",
  secondary: "bg-[#DCFCE7] text-[#12372A] hover:bg-[#bbf7d0]",
  outline: "border border-[#E2E8F0] bg-white text-[#12372A] hover:bg-[#DCFCE7]/40",
  danger: "bg-[#DC2626] text-white hover:bg-[#b91c1c] focus-visible:ring-[#DC2626]",
  ghost: "bg-transparent text-[#12372A] hover:bg-[#DCFCE7]/50",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-2.5 text-base",
  lg: "px-6 py-3 text-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    loadingText,
    fullWidth = false,
    disabled,
    className,
    type = "button",
    children,
    ...props
  },
  ref,
) {
  const isDisabled = Boolean(disabled) || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading ? "true" : undefined}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {loading ? <Spinner className="h-4 w-4" /> : null}
      {loading ? (loadingText ?? children) : children}
    </button>
  );
});
