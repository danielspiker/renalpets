import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DailyProgressBar } from "@/components/daily-progress-bar";

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

  const today = new Date().toISOString().slice(0, 10);
  const { data: progress } = await supabase
    .from("daily_progress")
    .select("eaten_grams, goal_grams, completed")
    .eq("cat_id", id)
    .eq("day", today)
    .maybeSingle();

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

          {!schedules || schedules.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {isTutor
                ? "Nenhum horário cadastrado. Adicione para definir a meta diária."
                : "Nenhum horário cadastrado."}
            </p>
          ) : (
            <ul className="divide-y divide-border -mx-1">
              {schedules.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center gap-3 py-3 px-1"
                >
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
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
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">
                      {s.time_of_day.slice(0, 5)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {s.grams} g planejado
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    {canLogMeals && (
                      <Link
                        href={`/cats/${id}/meals/new?schedule=${s.id}`}
                        className="bg-primary text-primary-foreground px-3 py-1.5 rounded-full font-medium hover:bg-primary/90"
                      >
                        Registrar
                      </Link>
                    )}
                    {isTutor && (
                      <Link
                        href={`/cats/${id}/schedule/${s.id}/edit`}
                        className="text-primary"
                      >
                        Editar
                      </Link>
                    )}
                  </div>
                </li>
              ))}
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
