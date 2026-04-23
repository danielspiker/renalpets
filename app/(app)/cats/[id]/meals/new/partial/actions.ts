"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function logPartialMeal(
  catId: string,
  scheduleId: string | null,
  formData: FormData
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const gramsServed = Number(formData.get("grams_served"));
  const gramsEaten = Number(formData.get("grams_eaten"));

  const buildQs = (extra: Record<string, string>) => {
    const qs = new URLSearchParams(extra);
    if (scheduleId) qs.set("schedule", scheduleId);
    return qs.toString();
  };

  if (!gramsServed || gramsServed <= 0) {
    redirect(
      `/cats/${catId}/meals/new?${buildQs({
        error: "Gramas servidas inválidas",
      })}`
    );
  }
  if (isNaN(gramsEaten) || gramsEaten < 0) {
    redirect(
      `/cats/${catId}/meals/new/partial?${buildQs({
        grams_served: String(gramsServed),
        error: "Informe quantas gramas foram consumidas",
      })}`
    );
  }
  if (gramsEaten > gramsServed) {
    redirect(
      `/cats/${catId}/meals/new/partial?${buildQs({
        grams_served: String(gramsServed),
        error: "Consumido não pode ser maior que o servido",
      })}`
    );
  }

  const { error } = await supabase.from("meal_logs").insert({
    cat_id: catId,
    logged_by: user.id,
    grams_served: gramsServed,
    grams_eaten: gramsEaten,
    schedule_id: scheduleId,
  });

  if (error) {
    redirect(
      `/cats/${catId}/meals/new/partial?${buildQs({
        grams_served: String(gramsServed),
        error: error.message,
      })}`
    );
  }

  revalidatePath(`/cats/${catId}`);
  redirect(gramsEaten === 0 ? `/cats/${catId}?tip=1` : `/cats/${catId}`);
}
