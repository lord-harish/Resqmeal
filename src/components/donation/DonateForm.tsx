"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { Button, Card, Input, Select, Textarea, type SelectOption } from "@/components/ui";
import { ImagePicker, LocationSelector, type LocationValue, type PickedImage } from "@/components/donation";
import {
  ALLERGEN_OPTIONS,
  DONATION_CATEGORIES,
  DONATION_LIMITS,
  PACKAGING_OPTIONS,
  PHOTO_UPLOADS_ENABLED,
  QUANTITY_UNITS,
  type AllergenOption,
  type PackagingOption,
  type QuantityUnit,
} from "@/constants/donation";
import { cn } from "@/lib/utils/cn";
import { fromDateTimeLocalValue } from "@/lib/utils/datetime";
import { extractErrorCode, getFirestoreErrorMessage, logTechnicalError } from "@/lib/utils/errors";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { createDonation, newDonationId } from "@/services/donation.service";
import { uploadDonationImage } from "@/services/storage.service";
import type { DonationImage, NewDonationInput } from "@/types/donation";

type DraftErrors = Partial<Record<string, string>>;

interface DonationDraft {
  title: string;
  category: string;
  description: string;
  quantity: string;
  unit: QuantityUnit;
  cookedAt: string;
  expiresAt: string;
  location: LocationValue;
  pickupFrom: string;
  pickupUntil: string;
  packaging: PackagingOption;
  allergens: AllergenOption[];
}

/** Field keys in on-screen order; used to focus the first invalid field. */
const FIELD_ORDER = [
  "title",
  "category",
  "quantity",
  "cookedAt",
  "expiresAt",
  "location",
  "pickupFrom",
  "pickupUntil",
] as const;

const NONE_ALLERGEN: AllergenOption = "None specified";

const CATEGORY_OPTIONS: SelectOption[] = [
  { value: "", label: "Choose a category" },
  ...DONATION_CATEGORIES.map((category) => ({ value: category.id, label: category.label })),
];
const UNIT_OPTIONS: SelectOption[] = QUANTITY_UNITS.map((unit) => ({ value: unit, label: unit }));
const PACKAGING_SELECT_OPTIONS: SelectOption[] = PACKAGING_OPTIONS.map((option) => ({
  value: option,
  label: option,
}));

function createInitialDraft(): DonationDraft {
  return {
    title: "",
    category: "",
    description: "",
    quantity: "",
    unit: QUANTITY_UNITS[0],
    cookedAt: "",
    expiresAt: "",
    location: { latitude: null, longitude: null, area: "", displayAddress: "" },
    pickupFrom: "",
    pickupUntil: "",
    packaging: PACKAGING_OPTIONS[0],
    allergens: [],
  };
}

/** Pure validation. Returns one message per invalid field key; an empty object means valid. */
export function validateDonationDraft(draft: DonationDraft, now: Date = new Date()): DraftErrors {
  const errors: DraftErrors = {};

  if (!draft.title.trim()) {
    errors.title = "Enter a name for the food.";
  }
  if (!draft.category) {
    errors.category = "Choose a category.";
  }

  const quantity = Number(draft.quantity);
  if (!draft.quantity.trim() || !Number.isInteger(quantity) || quantity < 1) {
    errors.quantity = "Enter a whole number, 1 or more.";
  } else if (quantity > DONATION_LIMITS.MAX_QUANTITY) {
    errors.quantity = `Quantity cannot exceed ${DONATION_LIMITS.MAX_QUANTITY}.`;
  }

  const cookedAt = fromDateTimeLocalValue(draft.cookedAt);
  const expiresAt = fromDateTimeLocalValue(draft.expiresAt);
  if (!cookedAt) {
    errors.cookedAt = "Enter when the food was prepared or cooked.";
  }
  if (!expiresAt) {
    errors.expiresAt = "Enter the expiry date and time.";
  } else if (cookedAt && expiresAt.getTime() <= cookedAt.getTime()) {
    errors.expiresAt = "Expiry must be after the cooked time.";
  } else if (expiresAt.getTime() <= now.getTime()) {
    errors.expiresAt = "Expiry time must be in the future.";
  }

  const { location } = draft;
  if (location.latitude === null || location.longitude === null) {
    errors.location = "Use your current location so people can find the pickup point.";
  } else if (!location.area.trim() || !location.displayAddress.trim()) {
    errors.location = "Enter the pickup area and full address.";
  }

  const pickupFrom = fromDateTimeLocalValue(draft.pickupFrom);
  const pickupUntil = fromDateTimeLocalValue(draft.pickupUntil);
  if (!pickupFrom) {
    errors.pickupFrom = "Enter when pickup starts.";
  }
  if (!pickupUntil) {
    errors.pickupUntil = "Enter when pickup ends.";
  } else if (pickupFrom && pickupFrom.getTime() >= pickupUntil.getTime()) {
    errors.pickupUntil = "Pickup start must be before pickup end.";
  } else if (expiresAt && pickupUntil.getTime() > expiresAt.getTime()) {
    errors.pickupUntil = "Pickup must end before the food expires.";
  }

  return errors;
}

