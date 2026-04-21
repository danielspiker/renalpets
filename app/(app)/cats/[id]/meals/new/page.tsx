import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logMeal } from "./actions";

export default async function NewMealPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ schedule?: string; error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const scheduleId = sp.schedule ?? null;

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

  let scheduledGrams: number | null = null;
  let scheduledTime: string | null = null;
  if (scheduleId) {
    const { data: schedule } = await supabase
      .from("meal_schedules")
      .select("time_of_day, grams")
      .eq("id", scheduleId)
      .eq("cat_id", id)
      .single();
    if (schedule) {
      scheduledGrams = Number(schedule.grams);
      scheduledTime = schedule.time_of_day.slice(0, 5);
    }
  }

  const action = logMeal.bind(null, id, scheduleId);

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
          <span className="font-semibold">Registrar Refeição</span>
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
                {scheduledTime
                  ? `Refeição das ${scheduledTime}${
                      scheduledGrams ? ` · ${scheduledGrams} g` : ""
                    }`
                  : "Refeição avulsa"}
              </p>
            </div>
          </div>
        </div>

        {sp.error && (
          <p className="text-sm text-destructive bg-red-50 border border-red-200 rounded-xl p-3">
            {sp.error}
          </p>
        )}

        <div className="bg-card border border-border rounded-2xl p-5">
          <label
            htmlFor="grams_served"
            className="block text-sm font-semibold text-foreground mb-2"
          >
            Gramas servidas <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <input
              id="grams_served"
              name="grams_served"
              type="number"
              step="0.1"
              min="0.1"
              required
              defaultValue={scheduledGrams ?? ""}
              className="w-full bg-background border border-input rounded-xl px-4 py-3 pr-16 text-lg font-semibold focus:ring-2 focus:ring-ring focus:border-primary focus:outline-none"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
              gramas
            </span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-sm font-semibold text-foreground mb-3">
            Quanto comeu?
          </p>
          <div className="space-y-2.5">
            <button
              type="submit"
              name="action"
              value="ate_all"
              className="w-full bg-success text-white py-3.5 rounded-full font-semibold text-sm hover:opacity-90 transition-opacity shadow-sm"
            >
              ✓ Comeu tudo
            </button>
            <button
              type="submit"
              name="action"
              value="partial"
              className="w-full bg-primary text-primary-foreground py-3.5 rounded-full font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm"
            >
              ◐ Comeu parcial
            </button>
            <button
              type="submit"
              name="action"
              value="didnt_eat"
              className="w-full bg-card text-destructive border-2 border-destructive py-3.5 rounded-full font-semibold text-sm hover:bg-red-50 transition-colors"
            >
              ✗ Não comeu
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
