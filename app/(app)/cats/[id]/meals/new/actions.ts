"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

  const gramsServed = Number(formData.get("grams_served"));
  const choice = formData.get("action") as string;

  if (!gramsServed || gramsServed <= 0) {
    const qs = new URLSearchParams();
    if (scheduleId) qs.set("schedule", scheduleId);
    qs.set("error", "Informe quantas gramas foram servidas");
    redirect(`/cats/${catId}/meals/new?${qs.toString()}`);
  }

  if (choice === "partial") {
    const qs = new URLSearchParams({ grams_served: String(gramsServed) });
    if (scheduleId) qs.set("schedule", scheduleId);
    redirect(`/cats/${catId}/meals/new/partial?${qs.toString()}`);
  }

  const gramsEaten = choice === "ate_all" ? gramsServed : 0;

  const { error } = await supabase.from("meal_logs").insert({
    cat_id: catId,
    logged_by: user.id,
    grams_served: gramsServed,
    grams_eaten: gramsEaten,
    schedule_id: scheduleId,
  });

  if (error) {
    const qs = new URLSearchParams({ error: error.message });
    if (scheduleId) qs.set("schedule", scheduleId);
    redirect(`/cats/${catId}/meals/new?${qs.toString()}`);
  }

  revalidatePath(`/cats/${catId}`);
  redirect(gramsEaten === 0 ? `/cats/${catId}?tip=1` : `/cats/${catId}`);
}
