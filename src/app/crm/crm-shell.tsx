"use client";

import {
  BarChart3,
  CalendarDays,
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
  const visiblePrimaryNavItems = primaryNavItems;
  const visibleSecondaryNavItems = secondaryNavItems.filter((item) => {
    return !item.adminOnly || profile?.role === "admin";
  });
  const mobileNavItems = visiblePrimaryNavItems;

  return (
    <div className="min-h-screen bg-[var(--brand-offwhite)] pb-20 text-[var(--brand-dark)] lg:pb-0">
      <header className="sticky top-0 z-40 border-b border-[#dfd7cc] bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
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
              className="hidden h-10 items-center rounded-lg bg-[#333333] px-4 text-sm font-semibold text-[#f5f3e7] transition hover:bg-[#4a4037] sm:inline-flex"
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
                className="inline-flex size-10 items-center justify-center rounded-lg border border-[#dfd7cc] text-sm font-medium transition hover:bg-[#f5f3e7] sm:w-auto sm:px-4"
                type="submit"
              >
                <LogOut aria-hidden className="size-4" />
                <span className="hidden sm:ml-2 sm:inline">Sair</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[15rem_1fr] lg:py-6">
        <aside className="sticky top-[4.25rem] hidden h-[calc(100vh-5.75rem)] rounded-lg border border-[#dfd7cc] bg-white p-3 lg:block">
          <nav className="flex h-full flex-col">
            <div className="space-y-1">
              <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#9e7f60]">
                Rotina
              </p>
              {visiblePrimaryNavItems.map((item) => (
                <NavLink item={item} key={item.href} pathname={pathname} />
              ))}
            </div>

            <div className="mt-6 space-y-1">
              <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#9e7f60]">
                Gestao
              </p>
              {visibleSecondaryNavItems.map((item) => (
                <NavLink item={item} key={item.href} pathname={pathname} />
              ))}
            </div>

            <div className="mt-auto rounded-lg bg-[#f8f6ee] p-3 text-sm text-[#5d5248]">
              <p className="font-semibold text-[#333333]">Dica rapida</p>
              <p className="mt-1 leading-5">
                Para qualquer conversa nova, comece por Atender.
              </p>
            </div>
          </nav>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#dfd7cc] bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(51,51,51,0.08)] backdrop-blur lg:hidden">
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
  item,
  pathname,
}: {
  item: (typeof primaryNavItems)[number] | (typeof secondaryNavItems)[number];
  pathname: string;
}) {
  const Icon = item.icon;
  const isActive = item.href === "/crm" ? pathname === "/crm" : pathname.startsWith(item.href);

  return (
    <Link className={navItemClassName(isActive)} href={item.href}>
      <Icon aria-hidden className="size-4" />
      <span>{item.label}</span>
    </Link>
  );
}

function navItemClassName(isActive: boolean) {
  const base =
    "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition";

  if (isActive) {
    return `${base} bg-[#333333] text-[#f5f3e7]`;
  }

  return `${base} text-[#333333] hover:bg-[#f5f3e7]`;
}

function mobileNavItemClassName(isActive: boolean) {
  const base =
    "flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-[10px] font-semibold transition sm:text-[11px]";

  if (isActive) {
    return `${base} bg-[#333333] text-[#f5f3e7]`;
  }

  return `${base} text-[#5d5248] hover:bg-[#f5f3e7]`;
}
