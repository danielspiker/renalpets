import Link from "next/link";
import { signup } from "./actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-[430px] flex flex-col items-center px-6 pt-12 pb-8">
        <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center shadow-sm">
          <span className="text-white text-xl font-bold tracking-tight">
            RP
          </span>
        </div>
        <h1 className="mt-4 text-2xl font-bold text-foreground">Criar conta</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Comece a cuidar do seu gato
        </p>

        <form action={signup} className="w-full mt-8 space-y-4">
          {params.error && (
            <p className="text-sm text-destructive bg-red-50 border border-red-200 rounded-xl p-3">
              {params.error}
            </p>
          )}

          <div>
            <label
              htmlFor="full_name"
              className="block text-sm font-semibold text-foreground mb-1.5"
            >
              Nome completo
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              placeholder="Como devemos te chamar?"
              className="w-full bg-card border border-input rounded-full px-4 py-3 text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-foreground mb-1.5"
            >
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="seu@email.com"
              className="w-full bg-card border border-input rounded-full px-4 py-3 text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-foreground mb-1.5"
            >
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="Mínimo 6 caracteres"
              className="w-full bg-card border border-input rounded-full px-4 py-3 text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="role"
              className="block text-sm font-semibold text-foreground mb-1.5"
            >
              Tipo de conta
            </label>
            <select
              id="role"
              name="role"
              required
              defaultValue="tutor"
              className="w-full bg-card border border-input rounded-full px-4 py-3 text-sm focus:ring-2 focus:ring-ring focus:border-primary focus:outline-none appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 24 24%22 stroke=%22%236b7280%22 stroke-width=%222%22><path stroke-linecap=%22round%22 stroke-linejoin=%22round%22 d=%22M19 9l-7 7-7-7%22/></svg>')] bg-no-repeat bg-[right_1rem_center] bg-[length:1rem_1rem] pr-10"
            >
              <option value="tutor">Tutor (dono do gato)</option>
              <option value="caregiver">Cuidador (familiar / pet sitter)</option>
              <option value="vet">Veterinário</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground py-3.5 rounded-full font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm"
          >
            Cadastrar
          </button>

          <p className="text-sm text-center pt-2">
            <Link
              href="/login"
              className="text-primary font-medium hover:underline"
            >
              Já tem conta? Entrar
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
