import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Option = {
  href: string;
  title: string;
  description: string;
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
  tutorOnly?: boolean;
};

const options: Option[] = [
  {
    href: "/register/access",
    title: "Acesso",
    description: "Liberar cuidador ou veterinário para um gato.",
    iconBg: "bg-sky-100",
    iconColor: "text-sky-700",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <circle cx="9" cy="8" r="3.5" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.5 20a6.5 6.5 0 0113 0M16 10a3 3 0 100-6M21.5 20a5.5 5.5 0 00-3.5-5"
        />
      </svg>
    ),
    tutorOnly: true,
  },
  {
    href: "/register/log",
    title: "Refeição / Intercorrência",
    description: "Registrar refeição, intercorrência ou medicação.",
    iconBg: "bg-success/15",
    iconColor: "text-success",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 13l4 4L19 7"
        />
      </svg>
    ),
  },
  {
    href: "/cats/new",
    title: "Novo gato",
    description: "Cadastrar um gato para acompanhar.",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 5v14M5 12h14"
        />
      </svg>
    ),
    tutorOnly: true,
  },
];

export default async function RegisterHubPage() {
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
  if (profile?.role === "vet") redirect("/dashboard");

  const isTutor = profile?.role === "tutor";
  const visible = options.filter((o) => (o.tutorOnly ? isTutor : true));

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
          <span className="font-semibold">Registrar</span>
        </Link>
      </nav>

      <div className="flex flex-col gap-3 px-5 py-5">
        <p className="text-xs text-muted-foreground">O que deseja registrar?</p>

        {visible.map((o) => (
          <Link
            key={o.href}
            href={o.href}
            className="flex items-center gap-3 bg-card border border-border rounded-2xl p-4 hover:shadow-sm transition-shadow"
          >
            <div
              className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${o.iconBg} ${o.iconColor}`}
            >
              {o.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">{o.title}</p>
              <p className="text-xs text-muted-foreground">{o.description}</p>
            </div>
            <svg
              className="h-4 w-4 text-muted-foreground shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}
