"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createCat(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = (formData.get("name") as string)?.trim();
  const birthdate = (formData.get("birthdate") as string) || null;
  const weightRaw = (formData.get("weight_kg") as string) || "";
  const weight_kg = weightRaw === "" ? null : Number(weightRaw);

  if (!name) {
    redirect("/cats/new?error=Nome%20é%20obrigatório");
  }

  const { error } = await supabase.from("cats").insert({
    tutor_id: user.id,
    name,
    birthdate,
    weight_kg,
  });

  if (error) {
    redirect(`/cats/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
