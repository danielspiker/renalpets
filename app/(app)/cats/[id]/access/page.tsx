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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href={`/cats/${id}`}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Voltar
        </Link>

        <header className="bg-white rounded-lg shadow p-6 mt-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Gerenciar acesso
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Gato: {cat.name}. O acesso é concedido por gato, não globalmente.
          </p>
        </header>

        <section className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Adicionar pessoa
          </h2>

          {sp.error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              {sp.error}
            </p>
          )}

          <form action={add} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email da pessoa <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="email@exemplo.com"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                A pessoa precisa já ter uma conta cadastrada no RenalPets.
              </p>
            </div>

            <fieldset>
              <legend className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de acesso
              </legend>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="link_type"
                    value="caregiver"
                    defaultChecked
                  />
                  Cuidador
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="link_type" value="vet" />
                  Veterinário
                </label>
              </div>
            </fieldset>

            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700"
            >
              Adicionar
            </button>
          </form>
        </section>

        <section className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Cuidadores
          </h2>
          {caregivers.length === 0 ? (
            <p className="text-sm text-gray-600">Nenhum cuidador vinculado.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {caregivers.map((c) => (
                <AccessRowItem key={c.user_id} row={c} catId={id} />
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Veterinários
          </h2>
          {vets.length === 0 ? (
            <p className="text-sm text-gray-600">
              Nenhum veterinário vinculado.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
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
    <li className="flex items-center justify-between py-3">
      <div>
        <p className="font-medium text-gray-900">{row.full_name}</p>
        <p className="text-xs text-gray-500">{row.email}</p>
      </div>
      <form action={action}>
        <ConfirmButton
          message={`Remover ${row.full_name}?`}
          className="text-sm text-red-600 hover:underline"
        >
          Remover
        </ConfirmButton>
      </form>
    </li>
  );
}
