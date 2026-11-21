/**
 * Rough planning assumptions used to show an IMPACT ESTIMATE.
 * These are NOT scientific measurements. Every value derived from them
 * must be labelled as an "estimate" in the UI.
 */
export const IMPACT_ESTIMATE = {
  /** Assumed average food mass per meal serving, in kg. */
  KG_PER_MEAL: 0.4,
  /** Assumed kg CO2 equivalent avoided per kg of food rescued. */
  CO2E_KG_PER_KG_FOOD: 2.5,
} as const;

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Estimated food mass in kg for a number of servings (estimate only). */
export function estimateKgFromServings(servings: number): number {
  return roundToOneDecimal(servings * IMPACT_ESTIMATE.KG_PER_MEAL);
}

/** Estimated kg CO2e avoided for a mass of food in kg (estimate only). */
export function estimateCo2eKg(kg: number): number {
  return roundToOneDecimal(kg * IMPACT_ESTIMATE.CO2E_KG_PER_KG_FOOD);
}
