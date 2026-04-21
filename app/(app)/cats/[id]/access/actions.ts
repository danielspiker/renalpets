"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireTutor(catId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: cat } = await supabase
    .from("cats")
    .select("tutor_id")
    .eq("id", catId)
    .single();
  if (!cat || cat.tutor_id !== user.id) redirect(`/cats/${catId}`);

  return supabase;
}

export async function addAccess(catId: string, formData: FormData) {
  const supabase = await requireTutor(catId);

  const email = ((formData.get("email") as string) ?? "")
    .trim()
    .toLowerCase();
  const linkType = formData.get("link_type") as string;

  if (!email) {
    redirect(
      `/cats/${catId}/access?error=${encodeURIComponent("Informe um email")}`
    );
  }
  if (linkType !== "caregiver" && linkType !== "vet") {
    redirect(
      `/cats/${catId}/access?error=${encodeURIComponent("Tipo inválido")}`
    );
  }

  const { data: found } = await supabase.rpc("find_user_for_linking", {
    user_email: email,
  });
  const found0 = Array.isArray(found) ? found[0] : null;

  if (!found0) {
    redirect(
      `/cats/${catId}/access?error=${encodeURIComponent(
        "Usuário não encontrado. Ele precisa se cadastrar antes."
      )}`
    );
  }
  if (found0.role !== linkType) {
    const expected = linkType === "caregiver" ? "Cuidador" : "Veterinário";
    redirect(
      `/cats/${catId}/access?error=${encodeURIComponent(
        `Este email pertence a um ${found0.role}, não a um ${expected}.`
      )}`
    );
  }

  const table = linkType === "caregiver" ? "cat_caregivers" : "cat_vets";
  const idField = linkType === "caregiver" ? "caregiver_id" : "vet_id";

  const { error } = await supabase.from(table).insert({
    cat_id: catId,
    [idField]: found0.id,
  });

  if (error) {
    const msg = error.message.includes("duplicate")
      ? "Este usuário já está vinculado."
      : error.message;
    redirect(`/cats/${catId}/access?error=${encodeURIComponent(msg)}`);
  }

  revalidatePath(`/cats/${catId}/access`);
  redirect(`/cats/${catId}/access`);
}

export async function removeAccess(
  catId: string,
  userId: string,
  linkType: "caregiver" | "vet"
) {
  const supabase = await requireTutor(catId);

  const table = linkType === "caregiver" ? "cat_caregivers" : "cat_vets";
  const idField = linkType === "caregiver" ? "caregiver_id" : "vet_id";

  const { error } = await supabase
    .from(table)
    .delete()
    .eq("cat_id", catId)
    .eq(idField, userId);

  if (error) {
    redirect(
      `/cats/${catId}/access?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath(`/cats/${catId}/access`);
  redirect(`/cats/${catId}/access`);
}