function buildDonationInput(draft: DonationDraft): NewDonationInput | null {
  const cookedAt = fromDateTimeLocalValue(draft.cookedAt);
  const expiresAt = fromDateTimeLocalValue(draft.expiresAt);
  const pickupFrom = fromDateTimeLocalValue(draft.pickupFrom);
  const pickupUntil = fromDateTimeLocalValue(draft.pickupUntil);
  const { latitude, longitude } = draft.location;

  if (!cookedAt || !expiresAt || !pickupFrom || !pickupUntil || latitude === null || longitude === null) {
    return null;
  }

  return {
    title: draft.title.trim(),
    category: draft.category,
    description: draft.description.trim(),
    originalQuantity: Number(draft.quantity),
    unit: draft.unit,
    cookedAt,
    expiresAt,
    pickupWindow: { from: pickupFrom, until: pickupUntil },
    packaging: draft.packaging,
    allergens: draft.allergens,
    location: {
      displayAddress: draft.location.displayAddress.trim(),
      area: draft.location.area.trim(),
      latitude,
      longitude,
    },
  };
}

interface PublishParams {
  input: NewDonationInput;
  images: PickedImage[];
  donor: { uid: string; name: string; rating: number };
  onProgress: (text: string) => void;
}

/** Uploads photos in order, then writes the donation. Returns the new donation id. */
async function publishDonation({ input, images, donor, onProgress }: PublishParams): Promise<string> {
  const donationId = newDonationId();
  const uploaded: DonationImage[] = [];

  if (PHOTO_UPLOADS_ENABLED && images.length > 0) {
    onProgress("Uploading images...");
    for (let index = 0; index < images.length; index += 1) {
      const image = images[index];
      if (!image) {
        continue;
      }
      onProgress(`Uploading photo ${index + 1} of ${images.length}…`);
      const upload = uploadDonationImage({
        uid: donor.uid,
        donationId,
        index,
        blob: image.file,
      });
      uploaded.push(await upload.promise);
    }
  }

  onProgress("Creating donation...");
  // Photos uploaded before a failure are left in place; cleaning them up is a later enhancement.
  await createDonation(donationId, donor, input, uploaded);
  return donationId;
}

function toPublishMessage(error: unknown): string {
  const code = extractErrorCode(error);
  // Our services throw plain Errors with friendly text; Firebase errors carry a code.
  if (error instanceof Error && code === "unknown") {
    return error.message;
  }
  logTechnicalError("createDonation", error);
  return getFirestoreErrorMessage(code);
}

function toggleAllergen(
  current: AllergenOption[],
  option: AllergenOption,
  checked: boolean,
): AllergenOption[] {
  if (option === NONE_ALLERGEN) {
    return checked ? [NONE_ALLERGEN] : [];
  }
  const others = current.filter((item) => item !== NONE_ALLERGEN && item !== option);
  return checked ? [...others, option] : others;
}

function errorId(key: string): string {
  return `donate-${key}-error`;
}

