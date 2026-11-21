"use client";

import { forwardRef, useState } from "react";
import { Input, type InputProps } from "./Input";

export type PasswordInputProps = Omit<InputProps, "type" | "endAdornment">;

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  { disabled, ...props },
  ref,
) {
  const [visible, setVisible] = useState(false);

  return (
    <Input
      ref={ref}
      {...props}
      disabled={disabled}
      type={visible ? "text" : "password"}
      endAdornment={
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          disabled={disabled}
          className="ml-2 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg px-2 text-sm font-semibold text-[#12372A] hover:bg-[#DCFCE7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {visible ? "Hide" : "Show"}
        </button>
      }
    />
  );
});
