"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { INCIDENT_LABELS, type IncidentType } from "@/lib/incidents";

export async function logIncident(catId: string, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const type = formData.get("type") as IncidentType | null;
  const occurredAtLocal =
    (formData.get("occurred_at") as string | null) ?? "";
  const notes = ((formData.get("notes") as string | null) ?? "").trim();

  if (!type || !(type in INCIDENT_LABELS)) {
    const qs = new URLSearchParams({ error: "Selecione um tipo." });
    redirect(`/cats/${catId}/incidents/new?${qs.toString()}`);
  }

  // datetime-local has shape "YYYY-MM-DDTHH:MM" with no timezone.
  // Treat it as BRT (America/Sao_Paulo, UTC-3) and convert to ISO.
  let occurredAtIso: string | undefined;
  if (occurredAtLocal) {
    const parsed = new Date(`${occurredAtLocal}:00-03:00`);
    if (!Number.isNaN(parsed.getTime())) {
      occurredAtIso = parsed.toISOString();
    }
  }

  const { error } = await supabase.from("incidents").insert({
    cat_id: catId,
    logged_by: user.id,
    type,
    notes: notes || null,
    ...(occurredAtIso ? { occurred_at: occurredAtIso } : {}),
  });

  if (error) {
    const qs = new URLSearchParams({ error: error.message });
    redirect(`/cats/${catId}/incidents/new?${qs.toString()}`);
  }

  revalidatePath(`/cats/${catId}`);
  redirect(`/cats/${catId}`);
}
