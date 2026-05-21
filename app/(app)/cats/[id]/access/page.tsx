import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConfirmButton } from "@/components/confirm-button";
import { addAccess, removeAccess } from "./actions";

type AccessRow = {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  link_type: "caregiver" | "vet";
  linked_at: string;
};

export default async function CatAccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
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
    .select("id, name, tutor_id")
    .eq("id", id)
    .single();

  if (!cat) notFound();
  if (cat.tutor_id !== user.id) redirect(`/cats/${id}`);

  const { data: access } = await supabase.rpc("list_cat_access", {
    p_cat_id: id,
  });
  const rows = (access ?? []) as AccessRow[];
  const caregivers = rows.filter((r) => r.link_type === "caregiver");
  const vets = rows.filter((r) => r.link_type === "vet");

  const add = addAccess.bind(null, id);

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
          <span className="font-semibold">Acesso — {cat.name}</span>
        </Link>
      </nav>

      <div className="bg-primary text-primary-foreground px-5 py-5 flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-white/40 ring-2 ring-white/20 flex items-center justify-center shrink-0">
          <span className="text-white text-xl font-bold">
            {cat.name?.[0]?.toUpperCase() ?? "?"}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold">{cat.name}</p>
          <p className="text-xs text-primary-foreground/80 mt-0.5">
            Acesso concedido por gato, não globalmente
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold leading-none">
            {caregivers.length + vets.length}
          </p>
          <p className="text-[10px] uppercase tracking-wide text-primary-foreground/80 mt-0.5">
            vinculadas
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-5 py-5">

        <form action={add} className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-foreground">
            Adicionar pessoa
          </h2>

          {sp.error && (
            <p className="text-sm text-destructive bg-red-50 border border-red-200 rounded-xl p-3">
              {sp.error}
            </p>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-foreground mb-2"
            >
              E-mail <span className="text-destructive">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="email@exemplo.com"
              className="w-full bg-background border border-input rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-ring focus:border-primary focus:outline-none"
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              A pessoa precisa já ter conta no RenalPets.
            </p>
          </div>

          <fieldset>
            <legend className="block text-sm font-semibold text-foreground mb-2">
              Tipo de acesso <span className="text-destructive">*</span>
            </legend>
            <div className="grid grid-cols-2 gap-2">
              <label className="cursor-pointer">
                <input
                  type="radio"
                  name="link_type"
                  value="caregiver"
                  defaultChecked
                  className="peer sr-only"
                />
                <span className="block text-center px-4 py-3 rounded-xl border border-input bg-background text-sm font-medium text-foreground peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:border-primary transition-colors">
                  Cuidador
                </span>
              </label>
              <label className="cursor-pointer">
                <input
                  type="radio"
                  name="link_type"
                  value="vet"
                  className="peer sr-only"
                />
                <span className="block text-center px-4 py-3 rounded-xl border border-input bg-background text-sm font-medium text-foreground peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:border-primary transition-colors">
                  Veterinário
                </span>
              </label>
            </div>
          </fieldset>

          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground py-3.5 rounded-full font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm"
          >
            + Adicionar
          </button>
        </form>

        <section className="bg-card border border-border rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">
            Cuidadores
          </h2>
          {caregivers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum cuidador vinculado.
            </p>
          ) : (
            <ul className="divide-y divide-border -mx-1">
              {caregivers.map((c) => (
                <AccessRowItem key={c.user_id} row={c} catId={id} />
              ))}
            </ul>
          )}
        </section>

        <section className="bg-card border border-border rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">
            Veterinários
          </h2>
          {vets.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum veterinário vinculado.
            </p>
          ) : (
            <ul className="divide-y divide-border -mx-1">
              {vets.map((v) => (
                <AccessRowItem key={v.user_id} row={v} catId={id} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function AccessRowItem({ row, catId }: { row: AccessRow; catId: string }) {
  const action = removeAccess.bind(null, catId, row.user_id, row.link_type);
  return (
    <li className="flex items-center justify-between py-3 px-1">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
          <span className="text-muted-foreground font-semibold">
            {row.full_name?.[0]?.toUpperCase() ?? "?"}
          </span>
        </div>
        <div className="min-w-0">
          <p className="font-medium text-foreground truncate">
            {row.full_name}
          </p>
          <p className="text-xs text-muted-foreground truncate">{row.email}</p>
        </div>
      </div>
      <form action={action}>
        <ConfirmButton
          message={`Remover ${row.full_name}?`}
          className="text-sm font-medium text-destructive hover:underline"
        >
          Remover
        </ConfirmButton>
      </form>
    </li>
  );
}
