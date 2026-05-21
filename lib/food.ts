export type FoodType = "dry" | "wet";

// Equivalence between wet and dry cat food.
// Dry food ≈ ~90% dry matter, ~350-400 kcal / 100 g.
// Wet food ≈ ~22% dry matter, ~80-100 kcal / 100 g.
// Practical ratio: 1 g of dry food ≈ 3.7 g of wet food.
//   dry_equivalent = wet_grams / 3.7 ≈ wet_grams * 0.27
export const WET_TO_DRY_FACTOR = 1 / 3.7;

export function toDryEquivalent(grams: number, type: FoodType): number {
  if (type === "wet") {
    return Math.round(grams * WET_TO_DRY_FACTOR * 10) / 10;
  }
  return grams;
}

// Inverse: given dry-equivalent grams, recover the wet input that produced it.
export function fromDryEquivalent(dryGrams: number): number {
  return Math.round((dryGrams / WET_TO_DRY_FACTOR) * 10) / 10;
}

export const FOOD_TYPE_LABEL: Record<FoodType, string> = {
  dry: "Seca",
  wet: "Úmida",
};
