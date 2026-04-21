"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateCat(id: string, formData: FormData) {
  const supabase = await createClient();

  const name = (formData.get("name") as string)?.trim();
  const birthdate = (formData.get("birthdate") as string) || null;
  const weightRaw = (formData.get("weight_kg") as string) || "";
  const weight_kg = weightRaw === "" ? null : Number(weightRaw);

  if (!name) {
    redirect(`/cats/${id}/edit?error=Nome%20é%20obrigatório`);
  }

  const { error } = await supabase
    .from("cats")
    .update({ name, birthdate, weight_kg })
    .eq("id", id);

  if (error) {
    redirect(`/cats/${id}/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath(`/cats/${id}`);
  redirect(`/cats/${id}`);
}

export async function deleteCat(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("cats").delete().eq("id", id);

  if (error) {
    redirect(`/cats/${id}/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
