import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { todayBRT, formatBRT } from "@/lib/date";
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
  let scheduledFoodType: "dry" | "wet" = "dry";
  if (scheduleId) {
    const { data: schedule } = await supabase
      .from("meal_schedules")
      .select("time_of_day, grams, food_type")
      .eq("id", scheduleId)
      .eq("cat_id", id)
      .single();
    if (schedule) {
      scheduledGrams = Number(schedule.grams);
      scheduledTime = schedule.time_of_day.slice(0, 5);
      scheduledFoodType = schedule.food_type === "wet" ? "wet" : "dry";
    }
  }

  const action = logMeal.bind(null, id, scheduleId);

  // Default datetime-local value (BRT). Scheduled meal uses today + scheduled
  // time of day; ad-hoc uses current BRT moment.
  const defaultServedAt = scheduledTime
    ? `${todayBRT()}T${scheduledTime}`
    : `${todayBRT()}T${formatBRT(new Date(), {
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

        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div>
            <label
              htmlFor="grams_served"
              className="block text-sm font-semibold text-foreground mb-2"
            >
              Quantidade servida <span className="text-destructive">*</span>
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

          <div>
            <span className="block text-sm font-semibold text-foreground mb-2">
              Tipo de ração <span className="text-destructive">*</span>
            </span>
            <div className="grid grid-cols-2 gap-2">
              <label className="cursor-pointer">
                <input
                  type="radio"
                  name="food_type"
                  value="dry"
                  defaultChecked={scheduledFoodType === "dry"}
                  className="peer sr-only"
                />
                <span className="block text-center px-4 py-3 rounded-xl border border-input bg-background text-sm font-medium text-foreground peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:border-primary transition-colors">
                  Seca
                </span>
              </label>
              <label className="cursor-pointer">
                <input
                  type="radio"
                  name="food_type"
                  value="wet"
                  defaultChecked={scheduledFoodType === "wet"}
                  className="peer sr-only"
                />
                <span className="block text-center px-4 py-3 rounded-xl border border-input bg-background text-sm font-medium text-foreground peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:border-primary transition-colors">
                  Úmida
                </span>
              </label>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              Úmida é convertida para o equivalente em seca (1 g seca ≈ 3,7 g úmida).
            </p>
          </div>

          <div>
            <label
              htmlFor="served_at"
              className="block text-sm font-semibold text-foreground mb-2"
            >
              Horário <span className="text-destructive">*</span>
            </label>
            <input
              id="served_at"
              name="served_at"
              type="datetime-local"
              required
              defaultValue={defaultServedAt}
              className="w-full bg-background border border-input rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-ring focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-sm font-semibold text-foreground mb-3">
            Comeu?
          </p>
          <div className="space-y-2.5">
            <button
              type="submit"
              name="action"
              value="ate_all"
              className="w-full bg-success text-white py-3.5 rounded-full font-semibold text-sm hover:opacity-90 transition-opacity shadow-sm"
            >
              ✓ Comeu
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
