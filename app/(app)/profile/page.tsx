import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "../dashboard/actions";

const ROLE_LABEL: Record<string, string> = {
  tutor: "Tutor",
  caregiver: "Cuidador",
  vet: "Veterinário",
};

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, role, created_at")
    .eq("id", user.id)
    .single();

  const fullName = profile?.full_name || user.email?.split("@")[0] || "Usuário";
  const role = profile?.role ?? "tutor";
  const roleLabel = ROLE_LABEL[role] ?? role;
  const initial = fullName.trim()[0]?.toUpperCase() ?? "?";

  return (
    <div className="flex flex-col">
      <nav className="flex items-center gap-2 h-14 px-4 bg-card border-b border-border">
        <Link
          href="/dashboard"
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
          <span className="font-semibold">Perfil</span>
        </Link>
      </nav>

      <div className="bg-primary text-primary-foreground px-5 py-6 flex flex-col items-center">
        <div className="h-20 w-20 rounded-full bg-white/40 ring-4 ring-white/20 flex items-center justify-center">
          <span className="text-white text-2xl font-bold">{initial}</span>
        </div>
        <p className="mt-3 text-base font-semibold">{fullName}</p>
        <span className="mt-1 inline-flex items-center text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/20">
          {roleLabel}
        </span>
      </div>

      <div className="flex flex-col gap-4 px-5 py-5">
        <section className="bg-card border border-border rounded-2xl divide-y divide-border">
          <div className="px-4 py-3">
            <p className="text-xs text-muted-foreground">Nome</p>
            <p className="text-sm font-medium text-foreground">{fullName}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs text-muted-foreground">E-mail</p>
            <p className="text-sm font-medium text-foreground break-all">
              {user.email}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs text-muted-foreground">Tipo de conta</p>
            <p className="text-sm font-medium text-foreground">{roleLabel}</p>
          </div>
        </section>

        <form action={logout}>
          <button
            type="submit"
            className="w-full bg-card text-destructive border-2 border-destructive py-3 rounded-full font-semibold text-sm hover:bg-red-50 transition-colors"
          >
            Sair
          </button>
        </form>
      </div>
    </div>
  );
}
