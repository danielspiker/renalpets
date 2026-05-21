import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function HistoryPickCatPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: cats } = await supabase
    .from("cats")
    .select("id, name")
    .order("name");

  const list = cats ?? [];

  if (list.length === 1) {
    redirect(`/cats/${list[0].id}/history`);
  }

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
          <span className="font-semibold">Histórico</span>
        </Link>
      </nav>

      <div className="flex flex-col gap-4 px-5 py-5">
        {list.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum gato disponível.
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              Histórico de qual gato?
            </p>
            <ul className="bg-card border border-border rounded-2xl divide-y divide-border">
              {list.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/cats/${c.id}/history`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground font-semibold">
                          {c.name?.[0]?.toUpperCase() ?? "?"}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {c.name}
                      </span>
                    </div>
                    <svg
                      className="h-4 w-4 text-muted-foreground"
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
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
