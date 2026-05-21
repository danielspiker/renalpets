import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConfirmButton } from "@/components/confirm-button";
import { updateCat, deleteCat } from "./actions";

export default async function EditCatPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

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
  if (cat.tutor_id !== user.id) redirect(`/cats/${id}`);

  const updateWithId = updateCat.bind(null, id);
  const deleteWithId = deleteCat.bind(null, id);

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
          <span className="font-semibold">Editar gato</span>
        </Link>
      </nav>

      <div className="flex flex-col gap-4 px-5 py-5">
        <form action={updateWithId} className="flex flex-col gap-4">
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
                  Atualizar dados do gato
                </p>
              </div>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-red-50 border border-red-200 rounded-xl p-3">
              {error}
            </p>
          )}

          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-semibold text-foreground mb-2"
              >
                Nome <span className="text-destructive">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                defaultValue={cat.name}
                className="w-full bg-background border border-input rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-ring focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="birthdate"
                className="block text-sm font-semibold text-foreground mb-2"
              >
                Data de nascimento
              </label>
              <input
                id="birthdate"
                name="birthdate"
                type="date"
                defaultValue={cat.birthdate ?? ""}
                className="w-full bg-background border border-input rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-ring focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="weight_kg"
                className="block text-sm font-semibold text-foreground mb-2"
              >
                Peso (kg)
              </label>
              <div className="relative">
                <input
                  id="weight_kg"
                  name="weight_kg"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={cat.weight_kg ?? ""}
                  className="w-full bg-background border border-input rounded-xl px-4 py-3 pr-12 text-base focus:ring-2 focus:ring-ring focus:border-primary focus:outline-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                  kg
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="daily_goal_grams"
                className="block text-sm font-semibold text-foreground mb-2"
              >
                Meta diária
              </label>
              <div className="relative">
                <input
                  id="daily_goal_grams"
                  name="daily_goal_grams"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Ex: 60"
                  defaultValue={cat.daily_goal_grams ?? ""}
                  className="w-full bg-background border border-input rounded-xl px-4 py-3 pr-16 text-base focus:ring-2 focus:ring-ring focus:border-primary focus:outline-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                  g seca
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                Meta em ração seca. Úmida é convertida ao registrar (1 g seca ≈ 3,7 g úmida).
              </p>
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
          action={deleteWithId}
          className="bg-card border border-destructive/30 rounded-2xl p-5"
        >
          <h2 className="text-sm font-semibold text-foreground mb-1">
            Zona de perigo
          </h2>
          <p className="text-xs text-muted-foreground mb-3">
            Excluir permanentemente {cat.name} e todos os dados relacionados.
          </p>
          <ConfirmButton
            message={`Excluir ${cat.name}? Esta ação não pode ser desfeita.`}
            className="w-full bg-card text-destructive border-2 border-destructive py-3 rounded-full font-semibold text-sm hover:bg-red-50 transition-colors"
          >
            Excluir gato
          </ConfirmButton>
        </form>
      </div>
    </div>
  );
}
