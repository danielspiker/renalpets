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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-lg mx-auto">
        <Link
          href={`/cats/${id}`}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Voltar
        </Link>

        <form
          action={updateWithId}
          className="bg-white rounded-lg shadow p-6 mt-4 space-y-4"
        >
          <h1 className="text-2xl font-bold text-gray-900">Editar gato</h1>

          {error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
              {error}
            </p>
          )}

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={cat.name}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="birthdate"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Data de nascimento
            </label>
            <input
              id="birthdate"
              name="birthdate"
              type="date"
              defaultValue={cat.birthdate ?? ""}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="weight_kg"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Peso (kg)
            </label>
            <input
              id="weight_kg"
              name="weight_kg"
              type="number"
              step="0.01"
              min="0"
              defaultValue={cat.weight_kg ?? ""}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700"
            >
              Salvar
            </button>
            <Link
              href={`/cats/${id}`}
              className="flex-1 text-center border border-gray-300 py-2 rounded-md font-medium hover:bg-gray-50"
            >
              Cancelar
            </Link>
          </div>
        </form>

        <form
          action={deleteWithId}
          className="bg-white rounded-lg shadow p-6 mt-4 border border-red-100"
        >
          <h2 className="text-base font-semibold text-gray-900 mb-1">
            Zona de perigo
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            Excluir permanentemente {cat.name} e todos os dados relacionados.
          </p>
          <ConfirmButton
            message={`Excluir ${cat.name}? Esta ação não pode ser desfeita.`}
            className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
          >
            Excluir gato
          </ConfirmButton>
        </form>
      </div>
    </div>
  );
}
