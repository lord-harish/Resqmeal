"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button, Card, Input } from "@/components/ui";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { sendPasswordReset } from "@/services/auth.service";
import { extractErrorCode, getAuthErrorMessage, logTechnicalError } from "@/lib/utils/errors";
import { validateEmail } from "@/lib/utils/validation";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { ROUTES } from "@/constants/routes";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState<string>("");
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState<boolean>(false);

  const { run: runReset, pending } = useAsyncAction(
    async (emailValue: string): Promise<void> => {
      setFormError(null);
      try {
        await sendPasswordReset(emailValue);
        setSent(true);
      } catch (err) {
        logTechnicalError("forgot-password", err);
        setFormError(getAuthErrorMessage(extractErrorCode(err)));
      }
    },
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const error = validateEmail(email);
    setEmailError(error ?? undefined);
    if (error) return;
    void runReset(email);
  }

  return (
    <div className="flex flex-col gap-6">
      {!isFirebaseConfigured ? (
        <Card className="border-[#F59E0B] bg-white p-4">
          <p className="text-sm text-[#334155]">
            ResQMeal is not configured yet. Copy .env.example to .env.local and add your Firebase settings.
          </p>
        </Card>
      ) : null}

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-[#12372A]">Reset your password</h1>
        <p className="text-[#64748B]">
          Enter your email and we will send you a link to reset your password.
        </p>
      </div>

      {sent ? (
        <div role="status">
          <Card className="flex flex-col gap-2 p-6">
            <h2 className="text-lg font-semibold text-[#12372A]">Check your email</h2>
            <p className="text-[#64748B]">
              If an account exists for that email, a reset link is on its way.
            </p>
          </Card>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={emailError}
          />

          {formError ? (
            <div
              role="alert"
              className="rounded-xl border border-[#DC2626] bg-white p-3 text-sm text-[#DC2626]"
            >
              {formError}
            </div>
          ) : null}

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={pending}
            loadingText="Sending reset email..."
            disabled={!isFirebaseConfigured || pending}
          >
            Send reset link
          </Button>
        </form>
      )}

      <p className="text-center text-sm text-[#64748B]">
        <Link href={ROUTES.login} className="font-medium text-[#16A34A] hover:underline">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
