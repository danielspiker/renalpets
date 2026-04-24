import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { todayBRT, formatBRT } from "@/lib/date";

const HISTORY_DAYS = 30;

type ProgressRow = {
  day: string;
  goal_grams: number | string;
  eaten_grams: number | string;
  completed: boolean;
};

function shiftDay(day: string, deltaDays: number): string {
  const d = new Date(`${day}T00:00:00-03:00`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(d);
}

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const today = todayBRT();
  const start = shiftDay(today, -(HISTORY_DAYS - 1));

  const { data: rows } = await supabase
    .from("daily_progress")
    .select("day, goal_grams, eaten_grams, completed")
    .eq("cat_id", id)
    .gte("day", start)
    .lte("day", today)
    .order("day", { ascending: false });

  const list = (rows ?? []) as ProgressRow[];

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
          <span className="font-semibold">Histórico — {cat.name}</span>
        </Link>
      </nav>

      <div className="flex flex-col gap-4 px-5 py-5">
        <p className="text-xs text-muted-foreground">
          Últimos {HISTORY_DAYS} dias
        </p>

        {list.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum registro ainda.
            </p>
          </div>
        ) : (
          <ul className="bg-card border border-border rounded-2xl divide-y divide-border">
            {list.map((r) => {
              const goal = Number(r.goal_grams);
              const eaten = Number(r.eaten_grams);
              const pct = goal > 0 ? Math.round((eaten / goal) * 100) : 0;
              const over = pct > 100;
              const completed = r.completed;
              const pctColor = over
                ? "text-blue-500"
                : completed
                ? "text-success"
                : pct >= 80
                ? "text-primary"
                : "text-destructive";
              const dateLabel = formatBRT(`${r.day}T12:00:00-03:00`, {
                day: "2-digit",
                month: "2-digit",
                weekday: "short",
              });

              return (
                <li
                  key={r.day}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground capitalize">
                      {dateLabel}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {eaten.toFixed(1)} g de {goal.toFixed(1)} g
                    </p>
                  </div>
                  <span className={`text-sm font-bold ${pctColor}`}>
                    {pct}%
                    {completed && !over && " ✓"}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
