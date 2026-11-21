"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button, Card, Input, PasswordInput } from "@/components/ui";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { loginWithEmail, loginWithGoogle } from "@/services/auth.service";
import { extractErrorCode, getAuthErrorMessage, logTechnicalError } from "@/lib/utils/errors";
import { validateLoginForm, type LoginFormField } from "@/lib/utils/validation";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { ROUTES } from "@/constants/routes";

export default function LoginPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<LoginFormField, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const { run: runEmailLogin, pending: emailPending } = useAsyncAction(
    async (emailValue: string, passwordValue: string): Promise<void> => {
      setFormError(null);
      try {
        await loginWithEmail(emailValue, passwordValue);
      } catch (err) {
        logTechnicalError("login", err);
        setFormError(getAuthErrorMessage(extractErrorCode(err)));
      }
    },
  );

  const { run: runGoogleLogin, pending: googlePending } = useAsyncAction(
    async (): Promise<void> => {
      setFormError(null);
      try {
        await loginWithGoogle();
      } catch (err) {
        logTechnicalError("login", err);
        setFormError(getAuthErrorMessage(extractErrorCode(err)));
      }
    },
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const errors = validateLoginForm({ email, password });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    void runEmailLogin(email, password);
  }

  const busy = emailPending || googlePending;

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
        <h1 className="text-3xl font-bold text-[#12372A]">Welcome back 👋</h1>
        <p className="text-[#64748B]">Log in to rescue food near you.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={fieldErrors.email}
        />
        <PasswordInput
          label="Password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password}
        />
        <div className="flex justify-end">
          <Link href={ROUTES.forgotPassword} className="text-sm font-medium text-[#16A34A] hover:underline">
            Forgot password?
          </Link>
        </div>

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
          loading={emailPending}
          loadingText="Logging in..."
          disabled={!isFirebaseConfigured || busy}
        >
          Log in
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-[#E2E8F0]" aria-hidden="true" />
        <span className="text-sm text-[#64748B]">OR</span>
        <span className="h-px flex-1 bg-[#E2E8F0]" aria-hidden="true" />
      </div>

      <Button
        type="button"
        variant="outline"
        fullWidth
        loading={googlePending}
        loadingText="Connecting to Google..."
        disabled={!isFirebaseConfigured || busy}
        onClick={() => void runGoogleLogin()}
      >
        Continue with Google
      </Button>

      <p className="text-center text-sm text-[#64748B]">
        Don&apos;t have an account?{" "}
        <Link href={ROUTES.register} className="font-medium text-[#16A34A] hover:underline">
          Create account
        </Link>
      </p>
    </div>
  );
}