function fieldA11y(errors: DraftErrors, key: string): { "aria-invalid"?: boolean; "aria-describedby"?: string } {
  return errors[key] ? { "aria-invalid": true, "aria-describedby": errorId(key) } : {};
}

function focusField(key: string): void {
  const element = document.getElementById(`donate-${key}`);
  if (!element) {
    return;
  }
  element.scrollIntoView({ block: "center", behavior: "smooth" });
  const focusable = element.matches("input, select, textarea")
    ? element
    : element.querySelector<HTMLElement>("input, select, textarea, button");
  focusable?.focus();
}

function FieldError({ id, message }: { id: string; message: string | undefined }) {
  if (!message) {
    return null;
  }
  return (
    <p id={id} role="alert" className="text-sm text-[#DC2626]">
      {message}
    </p>
  );
}

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="flex flex-col gap-4 p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-[#12372A]">{title}</h2>
      {children}
    </Card>
  );
}

export function DonateForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user, profile } = useAuth();

  const [draft, setDraft] = useState<DonationDraft>(createInitialDraft);
  const [images, setImages] = useState<PickedImage[]>([]);
  const [errors, setErrors] = useState<DraftErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  function update<K extends keyof DonationDraft>(key: K, value: DonationDraft[K]): void {
    setDraft((previous) => ({ ...previous, [key]: value }));
  }

  const { run: publish, pending } = useAsyncAction(async (): Promise<void> => {
    setFormError(null);
    try {
      const input = buildDonationInput(draft);
      if (!input) {
        throw new Error("Please check the form and try again.");
      }
      if (!user?.uid || !profile) {
        throw new Error("Please sign in again to continue.");
      }
      const donor = {
        uid: user.uid,
        name: profile.name || user.displayName || "ResQMeal donor",
        rating: profile.rating,
      };
      const donationId = await publishDonation({ input, images, donor, onProgress: setProgress });
      showToast("Food posted successfully.", "success");
      router.push(`/donation/${donationId}?posted=1`);
    } catch (error) {
      setFormError(toPublishMessage(error));
    } finally {
      setProgress(null);
    }
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (pending) {
      return;
    }
    const found = validateDonationDraft(draft);
    setErrors(found);
    const firstInvalid = FIELD_ORDER.find((key) => found[key]);
    if (firstInvalid) {
      focusField(firstInvalid);
      return;
    }
    void publish();
  }

  return (
    <div className="flex flex-col gap-6">
      {!isFirebaseConfigured ? (
        <Card className="border-[#F59E0B] p-4">
          <p className="text-sm text-[#334155]">
            ResQMeal is not configured yet. Copy .env.example to .env.local and add your Firebase settings.
          </p>
        </Card>
      ) : null}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        <FormSection title="Food details">
          <Input
            id="donate-title"
            label="Food name"
            maxLength={DONATION_LIMITS.TITLE_MAX}
            required
            value={draft.title}
            onChange={(event) => update("title", event.target.value)}
            {...fieldA11y(errors, "title")}
          />
          <FieldError id={errorId("title")} message={errors.title} />

          <Select
            id="donate-category"
            label="Category"
            options={CATEGORY_OPTIONS}
            value={draft.category}
            onChange={(event) => update("category", event.target.value)}
            {...fieldA11y(errors, "category")}
          />
          <FieldError id={errorId("category")} message={errors.category} />

          <Textarea
            id="donate-description"
            label="Description"
            maxLength={DONATION_LIMITS.DESCRIPTION_MAX}
            rows={3}
            hint="Optional: what it is, how many people it feeds."
            value={draft.description}
            onChange={(event) => update("description", event.target.value)}
          />
        </FormSection>

        <FormSection title="Photos">
          <p className="text-sm text-[#64748B]">Up to 5 photos. The first photo is the cover.</p>
          {PHOTO_UPLOADS_ENABLED ? (
            <ImagePicker images={images} onChange={setImages} disabled={pending} />
          ) : (
            <div className="text-sm text-[#64748B]">
              Photos are coming soon. Your food will be posted without photos for now.
            </div>
          )}
        </FormSection>

        <FormSection title="Quantity">
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="donate-quantity"
              label="Quantity"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={draft.quantity}
              onChange={(event) => update("quantity", event.target.value)}
              {...fieldA11y(errors, "quantity")}
            />
            <Select
              id="donate-unit"
              label="Unit"
              options={UNIT_OPTIONS}
              value={draft.unit}
              onChange={(event) => update("unit", event.target.value as QuantityUnit)}
            />
          </div>
          <FieldError id={errorId("quantity")} message={errors.quantity} />
        </FormSection>

        <FormSection title="Preparation & expiry">
          <Input
            id="donate-cookedAt"
            label="Prepared / cooked at"
            type="datetime-local"
            value={draft.cookedAt}
            onChange={(event) => update("cookedAt", event.target.value)}
            {...fieldA11y(errors, "cookedAt")}
          />
          <FieldError id={errorId("cookedAt")} message={errors.cookedAt} />

          <Input
            id="donate-expiresAt"
            label="Expiry / best before"
            type="datetime-local"
            value={draft.expiresAt}
            onChange={(event) => update("expiresAt", event.target.value)}
            {...fieldA11y(errors, "expiresAt")}
          />
          <FieldError id={errorId("expiresAt")} message={errors.expiresAt} />
        </FormSection>

        <FormSection title="Pickup">
          <div id="donate-location" className="flex flex-col gap-2">
            <LocationSelector value={draft.location} onChange={(next) => update("location", next)} disabled={pending} />
            <FieldError id={errorId("location")} message={errors.location} />
          </div>

          <Input
            id="donate-pickupFrom"
            label="Pickup available from"
            type="datetime-local"
            value={draft.pickupFrom}
            onChange={(event) => update("pickupFrom", event.target.value)}
            {...fieldA11y(errors, "pickupFrom")}
          />
          <FieldError id={errorId("pickupFrom")} message={errors.pickupFrom} />

          <Input
            id="donate-pickupUntil"
            label="Pickup available until"
            type="datetime-local"
            value={draft.pickupUntil}
            onChange={(event) => update("pickupUntil", event.target.value)}
            {...fieldA11y(errors, "pickupUntil")}
          />
          <FieldError id={errorId("pickupUntil")} message={errors.pickupUntil} />
        </FormSection>

        <FormSection title="Additional information">
          <Select
            id="donate-packaging"
            label="Packaging"
            options={PACKAGING_SELECT_OPTIONS}
            value={draft.packaging}
            onChange={(event) => update("packaging", event.target.value as PackagingOption)}
          />

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium text-[#334155]">
              Allergen information (optional) — for information only
            </legend>
            <p className="text-sm text-[#64748B]">
              Shown to people viewing your listing. It is not a guarantee that the food is free of allergens.
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ALLERGEN_OPTIONS.map((option) => {
                const checked = draft.allergens.includes(option);
                return (
                  <label
                    key={option}
                    className={cn(
                      "flex min-h-[44px] items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#334155]",
                      checked && "border-[#16A34A] bg-[#DCFCE7]/40",
                    )}
                  >
                    <input
                      type="checkbox"
                      className="h-5 w-5 accent-[#16A34A]"
                      checked={checked}
                      onChange={(event) =>
                        update("allergens", toggleAllergen(draft.allergens, option, event.target.checked))
                      }
                    />
                    {option}
                  </label>
                );
              })}
            </div>
          </fieldset>
        </FormSection>

        <div className="sticky bottom-0 -mx-4 flex flex-col gap-3 border-t border-[#E2E8F0] bg-white p-4 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
          {progress ? (
            <p role="status" className="text-sm font-medium text-[#12372A]">
              {progress}
            </p>
          ) : null}
          {formError ? (
            <p role="alert" className="text-sm text-[#DC2626]">
              {formError}
            </p>
          ) : null}
          <Button
            type="submit"
            variant="primary"
            fullWidth
            className="sm:w-auto sm:self-end"
            loading={pending}
            loadingText="Posting food..."
            disabled={!isFirebaseConfigured || pending}
          >
            POST FOOD
          </Button>
        </div>
      </form>
    </div>
  );
}
