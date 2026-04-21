import Link from "next/link";
import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; signup?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-[430px] flex flex-col items-center px-6 pt-16 pb-8">
        <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center shadow-sm">
          <span className="text-white text-2xl font-bold tracking-tight">
            RP
          </span>
        </div>
        <h1 className="mt-5 text-2xl font-bold text-foreground">RenalPets</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cuide da alimentação do seu gato
        </p>

        <form action={login} className="w-full mt-10 space-y-4">
          {params.signup === "success" && (
            <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
              Cadastro realizado! Confirme seu email e faça login.
            </p>
          )}
          {params.error && (
            <p className="text-sm text-destructive bg-red-50 border border-red-200 rounded-xl p-3">
              {params.error}
            </p>
          )}

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
              placeholder="••••••••"
              className="w-full bg-card border border-input rounded-full px-4 py-3 text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-primary focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground py-3.5 rounded-full font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm"
          >
            + Entrar
          </button>

          <p className="text-sm text-center pt-2">
            <Link
              href="/signup"
              className="text-primary font-medium hover:underline"
            >
              Ainda não tem conta? Cadastre-se
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
