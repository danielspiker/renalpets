import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { brtDayBounds, formatBRT } from "@/lib/date";
import { INCIDENT_LABELS, isManagement, type IncidentType } from "@/lib/incidents";
import { fromDryEquivalent, type FoodType } from "@/lib/food";

type DayEntry =
  | {
      kind: "meal";
      id: string;
      time: string;
      gramsServed: number;
      gramsEaten: number;
      foodType: FoodType;
      scheduled: boolean;
    }
  | {
      kind: "incident";
      id: string;
      time: string;
      type: IncidentType;
      notes: string | null;
    };

function isValidDay(day: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(day);
}

export default async function HistoryDayPage({
  params,
}: {
  params: Promise<{ id: string; day: string }>;
}) {
  const { id, day } = await params;
  if (!isValidDay(day)) notFound();

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

  const { start, end } = brtDayBounds(day);

  const { data: progress } = await supabase
    .from("daily_progress")
    .select("goal_grams, eaten_grams, completed")
    .eq("cat_id", id)
    .eq("day", day)
    .maybeSingle();

  const { data: meals } = await supabase
    .from("meal_logs")
    .select("id, schedule_id, served_at, grams_served, grams_eaten, food_type")
    .eq("cat_id", id)
    .gte("served_at", start)
    .lt("served_at", end)
    .order("served_at");

  const { data: incidents } = await supabase
    .from("incidents")
    .select("id, type, occurred_at, notes")
    .eq("cat_id", id)
    .gte("occurred_at", start)
    .lt("occurred_at", end)
    .order("occurred_at");

  const entries: DayEntry[] = [
    ...(meals ?? []).map<DayEntry>((m) => ({
      kind: "meal",
      id: m.id,
      time: formatBRT(m.served_at, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      gramsServed: Number(m.grams_served),
      gramsEaten: Number(m.grams_eaten),
      foodType: (m.food_type === "wet" ? "wet" : "dry") as FoodType,
      scheduled: m.schedule_id != null,
    })),
    ...(incidents ?? []).map<DayEntry>((i) => ({
      kind: "incident",
      id: i.id,
      time: formatBRT(i.occurred_at, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      type: i.type as IncidentType,
      notes: i.notes,
    })),
  ].sort((a, b) => a.time.localeCompare(b.time));

  const goal = progress ? Number(progress.goal_grams) : 0;
  const eaten = progress ? Number(progress.eaten_grams) : 0;
  const pct = goal > 0 ? Math.round((eaten / goal) * 100) : 0;
  const over = pct > 100;
  const completed = progress?.completed ?? false;
  const pctColor = over
    ? "text-blue-500"
    : completed
    ? "text-success"
    : pct >= 80
    ? "text-primary"
    : "text-destructive";

  const dateLabel = formatBRT(`${day}T12:00:00-03:00`, {
    day: "2-digit",
    month: "long",
    weekday: "long",
  });

  return (
    <div className="flex flex-col">
      <nav className="flex items-center gap-2 h-14 px-4 bg-card border-b border-border">
        <Link
          href={`/cats/${id}/history`}
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
          <span className="font-semibold capitalize">{dateLabel}</span>
        </Link>
      </nav>

      <div className="flex flex-col gap-4 px-5 py-5">
        <section className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total do dia</p>
              <p className="text-lg font-bold text-foreground">
                {eaten.toFixed(1)} g de {goal.toFixed(1)} g
              </p>
            </div>
            <span className={`text-lg font-bold ${pctColor}`}>
              {pct}%{completed && !over && " ✓"}
            </span>
          </div>
        </section>

        <section className="bg-card border border-border rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">
            Registros do dia
          </h2>

          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum registro neste dia.
            </p>
          ) : (
            <ul className="divide-y divide-border -mx-1">
              {entries.map((e) => {
                if (e.kind === "meal") {
                  const wetServed =
                    e.foodType === "wet"
                      ? fromDryEquivalent(e.gramsServed)
                      : null;
                  return (
                    <li
                      key={`m-${e.id}`}
                      className="flex items-center gap-3 py-3 px-1"
                    >
                      <div className="h-10 w-10 rounded-full bg-success/15 flex items-center justify-center shrink-0">
                        <svg
                          className="h-5 w-5 text-success"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">
                          {e.time}{" "}
                          <span className="text-xs font-normal text-muted-foreground">
                            · {e.scheduled ? "refeição" : "avulsa"}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {wetServed != null
                            ? `${e.gramsEaten} g seca · ${wetServed} g úmida servida`
                            : e.gramsEaten === e.gramsServed
                            ? `${e.gramsEaten} g seca`
                            : `${e.gramsEaten} g de ${e.gramsServed} g seca`}
                        </p>
                      </div>
                    </li>
                  );
                }
                const mgmt = isManagement(e.type);
                return (
                  <li
                    key={`i-${e.id}`}
                    className="flex items-center gap-3 py-3 px-1"
                  >
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                        mgmt ? "bg-sky-100" : "bg-amber-100"
                      }`}
                    >
                      {mgmt ? (
                        <svg
                          className="h-5 w-5 text-sky-700"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M10.5 20.5l10-10a4.95 4.95 0 10-7-7l-10 10a4.95 4.95 0 107 7zM8.5 8.5l7 7"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="h-5 w-5 text-amber-700"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">
                        {e.time}{" "}
                        <span className="text-xs font-normal text-muted-foreground">
                          · {mgmt ? "manejo" : "intercorrência"}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {INCIDENT_LABELS[e.type]}
                      </p>
                      {e.notes && (
                        <p className="text-xs text-muted-foreground italic mt-0.5">
                          {e.notes}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
