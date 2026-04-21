"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type TabKey =
  | "inicio"
  | "gatos"
  | "registrar"
  | "historico"
  | "perfil"
  | "pacientes"
  | "alertas"
  | "prescricoes";

type Tab = {
  key: TabKey;
  label: string;
  href: string | null;
  icon: React.ReactNode;
  match: (path: string) => boolean;
};

const iconClass = "h-5 w-5";

const icons = {
  home: (
    <svg
      className={iconClass}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12l9-9 9 9M5 10v10h14V10"
      />
    </svg>
  ),
  cat: (
    <svg
      className={iconClass}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 11c0 5.5-7 10-7 10z"
      />
    </svg>
  ),
  plus: (
    <svg
      className={iconClass}
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
  clock: (
    <svg
      className={iconClass}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" />
    </svg>
  ),
  user: (
    <svg
      className={iconClass}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="12" cy="8" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 21a8 8 0 0116 0" />
    </svg>
  ),
  users: (
    <svg
      className={iconClass}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="9" cy="8" r="3.5" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.5 20a6.5 6.5 0 0113 0M16 10a3 3 0 100-6 M21.5 20a5.5 5.5 0 00-3.5-5"
      />
    </svg>
  ),
  alert: (
    <svg
      className={iconClass}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3L2 20h20L12 3zM12 10v4M12 17.5h.01"
      />
    </svg>
  ),
  doc: (
    <svg
      className={iconClass}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 3h8l5 5v13H7zM15 3v5h5M9 13h6M9 17h6"
      />
    </svg>
  ),
};

const tutorTabs: Tab[] = [
  {
    key: "inicio",
    label: "Início",
    href: "/dashboard",
    icon: icons.home,
    match: (p) => p === "/dashboard",
  },
  {
    key: "gatos",
    label: "Gatos",
    href: "/dashboard",
    icon: icons.cat,
    match: (p) => p.startsWith("/cats"),
  },
  {
    key: "registrar",
    label: "Registrar",
    href: null,
    icon: icons.plus,
    match: (p) => p.includes("/meals/new"),
  },
  {
    key: "historico",
    label: "Histórico",
    href: null,
    icon: icons.clock,
    match: () => false,
  },
  {
    key: "perfil",
    label: "Perfil",
    href: null,
    icon: icons.user,
    match: () => false,
  },
];

const vetTabs: Tab[] = [
  {
    key: "pacientes",
    label: "Pacientes",
    href: "/dashboard",
    icon: icons.users,
    match: (p) => p === "/dashboard" || p.startsWith("/cats"),
  },
  {
    key: "alertas",
    label: "Alertas",
    href: null,
    icon: icons.alert,
    match: () => false,
  },
  {
    key: "prescricoes",
    label: "Prescrições",
    href: null,
    icon: icons.doc,
    match: () => false,
  },
  {
    key: "perfil",
    label: "Perfil",
    href: null,
    icon: icons.user,
    match: () => false,
  },
];

type Role = "tutor" | "caregiver" | "vet";

export function BottomTabBar({ role }: { role: Role }) {
  const pathname = usePathname();
  const tabs = role === "vet" ? vetTabs : tutorTabs;
  const isVet = role === "vet";

  return (
    <nav
      className={`sticky bottom-0 left-0 right-0 z-40 border-t ${
        isVet
          ? "bg-vet-surface border-white/10 text-vet-foreground"
          : "bg-card border-border text-muted-foreground"
      }`}
    >
      <ul className="flex items-stretch justify-around px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {tabs.map((tab) => {
          const active = tab.match(pathname);
          const disabled = !tab.href;
          const activeColor = isVet ? "text-primary" : "text-primary";
          const inactiveColor = isVet
            ? "text-vet-foreground/70"
            : "text-muted-foreground";

          const inner = (
            <div
              className={`flex flex-col items-center gap-1 py-1 ${
                active ? activeColor : inactiveColor
              } ${disabled ? "opacity-40" : ""}`}
            >
              <div
                className={`flex items-center justify-center rounded-full ${
                  active ? "bg-primary/10" : ""
                } p-1.5`}
              >
                {tab.icon}
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wide">
                {tab.label}
              </span>
            </div>
          );

          return (
            <li key={tab.key} className="flex-1">
              {tab.href ? (
                <Link
                  href={tab.href}
                  className="flex flex-col items-center w-full"
                >
                  {inner}
                </Link>
              ) : (
                <div
                  aria-disabled="true"
                  className="flex flex-col items-center w-full cursor-not-allowed"
                  title="Em breve"
                >
                  {inner}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
