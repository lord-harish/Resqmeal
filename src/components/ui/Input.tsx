import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  endAdornment?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, endAdornment, id, className, disabled, "aria-describedby": ariaDescribedBy, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [ariaDescribedBy, hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-[#334155]">
        {label}
      </label>
      <div
        className={cn(
          "flex min-h-[44px] items-center rounded-xl border bg-white px-3 transition-colors",
          "focus-within:ring-2 focus-within:ring-[#16A34A] focus-within:ring-offset-1",
          error ? "border-[#DC2626]" : "border-[#E2E8F0]",
          disabled && "cursor-not-allowed bg-[#f1f5f9] opacity-60",
        )}
      >
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "min-h-[44px] w-full min-w-0 bg-transparent text-base text-[#334155] placeholder:text-[#64748B]",
            "focus:outline-none disabled:cursor-not-allowed",
            className,
          )}
          {...props}
        />
        {endAdornment}
      </div>
      {hint ? (
        <p id={hintId} className="text-sm text-[#64748B]">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-sm text-[#DC2626]">
          {error}
        </p>
      ) : null}
    </div>
  );
});
