import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConfirmButton } from "@/components/confirm-button";
import { updateSchedule, deleteSchedule } from "./actions";

export default async function EditSchedulePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; scheduleId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id, scheduleId } = await params;
  const { error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: cat } = await supabase
    .from("cats")
    .select("id, name, tutor_id")
    .eq("id", id)
    .single();

  if (!cat) notFound();
  if (cat.tutor_id !== user.id) redirect(`/cats/${id}`);

  const { data: schedule } = await supabase
    .from("meal_schedules")
    .select("id, time_of_day, grams")
    .eq("id", scheduleId)
    .single();

  if (!schedule) notFound();

  const updateAction = updateSchedule.bind(null, id, scheduleId);
  const deleteAction = deleteSchedule.bind(null, id, scheduleId);

  const timeValue = schedule.time_of_day.slice(0, 5);

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
          <span className="font-semibold">Editar horário</span>
        </Link>
      </nav>

      <div className="flex flex-col gap-4 px-5 py-5">
        <form action={updateAction} className="flex flex-col gap-4">
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
                  Horário das {timeValue} · {schedule.grams} g
                </p>
              </div>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-red-50 border border-red-200 rounded-xl p-3">
              {error}
            </p>
          )}

          <div className="bg-card border border-border rounded-2xl p-5">
            <label
              htmlFor="time_of_day"
              className="block text-sm font-semibold text-foreground mb-2"
            >
              Horário <span className="text-destructive">*</span>
            </label>
            <input
              id="time_of_day"
              name="time_of_day"
              type="time"
              required
              defaultValue={timeValue}
              className="w-full bg-background border border-input rounded-xl px-4 py-3 text-lg font-semibold focus:ring-2 focus:ring-ring focus:border-primary focus:outline-none"
            />
          </div>

          <div className="bg-card border border-border rounded-2xl p-5">
            <label
              htmlFor="grams"
              className="block text-sm font-semibold text-foreground mb-2"
            >
              Gramas por refeição <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <input
                id="grams"
                name="grams"
                type="number"
                step="0.1"
                min="0.1"
                required
                defaultValue={schedule.grams}
                className="w-full bg-background border border-input rounded-xl px-4 py-3 pr-16 text-lg font-semibold focus:ring-2 focus:ring-ring focus:border-primary focus:outline-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                gramas
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground py-3.5 rounded-full font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm"
            >
              Salvar alterações
            </button>
            <Link
              href={`/cats/${id}`}
              className="w-full text-center bg-card text-foreground border border-border py-3.5 rounded-full font-semibold text-sm hover:bg-muted transition-colors"
            >
              Cancelar
            </Link>
          </div>
        </form>

        <form
          action={deleteAction}
          className="bg-card border border-destructive/30 rounded-2xl p-5"
        >
          <h2 className="text-sm font-semibold text-foreground mb-1">
            Excluir horário
          </h2>
          <p className="text-xs text-muted-foreground mb-3">
            Remover o horário de {timeValue} ({schedule.grams} g).
          </p>
          <ConfirmButton
            message={`Excluir o horário de ${timeValue}?`}
            className="w-full bg-card text-destructive border-2 border-destructive py-3 rounded-full font-semibold text-sm hover:bg-red-50 transition-colors"
          >
            Excluir horário
          </ConfirmButton>
        </form>
      </div>
    </div>
  );
}
