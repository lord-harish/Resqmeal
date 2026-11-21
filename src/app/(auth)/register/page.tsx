"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button, Card, Input, PasswordInput } from "@/components/ui";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { registerWithEmail, loginWithGoogle } from "@/services/auth.service";
import { extractErrorCode, getAuthErrorMessage, logTechnicalError } from "@/lib/utils/errors";
import { validateRegisterForm, type RegisterFormField } from "@/lib/utils/validation";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { ROUTES } from "@/constants/routes";

export default function RegisterPage() {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<RegisterFormField, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const { run: runRegister, pending: registerPending } = useAsyncAction(
    async (nameValue: string, emailValue: string, passwordValue: string): Promise<void> => {
      setFormError(null);
      try {
        await registerWithEmail(nameValue, emailValue, passwordValue);
      } catch (err) {
        logTechnicalError("register", err);
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
        logTechnicalError("register", err);
        setFormError(getAuthErrorMessage(extractErrorCode(err)));
      }
    },
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const errors = validateRegisterForm({ name, email, password, confirmPassword });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    void runRegister(name, email, password);
  }

  const busy = registerPending || googlePending;

  return (
    <div className="flex flex-col gap-6">
      {!isFirebaseConfigured ? (
        <Card className="border-[#F59E0B] bg-white p-4">
          <p className="text-sm text-[#334155]">
            ResQMeal is not configured yet. Copy .env.example to .env.local and add your Firebase settings.
          </p>
        </Card>
      ) : null}

      <h1 className="text-3xl font-bold text-[#12372A]">Create your account</h1>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Input
          label="Name"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={fieldErrors.name}
        />
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
          autoComplete="new-password"
          hint="At least 8 characters with a letter and a number."
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password}
        />
        <PasswordInput
          label="Confirm Password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          error={fieldErrors.confirmPassword}
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
          loading={registerPending}
          loadingText="Creating account..."
          disabled={!isFirebaseConfigured || busy}
        >
          Create Account
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
        Already have an account?{" "}
        <Link href={ROUTES.login} className="font-medium text-[#16A34A] hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
