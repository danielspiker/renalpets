import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DailyProgressBar } from "@/components/daily-progress-bar";
import { todayBRT, brtDayBounds, formatBRT } from "@/lib/date";

type DayItem =
  | {
      kind: "schedule";
      id: string;
      time: string;
      grams: number;
      done: boolean;
    }
  | {
      kind: "adhoc";
      id: string;
      time: string;
      gramsServed: number;
      gramsEaten: number;
    };

function formatAge(birthdate: string | null): string | null {
  if (!birthdate) return null;
  const diffMs = Date.now() - new Date(birthdate).getTime();
  const years = Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000));
  if (years < 1) {
    const months = Math.floor(diffMs / (30.44 * 24 * 60 * 60 * 1000));
    return `${months} ${months === 1 ? "mês" : "meses"}`;
  }
  return `${years} ${years === 1 ? "ano" : "anos"}`;
}

export default async function CatDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tip?: string }>;
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
    .select("*")
    .eq("id", id)
    .single();

  if (!cat) notFound();

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const canLogMeals = profile?.role === "tutor" || profile?.role === "caregiver";

  const { data: schedules } = await supabase
    .from("meal_schedules")
    .select("id, time_of_day, grams")
    .eq("cat_id", id)
    .order("time_of_day");

  const today = todayBRT();
  const { start: dayStart, end: dayEnd } = brtDayBounds(today);
  const { data: progress } = await supabase
    .from("daily_progress")
    .select("eaten_grams, goal_grams, completed")
    .eq("cat_id", id)
    .eq("day", today)
    .maybeSingle();

  const { data: loggedToday } = await supabase
    .from("meal_logs")
    .select("id, schedule_id, served_at, grams_served, grams_eaten")
    .eq("cat_id", id)
    .gte("served_at", dayStart)
    .lt("served_at", dayEnd)
    .order("served_at");

  const doneScheduleIds = new Set(
    (loggedToday ?? [])
      .filter((l) => l.schedule_id != null)
      .map((l) => l.schedule_id as string)
  );

  const adHocLogs = (loggedToday ?? []).filter((l) => l.schedule_id == null);

  const dayItems: DayItem[] = [
    ...(schedules ?? []).map<DayItem>((s) => ({
      kind: "schedule",
      id: s.id,
      time: s.time_of_day.slice(0, 5),
      grams: Number(s.grams),
      done: doneScheduleIds.has(s.id),
    })),
    ...adHocLogs.map<DayItem>((l) => ({
      kind: "adhoc",
      id: l.id,
      time: formatBRT(l.served_at, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      gramsServed: Number(l.grams_served),
      gramsEaten: Number(l.grams_eaten),
    })),
  ].sort((a, b) => a.time.localeCompare(b.time));

  const isTutor = cat.tutor_id === user.id;
  const scheduledTotal =
    schedules?.reduce((sum, s) => sum + Number(s.grams), 0) ?? 0;
  const goalToday = progress ? Number(progress.goal_grams) : scheduledTotal;
  const eatenToday = progress ? Number(progress.eaten_grams) : 0;
  const completed = progress?.completed ?? false;

  let tip: { title: string; body: string } | null = null;
  if (sp.tip === "1") {
    const { data: tips } = await supabase
      .from("feeding_tips")
      .select("title, body");
    if (tips && tips.length > 0) {
      tip = tips[Math.floor(Math.random() * tips.length)];
    }
  }

  const age = formatAge(cat.birthdate);
  const weight = cat.weight_kg ? `${cat.weight_kg} kg` : null;
  const summary = [cat.name, age, weight].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-col">
      <nav className="flex items-center justify-between h-14 px-4 bg-card border-b border-border">
        <Link
          href="/dashboard"
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
          <span className="font-semibold">{cat.name}</span>
        </Link>
        {isTutor && (
          <div className="flex items-center gap-4 text-sm">
            <Link href={`/cats/${cat.id}/access`} className="text-primary">
              Acesso
            </Link>
            <Link href={`/cats/${cat.id}/edit`} className="text-primary">
              Editar
            </Link>
          </div>
        )}
      </nav>

      <div className="bg-primary text-primary-foreground px-5 py-6 flex flex-col items-center">
        <div className="h-20 w-20 rounded-full bg-white/40 ring-4 ring-white/20 flex items-center justify-center">
          <span className="text-white text-2xl font-bold">
            {cat.name?.[0]?.toUpperCase() ?? "?"}
          </span>
        </div>
        <p className="mt-3 text-sm font-medium">{summary}</p>
      </div>

      <div className="flex flex-col gap-4 px-5 py-5">
        {tip && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-sm font-semibold text-amber-900">
              💡 Dica: {tip.title}
            </p>
            <p className="text-sm text-amber-800 mt-1">{tip.body}</p>
          </div>
        )}

        <section className="bg-card border border-border rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">
            Progresso de Hoje
          </h2>
          <DailyProgressBar
            catId={id}
            initialEatenGrams={eatenToday}
            initialGoalGrams={goalToday}
            initialCompleted={completed}
          />
        </section>

        <section className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">
              Refeições do Dia
            </h2>
            {isTutor && (
              <Link
                href={`/cats/${id}/schedule/new`}
                className="text-sm font-medium text-primary hover:underline"
              >
                + Horário
              </Link>
            )}
          </div>

          {dayItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {isTutor
                ? "Nenhum horário cadastrado. Adicione para definir a meta diária."
                : "Nenhum horário cadastrado."}
            </p>
          ) : (
            <ul className="divide-y divide-border -mx-1">
              {dayItems.map((item) => {
                if (item.kind === "schedule") {
                  const done = item.done;
                  return (
                    <li
                      key={`s-${item.id}`}
                      className="flex items-center gap-3 py-3 px-1"
                    >
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                          done ? "bg-success/15" : "bg-muted"
                        }`}
                      >
                        {done ? (
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
                        ) : (
                          <svg
                            className="h-4 w-4 text-muted-foreground"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <circle cx="12" cy="12" r="9" />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 7v5l3 2"
                            />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-medium ${
                            done
                              ? "text-muted-foreground line-through"
                              : "text-foreground"
                          }`}
                        >
                          {item.time}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.grams} g planejado
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        {canLogMeals &&
                          (done ? (
                            <span className="flex items-center gap-1 text-success font-medium px-3 py-1.5">
                              <svg
                                className="h-4 w-4"
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
                              Registrado
                            </span>
                          ) : (
                            <Link
                              href={`/cats/${id}/meals/new?schedule=${item.id}`}
                              className="bg-primary text-primary-foreground px-3 py-1.5 rounded-full font-medium hover:bg-primary/90"
                            >
                              Registrar
                            </Link>
                          ))}
                        {isTutor && (
                          <Link
                            href={`/cats/${id}/schedule/${item.id}/edit`}
                            className="text-primary"
                          >
                            Editar
                          </Link>
                        )}
                      </div>
                    </li>
                  );
                }
                // adhoc
                return (
                  <li
                    key={`a-${item.id}`}
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
                        {item.time}{" "}
                        <span className="text-xs font-normal text-muted-foreground">
                          · avulsa
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.gramsEaten} g de {item.gramsServed} g servidas
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {canLogMeals && (
            <div className="mt-3 pt-3 border-t border-border">
              <Link
                href={`/cats/${id}/meals/new`}
                className="text-sm font-medium text-primary hover:underline"
              >
                + Registrar refeição avulsa
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
