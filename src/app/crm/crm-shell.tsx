"use client";

import {
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Settings,
  Sparkles,
  UserRoundPlus,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import { signOut } from "@/app/auth/actions";

type AppRole = "admin" | "recepcionista" | "comercial";

type CrmShellProps = {
  children: ReactNode;
  profile: {
    full_name: string;
    role: AppRole;
  } | null;
  userEmail?: string;
};

const roleLabels: Record<AppRole, string> = {
  admin: "Administrador",
  recepcionista: "Recepcionista",
  comercial: "Comercial",
};

const primaryNavItems = [
  { href: "/crm", icon: LayoutDashboard, label: "Inicio" },
  { href: "/crm/atendimento", icon: UserRoundPlus, label: "Atender" },
  { href: "/crm/agenda", icon: CalendarDays, label: "Retornos" },
  { href: "/crm/oportunidades", icon: Sparkles, label: "Vendas" },
  { href: "/crm/pacientes", icon: UsersRound, label: "Pacientes" },
];

const secondaryNavItems = [
  { href: "/crm/relatorios", icon: BarChart3, label: "Relatorios" },
  { adminOnly: true, href: "/crm/admin", icon: Settings, label: "Equipe" },
];

export function CrmShell({ children, profile, userEmail }: CrmShellProps) {
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const visiblePrimaryNavItems = primaryNavItems;
  const visibleSecondaryNavItems = secondaryNavItems.filter((item) => {
    return !item.adminOnly || profile?.role === "admin";
  });
  const mobileNavItems = visiblePrimaryNavItems;

  return (
    <div className="min-h-screen bg-[var(--brand-offwhite)] pb-20 text-[var(--brand-dark)] lg:pb-0">
      <header className="sticky top-0 z-40 border-b border-[#ead8c8] bg-[rgba(255,253,248,0.88)] backdrop-blur lg:fixed lg:inset-x-0">
        <div
          className={`mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 transition-[padding] sm:px-6 ${
            isSidebarCollapsed ? "lg:pl-24" : "lg:pl-72"
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <Link href="/crm" className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#9e7f60]">
                CRM Girlane Ferreira
              </p>
              <p className="truncate text-lg font-semibold">Central da clinica</p>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              className="hidden h-10 items-center rounded-lg bg-[#c96f61] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#b85f52] sm:inline-flex"
              href="/crm/atendimento"
            >
              Novo atendimento
            </Link>
            <div className="max-w-48 text-right text-sm">
              <p className="hidden truncate font-medium sm:block">
                {profile?.full_name ?? userEmail ?? "Usuario"}
              </p>
              <p className="hidden text-[#5d5248] sm:block">
                {profile?.role ? roleLabels[profile.role] : "Perfil em configuracao"}
              </p>
            </div>
            <form action={signOut}>
              <button
                aria-label="Sair"
                className="inline-flex size-10 items-center justify-center rounded-lg border border-[#ead8c8] bg-white/80 text-sm font-medium transition hover:bg-[#fff0ea] sm:w-auto sm:px-4"
                type="submit"
              >
                <LogOut aria-hidden className="size-4" />
                <span className="hidden sm:ml-2 sm:inline">Sair</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <aside
        className={`fixed inset-y-0 left-0 z-50 hidden border-r border-[#ead8c8] bg-[linear-gradient(180deg,#fffdf8_0%,#fff3ec_52%,#f4f8ef_100%)] p-3 shadow-[8px_0_30px_rgba(158,127,96,0.10)] transition-[width] duration-200 lg:block ${
          isSidebarCollapsed ? "w-[4.75rem]" : "w-64"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="mb-4 flex items-center justify-between gap-3 px-2">
            <Link className="min-w-0" href="/crm">
              <p
                className={`text-xs font-medium uppercase tracking-[0.18em] text-[#9e7f60] ${
                  isSidebarCollapsed ? "sr-only" : ""
                }`}
              >
                CRM Girlane Ferreira
              </p>
              <p
                className={`truncate text-lg font-semibold ${
                  isSidebarCollapsed ? "sr-only" : ""
                }`}
              >
                Central da clinica
              </p>
            </Link>
            <button
              aria-label={isSidebarCollapsed ? "Mostrar menu" : "Ocultar menu"}
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-[#ead8c8] bg-white/80 transition hover:bg-[#fff0ea]"
              onClick={() => setIsSidebarCollapsed((current) => !current)}
              type="button"
            >
              {isSidebarCollapsed ? (
                <ChevronRight aria-hidden className="size-4" />
              ) : (
                <ChevronLeft aria-hidden className="size-4" />
              )}
            </button>
          </div>

          <nav className="flex h-full flex-col">
            <div className="space-y-1">
              <p
                className={`px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#9e7f60] ${
                  isSidebarCollapsed ? "sr-only" : ""
                }`}
              >
                Rotina
              </p>
              {visiblePrimaryNavItems.map((item) => (
                <NavLink
                  isCollapsed={isSidebarCollapsed}
                  item={item}
                  key={item.href}
                  pathname={pathname}
                />
              ))}
            </div>

            <div className="mt-6 space-y-1">
              <p
                className={`px-3 pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#9e7f60] ${
                  isSidebarCollapsed ? "sr-only" : ""
                }`}
              >
                Gestao
              </p>
              {visibleSecondaryNavItems.map((item) => (
                <NavLink
                  isCollapsed={isSidebarCollapsed}
                  item={item}
                  key={item.href}
                  pathname={pathname}
                />
              ))}
            </div>

            <div
              className={`mt-auto rounded-lg border border-[#f1c9bf] bg-[#fff0ea] p-3 text-sm text-[#6a5148] ${
                isSidebarCollapsed ? "hidden" : ""
              }`}
            >
              <p className="font-semibold text-[#333333]">Dica rapida</p>
              <p className="mt-1 leading-5">
                Para qualquer conversa nova, comece por Atender.
              </p>
            </div>
          </nav>
        </div>
      </aside>

      <div
        className={`mx-auto w-full max-w-7xl px-4 transition-[padding] sm:px-6 lg:py-24 ${
          isSidebarCollapsed ? "lg:pl-24" : "lg:pl-72"
        }`}
      >
        <div className="min-w-0">{children}</div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#ead8c8] bg-[rgba(255,253,248,0.95)] px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(201,111,97,0.12)] backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/crm" ? pathname === "/crm" : pathname.startsWith(item.href);

            return (
              <Link
                className={mobileNavItemClassName(isActive)}
                href={item.href}
                key={item.href}
              >
                <Icon aria-hidden className="size-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function NavLink({
  isCollapsed,
  item,
  pathname,
}: {
  isCollapsed: boolean;
  item: (typeof primaryNavItems)[number] | (typeof secondaryNavItems)[number];
  pathname: string;
}) {
  const Icon = item.icon;
  const isActive = item.href === "/crm" ? pathname === "/crm" : pathname.startsWith(item.href);

  return (
    <Link
      aria-label={item.label}
      className={navItemClassName(isActive, isCollapsed)}
      href={item.href}
      title={isCollapsed ? item.label : undefined}
    >
      <Icon aria-hidden className="size-4" />
      <span className={isCollapsed ? "sr-only" : ""}>{item.label}</span>
    </Link>
  );
}

function navItemClassName(isActive: boolean, isCollapsed: boolean) {
  const base =
    "flex h-10 items-center rounded-lg text-sm font-semibold transition";
  const size = isCollapsed ? "justify-center px-0" : "gap-3 px-3";

  if (isActive) {
    return `${base} ${size} bg-[#c96f61] text-white shadow-sm`;
  }

  return `${base} ${size} text-[#3b302b] hover:bg-[#fff0ea]`;
}

function mobileNavItemClassName(isActive: boolean) {
  const base =
    "flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-[10px] font-semibold transition sm:text-[11px]";

  if (isActive) {
    return `${base} bg-[#c96f61] text-white shadow-sm`;
  }

  return `${base} text-[#5d5248] hover:bg-[#fff0ea]`;
}
