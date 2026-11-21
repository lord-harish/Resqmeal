import {
  NAME_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "@/constants/validation";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type RegisterFormField = "name" | "email" | "password" | "confirmPassword";
export type LoginFormField = "email" | "password";

export function validateEmail(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return "Please enter your email.";
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return "Please enter a valid email address.";
  }
  return null;
}

/** Used at sign-in: only checks presence; existing passwords are not re-validated. */
export function validatePassword(value: string): string | null {
  if (!value) {
    return "Please enter your password.";
  }
  return null;
}

/** Used at registration and password creation. */
export function validateNewPassword(value: string): string | null {
  if (value.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return "Password must include a letter and a number.";
  }
  return null;
}

export function validateName(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return "Please enter your name.";
  }
  if (trimmed.length > NAME_MAX_LENGTH) {
    return "Name is too long.";
  }
  return null;
}

export function validateConfirmPassword(password: string, confirm: string): string | null {
  if (!confirm) {
    return "Please confirm your password.";
  }
  if (password !== confirm) {
    return "Passwords do not match.";
  }
  return null;
}

export function validateRegisterForm(input: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}): Partial<Record<RegisterFormField, string>> {
  const errors: Partial<Record<RegisterFormField, string>> = {};

  const nameError = validateName(input.name);
  if (nameError) errors.name = nameError;

  const emailError = validateEmail(input.email);
  if (emailError) errors.email = emailError;

  const passwordError = validateNewPassword(input.password);
  if (passwordError) errors.password = passwordError;

  const confirmError = validateConfirmPassword(input.password, input.confirmPassword);
  if (confirmError) errors.confirmPassword = confirmError;

  return errors;
}

export function validateLoginForm(input: {
  email: string;
  password: string;
}): Partial<Record<LoginFormField, string>> {
  const errors: Partial<Record<LoginFormField, string>> = {};

  const emailError = validateEmail(input.email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(input.password);
  if (passwordError) errors.password = passwordError;

  return errors;
}
