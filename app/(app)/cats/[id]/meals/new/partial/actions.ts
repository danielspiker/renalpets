"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function logPartialMeal(catId: string, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const gramsServed = Number(formData.get("grams_served"));
  const gramsEaten = Number(formData.get("grams_eaten"));

  if (!gramsServed || gramsServed <= 0) {
    redirect(
      `/cats/${catId}/meals/new?error=${encodeURIComponent("Gramas servidas inválidas")}`
    );
  }
  if (isNaN(gramsEaten) || gramsEaten < 0) {
    const qs = new URLSearchParams({
      grams_served: String(gramsServed),
      error: "Informe quantas gramas foram consumidas",
    });
    redirect(`/cats/${catId}/meals/new/partial?${qs.toString()}`);
  }
  if (gramsEaten > gramsServed) {
    const qs = new URLSearchParams({
      grams_served: String(gramsServed),
      error: "Consumido não pode ser maior que o servido",
    });
    redirect(`/cats/${catId}/meals/new/partial?${qs.toString()}`);
  }

  const { error } = await supabase.from("meal_logs").insert({
    cat_id: catId,
    logged_by: user.id,
    grams_served: gramsServed,
    grams_eaten: gramsEaten,
  });

  if (error) {
    const qs = new URLSearchParams({
      grams_served: String(gramsServed),
      error: error.message,
    });
    redirect(`/cats/${catId}/meals/new/partial?${qs.toString()}`);
  }

  revalidatePath(`/cats/${catId}`);
  redirect(gramsEaten === 0 ? `/cats/${catId}?tip=1` : `/cats/${catId}`);
}
