import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logPartialMeal } from "./actions";

export default async function PartialMealPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    grams_served?: string;
    error?: string;
    schedule?: string;
  }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const gramsServed = Number(sp.grams_served ?? 0);
  const scheduleId = sp.schedule ?? null;

  if (!gramsServed || gramsServed <= 0) {
    redirect(`/cats/${id}/meals/new`);
  }

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

  const action = logPartialMeal.bind(null, id, scheduleId);

  return (
    <div className="flex flex-col">
      <nav className="flex items-center gap-2 h-14 px-4 bg-card border-b border-border">
        <Link
          href={`/cats/${id}/meals/new${
            scheduleId
              ? `?schedule=${scheduleId}`
              : sp.grams_served
              ? `?grams_served=${sp.grams_served}`
              : ""
          }`}
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
          <span className="font-semibold">Comeu parcial</span>
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
                Servido {gramsServed} g
              </p>
            </div>
          </div>
        </div>

        {sp.error && (
          <p className="text-sm text-destructive bg-red-50 border border-red-200 rounded-xl p-3">
            {sp.error}
          </p>
        )}

        <input type="hidden" name="grams_served" value={gramsServed} />

        <div className="bg-card border border-border rounded-2xl p-5">
          <label
            htmlFor="grams_eaten"
            className="block text-sm font-semibold text-foreground mb-2"
          >
            Quantas gramas comeu?{" "}
            <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <input
              id="grams_eaten"
              name="grams_eaten"
              type="number"
              step="0.1"
              min="0"
              max={gramsServed}
              required
              autoFocus
              className="w-full bg-background border-2 border-primary rounded-xl px-4 py-3 pr-16 text-lg font-semibold text-primary focus:ring-2 focus:ring-ring focus:outline-none"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
              gramas
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Máximo: {gramsServed} g
          </p>
        </div>

        <button
          type="submit"
          className="w-full bg-primary text-primary-foreground py-3.5 rounded-full font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm"
        >
          + Registrar Refeição
        </button>
      </form>
    </div>
  );
}
