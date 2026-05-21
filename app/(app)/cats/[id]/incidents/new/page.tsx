import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { todayBRT, formatBRT } from "@/lib/date";
import { INCIDENT_GROUPS, INCIDENT_LABELS } from "@/lib/incidents";
import { logIncident } from "./actions";

export default async function NewIncidentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: cat } = await supabase
    .from("cats")
    .select("id, name")
    .eq("id", id)
    .single();
  if (!cat) notFound();

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role === "vet") redirect(`/cats/${id}`);

  const action = logIncident.bind(null, id);

  const defaultOccurredAt = `${todayBRT()}T${formatBRT(new Date(), {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })}`;

  return (
    <div className="flex flex-col">
      <nav className="flex items-center gap-2 h-14 px-4 bg-card border-b border-border">
        <Link
          href={`/cats/${id}`}
          aria-label="Voltar"
          className="flex items-center gap-2 text-foreground"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="font-semibold">Registrar Intercorrência</span>
        </Link>
      </nav>

      <form action={action} className="flex flex-col gap-4 px-5 py-5">
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <span className="text-muted-foreground font-semibold">
                {cat.name?.[0]?.toUpperCase() ?? "?"}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">{cat.name}</p>
              <p className="text-xs text-muted-foreground">
                Sinais, manejo ou evento agudo
              </p>
            </div>
          </div>
        </div>

        {sp.error && (
          <p className="text-sm text-destructive bg-red-50 border border-red-200 rounded-xl p-3">
            {sp.error}
          </p>
        )}

        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div>
            <label
              htmlFor="type"
              className="block text-sm font-semibold text-foreground mb-2"
            >
              Tipo <span className="text-destructive">*</span>
            </label>
            <select
              id="type"
              name="type"
              required
              defaultValue=""
              className="w-full bg-background border border-input rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-ring focus:border-primary focus:outline-none appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 24 24%22 stroke=%22%236b7280%22 stroke-width=%222%22><path stroke-linecap=%22round%22 stroke-linejoin=%22round%22 d=%22M19 9l-7 7-7-7%22/></svg>')] bg-no-repeat bg-[right_1rem_center] bg-[length:1rem_1rem] pr-10"
            >
              <option value="" disabled>
                Selecione…
              </option>
              {INCIDENT_GROUPS.map((g) => (
                <optgroup key={g.label} label={g.label}>
                  {g.items.map((t) => (
                    <option key={t} value={t}>
                      {INCIDENT_LABELS[t]}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="occurred_at"
              className="block text-sm font-semibold text-foreground mb-2"
            >
              Horário <span className="text-destructive">*</span>
            </label>
            <input
              id="occurred_at"
              name="occurred_at"
              type="datetime-local"
              required
              defaultValue={defaultOccurredAt}
              className="w-full bg-background border border-input rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-ring focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-semibold text-foreground mb-2"
            >
              Observações
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              placeholder="Detalhes adicionais (opcional)"
              className="w-full bg-background border border-input rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-ring focus:border-primary focus:outline-none resize-none"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-primary text-primary-foreground py-3.5 rounded-full font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm"
        >
          Registrar
        </button>
      </form>
    </div>
  );
}
