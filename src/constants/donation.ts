export const DONATION_STATUSES = ["AVAILABLE", "EXPIRED", "CANCELLED"] as const;
export type DonationStatus = (typeof DONATION_STATUSES)[number];

export const DONATION_CATEGORIES = [
  { id: "cooked-meals", label: "Cooked Meals", icon: "🍛" },
  { id: "packed-meals", label: "Packed Meals", icon: "🍱" },
  { id: "rice-grains", label: "Rice / Grains", icon: "🌾" },
  { id: "bakery", label: "Bakery", icon: "🥖" },
  { id: "fruits", label: "Fruits", icon: "🍎" },
  { id: "vegetables", label: "Vegetables", icon: "🥦" },
  { id: "dairy", label: "Dairy", icon: "🥛" },
  { id: "desserts", label: "Desserts", icon: "🍰" },
  { id: "snacks", label: "Snacks", icon: "🍿" },
  { id: "packaged-food", label: "Packaged Food", icon: "📦" },
  { id: "other", label: "Other", icon: "🍽️" },
] as const;

export type DonationCategoryId = (typeof DONATION_CATEGORIES)[number]["id"];

export const DONATION_CATEGORY_IDS: readonly string[] = DONATION_CATEGORIES.map((c) => c.id);

const OTHER_CATEGORY = DONATION_CATEGORIES[DONATION_CATEGORIES.length - 1];

export function getCategoryLabel(id: string): string {
  const category = DONATION_CATEGORIES.find((c) => c.id === id);
  return category ? category.label : OTHER_CATEGORY.label;
}

export function getCategoryIcon(id: string): string {
  const category = DONATION_CATEGORIES.find((c) => c.id === id);
  return category ? category.icon : OTHER_CATEGORY.icon;
}

export const QUANTITY_UNITS = [
  "servings",
  "plates",
  "packs",
  "kg",
  "litres",
  "pieces",
  "boxes",
  "Other",
] as const;
export type QuantityUnit = (typeof QUANTITY_UNITS)[number];

export const PACKAGING_OPTIONS = ["Individual", "Bulk", "Packed", "Container", "Other"] as const;
export type PackagingOption = (typeof PACKAGING_OPTIONS)[number];

export const ALLERGEN_OPTIONS = [
  "Dairy",
  "Eggs",
  "Gluten",
  "Nuts",
  "Soy",
  "Other",
  "None specified",
] as const;
export type AllergenOption = (typeof ALLERGEN_OPTIONS)[number];

export const DONATION_LIMITS = {
  MAX_IMAGES: 5,
  MAX_INPUT_FILE_BYTES: 15 * 1024 * 1024,
  MAX_QUANTITY: 10000,
  TITLE_MAX: 80,
  DESCRIPTION_MAX: 500,
  PAGE_SIZE: 20,
  EXPLORE_FETCH_LIMIT: 60,
  HOME_FEED_LIMIT: 6,
} as const;

// Firebase Storage needs a paid plan. Set to true once Storage is enabled and storage.rules is deployed.
export const PHOTO_UPLOADS_ENABLED = false;

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const DISTANCE_OPTIONS_KM = [1, 3, 5, 10] as const;
