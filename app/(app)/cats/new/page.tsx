import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createCat } from "./actions";

export default async function NewCatPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "tutor") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-lg mx-auto">
        <Link
          href="/dashboard"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Voltar
        </Link>

        <form
          action={createCat}
          className="bg-white rounded-lg shadow p-6 mt-4 space-y-4"
        >
          <h1 className="text-2xl font-bold text-gray-900">Novo gato</h1>

          {params.error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
              {params.error}
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
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700"
            >
              Cadastrar
            </button>
            <Link
              href="/dashboard"
              className="flex-1 text-center border border-gray-300 py-2 rounded-md font-medium hover:bg-gray-50"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
