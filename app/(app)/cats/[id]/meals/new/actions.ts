"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { toDryEquivalent, type FoodType } from "@/lib/food";

export async function logMeal(
  catId: string,
  scheduleId: string | null,
  formData: FormData
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const rawGrams = Number(formData.get("grams_served"));
  const choice = formData.get("action") as string;
  const servedAtLocal = (formData.get("served_at") as string | null) ?? "";
  const foodTypeRaw = formData.get("food_type") as string | null;
  const foodType: FoodType = foodTypeRaw === "wet" ? "wet" : "dry";

  if (!rawGrams || rawGrams <= 0) {
    const qs = new URLSearchParams();
    if (scheduleId) qs.set("schedule", scheduleId);
    qs.set("error", "Informe quantas gramas foram servidas");
    redirect(`/cats/${catId}/meals/new?${qs.toString()}`);
  }

  // Convert to dry-food equivalent so daily goal math stays consistent.
  const gramsServed = toDryEquivalent(rawGrams, foodType);

  // datetime-local has shape "YYYY-MM-DDTHH:MM" with no timezone.
  // Treat it as BRT (America/Sao_Paulo, UTC-3, no DST) and convert to ISO.
  let servedAtIso: string | undefined;
  if (servedAtLocal) {
    const parsed = new Date(`${servedAtLocal}:00-03:00`);
    if (!Number.isNaN(parsed.getTime())) {
      servedAtIso = parsed.toISOString();
    }
  }

  const gramsEaten = choice === "ate_all" ? gramsServed : 0;

  const { error } = await supabase.from("meal_logs").insert({
    cat_id: catId,
    logged_by: user.id,
    grams_served: gramsServed,
    grams_eaten: gramsEaten,
    schedule_id: scheduleId,
    food_type: foodType,
    ...(servedAtIso ? { served_at: servedAtIso } : {}),
  });

  if (error) {
    const qs = new URLSearchParams({ error: error.message });
    if (scheduleId) qs.set("schedule", scheduleId);
    redirect(`/cats/${catId}/meals/new?${qs.toString()}`);
  }

  revalidatePath(`/cats/${catId}`);
  redirect(gramsEaten === 0 ? `/cats/${catId}?tip=1` : `/cats/${catId}`);
}
