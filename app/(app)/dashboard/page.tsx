import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { todayBRT, formatBRT } from "@/lib/date";
import { logout } from "./actions";

const ALERT_HOURS = 6;

type AlertRow = {
  cat_id: string;
  cat_name: string;
  last_meal_at: string;
  hours_since: number;
};

type Progress = {
  cat_id: string;
  eaten_grams: number | string;
  goal_grams: number | string;
  completed: boolean;
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

function formatToday(): string {
  return formatBRT(new Date(), { day: "numeric", month: "long" });
}

function initial(name: string | null | undefined): string {
  return name?.trim()?.[0]?.toUpperCase() ?? "?";
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, role")
    .eq("id", user!.id)
    .single();

  const { data: cats } = await supabase
    .from("cats")
    .select("id, name, birthdate, weight_kg")
    .order("name");

  const isTutor = profile?.role === "tutor";
  const isVet = profile?.role === "vet";
  const receivesAlerts = isTutor || isVet;

  const catIds = (cats ?? []).map((c) => c.id);
  const today = todayBRT();
  let progressByCat = new Map<string, Progress>();
  if (catIds.length > 0) {
    const { data: progress } = await supabase
      .from("daily_progress")
      .select("cat_id, eaten_grams, goal_grams, completed")
      .in("cat_id", catIds)
      .eq("day", today);
    progressByCat = new Map(
      (progress ?? []).map((p) => [p.cat_id, p as Progress])
    );
  }

  let alerts: AlertRow[] = [];
  if (receivesAlerts) {
    const { data } = await supabase.rpc("cats_needing_alert", {
      hours_threshold: ALERT_HOURS,
    });
    alerts = (data ?? []) as AlertRow[];
  }

  const displayName =
    profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "tutor";

  if (isVet) {
    return (
      <div className="flex flex-col">
        <header className="bg-vet-surface text-vet-foreground px-5 pt-6 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-lg font-bold">Painel Veterinário</h1>
              <p className="text-sm text-white/70 mt-0.5">
                Dra. {displayName}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <form action={logout}>
                <button
                  type="submit"
                  className="text-xs font-medium text-white/70 hover:text-white"
                  title="Sair"
                >
                  Sair
                </button>
              </form>
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {initial(profile?.full_name || user?.email)}
                </span>
              </div>
            </div>
          </div>
        </header>

        {alerts.length > 0 && (
          <div className="bg-destructive text-white px-5 py-3 flex items-start gap-2.5">
            <svg
              className="h-5 w-5 shrink-0 mt-0.5"
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
            <div className="text-sm font-semibold space-y-0.5">
              {alerts.map((a) => (
                <Link
                  key={a.cat_id}
                  href={`/cats/${a.cat_id}`}
                  className="block hover:underline"
                >
                  {a.cat_name} não come há{" "}
                  {Number(a.hours_since).toFixed(1)}h — atenção!
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4 px-5 py-5">
          <h2 className="text-sm font-semibold text-foreground">Pacientes</h2>

          {!cats || cats.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhum paciente liberado para você ainda.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {cats.map((cat) => {
                const p = progressByCat.get(cat.id);
                const eaten = p ? Number(p.eaten_grams) : 0;
                const goal = p ? Number(p.goal_grams) : 0;
                const pct =
                  goal > 0
                    ? Math.min(100, Math.round((eaten / goal) * 100))
                    : 0;
                const completed = p?.completed ?? false;
                const age = formatAge(cat.birthdate);
                const weight = cat.weight_kg ? `${cat.weight_kg} kg` : null;
                const meta = [age, weight].filter(Boolean).join(" · ");
                const pctColor = completed
                  ? "text-success"
                  : pct >= 80
                  ? "text-primary"
                  : "text-destructive";

                return (
                  <li key={cat.id}>
                    <Link
                      href={`/cats/${cat.id}`}
                      className="flex items-center gap-3 bg-card border border-border rounded-2xl p-4 hover:shadow-sm transition-shadow"
                    >
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <span className="text-muted-foreground font-semibold">
                          {initial(cat.name)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {cat.name}
                        </p>
                        {meta && (
                          <p className="text-xs text-muted-foreground">
                            {meta}
                          </p>
                        )}
                        {goal > 0 && (
                          <p className="text-xs mt-0.5">
                            <span className={`font-semibold ${pctColor}`}>
                              Hoje: {pct}%
                            </span>
                            <span className="text-muted-foreground">
                              {" "}
                              da meta
                            </span>
                          </p>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col px-5 pt-6 pb-6">
      <header className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Olá, {displayName} <span aria-hidden>👋</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Hoje, {formatToday()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <form action={logout}>
            <button
              type="submit"
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
              title="Sair"
            >
              Sair
            </button>
          </form>
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
            <span className="text-white text-sm font-bold">
              {initial(profile?.full_name || user?.email)}
            </span>
          </div>
        </div>
      </header>

      {alerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-5">
          <p className="text-sm font-semibold text-destructive mb-1.5">
            ⚠️{" "}
            {alerts.length === 1
              ? "1 gato sem comer há mais de"
              : `${alerts.length} gatos sem comer há mais de`}{" "}
            {ALERT_HOURS}h
          </p>
          <ul className="text-sm text-destructive/90 space-y-1">
            {alerts.map((a) => (
              <li key={a.cat_id}>
                <Link
                  href={`/cats/${a.cat_id}`}
                  className="hover:underline font-medium"
                >
                  {a.cat_name}
                </Link>{" "}
                — última há {Number(a.hours_since).toFixed(1)}h
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-foreground">Seus Gatos</h2>
        {isTutor && (
          <Link
            href="/cats/new"
            className="text-sm font-medium text-primary hover:underline"
          >
            + Novo gato
          </Link>
        )}
      </div>

      {!cats || cats.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {isTutor
              ? 'Você ainda não cadastrou nenhum gato. Toque em "+ Novo gato" para começar.'
              : "Nenhum gato liberado para você ainda."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {cats.map((cat) => {
            const p = progressByCat.get(cat.id);
            const eaten = p ? Number(p.eaten_grams) : 0;
            const goal = p ? Number(p.goal_grams) : 0;
            const pct =
              goal > 0 ? Math.min(100, Math.round((eaten / goal) * 100)) : 0;
            const completed = p?.completed ?? false;
            const age = formatAge(cat.birthdate);
            const weight = cat.weight_kg ? `${cat.weight_kg} kg` : null;
            const meta = [age, weight].filter(Boolean).join(" · ");

            return (
              <li key={cat.id}>
                <Link
                  href={`/cats/${cat.id}`}
                  className="block bg-card border border-border rounded-2xl p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <span className="text-muted-foreground font-semibold">
                        {initial(cat.name)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {cat.name}
                      </p>
                      {meta && (
                        <p className="text-xs text-muted-foreground">{meta}</p>
                      )}
                    </div>
                  </div>

                  {goal > 0 ? (
                    <>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-muted-foreground">
                          Meta diária
                        </span>
                        <span
                          className={`text-sm font-bold ${
                            completed ? "text-success" : "text-primary"
                          }`}
                        >
                          {pct}%{completed && " ✓"}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            completed ? "bg-success" : "bg-primary"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Sem agenda definida ainda
                    </p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
