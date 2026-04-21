"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateSchedule(
  catId: string,
  scheduleId: string,
  formData: FormData
) {
  const supabase = await createClient();

  const time_of_day = (formData.get("time_of_day") as string)?.trim();
  const gramsRaw = (formData.get("grams") as string)?.trim();
  const grams = Number(gramsRaw);

  if (!time_of_day) {
    redirect(
      `/cats/${catId}/schedule/${scheduleId}/edit?error=Horário%20é%20obrigatório`
    );
  }
  if (!gramsRaw || isNaN(grams) || grams <= 0) {
    redirect(
      `/cats/${catId}/schedule/${scheduleId}/edit?error=${encodeURIComponent("Gramas deve ser um número maior que zero")}`
    );
  }

  const { error } = await supabase
    .from("meal_schedules")
    .update({ time_of_day, grams })
    .eq("id", scheduleId);

  if (error) {
    redirect(
      `/cats/${catId}/schedule/${scheduleId}/edit?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath(`/cats/${catId}`);
  redirect(`/cats/${catId}`);
}

export async function deleteSchedule(catId: string, scheduleId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("meal_schedules")
    .delete()
    .eq("id", scheduleId);

  if (error) {
    redirect(
      `/cats/${catId}/schedule/${scheduleId}/edit?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath(`/cats/${catId}`);
  redirect(`/cats/${catId}`);
}
