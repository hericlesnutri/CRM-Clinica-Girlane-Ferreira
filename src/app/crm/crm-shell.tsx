"use client";

import {
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  MessagesSquare,
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

const navItems = [
  { href: "/crm", icon: LayoutDashboard, label: "Painel" },
  { href: "/crm/atendimento", icon: UserRoundPlus, label: "Atendimento" },
  { href: "/crm/agenda", icon: CalendarDays, label: "Agenda" },
  { href: "/crm/whatsapp", icon: MessagesSquare, label: "WhatsApp" },
  { href: "/crm/instagram", icon: MessageCircle, label: "Instagram" },
  { href: "/crm/oportunidades", icon: Sparkles, label: "Funil" },
  { href: "/crm/pacientes", icon: UsersRound, label: "Pacientes" },
  { href: "/crm/relatorios", icon: BarChart3, label: "Relatorios" },
  { adminOnly: true, href: "/crm/admin", icon: Settings, label: "Equipe" },
];

export function CrmShell({ children, profile, userEmail }: CrmShellProps) {
  const pathname = usePathname();
  const visibleNavItems = navItems.filter((item) => {
    return !item.adminOnly || profile?.role === "admin";
  });
  const mobileNavItems = visibleNavItems.filter((item) => {
    return ["/crm/atendimento", "/crm/whatsapp", "/crm/agenda", "/crm/oportunidades", "/crm/pacientes"].includes(
      item.href,
    );
  });

  return (
    <div className="min-h-screen bg-[var(--brand-offwhite)] pb-20 text-[var(--brand-dark)] lg:pb-0">
      <header className="sticky top-0 z-40 border-b border-[#dfd7cc] bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-4">
            <Link href="/crm" className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#9e7f60]">
                CRM Girlane Ferreira
              </p>
              <p className="truncate text-lg font-semibold">Painel comercial</p>
            </Link>

            <form action={signOut} className="lg:hidden">
              <button
                aria-label="Sair"
                className="inline-flex size-10 items-center justify-center rounded-lg border border-[#dfd7cc] transition hover:bg-[#f5f3e7]"
                type="submit"
              >
                <LogOut aria-hidden className="size-4" />
              </button>
            </form>
          </div>

          <nav className="hidden lg:block">
            <div className="flex min-w-max gap-2">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/crm"
                    ? pathname === "/crm"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    className={navItemClassName(isActive)}
                    href={item.href}
                    key={item.href}
                  >
                    <Icon aria-hidden className="size-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <div className="max-w-48 text-right text-sm">
              <p className="truncate font-medium">
                {profile?.full_name ?? userEmail ?? "Usuario"}
              </p>
              <p className="text-[#5d5248]">
                {profile?.role ? roleLabels[profile.role] : "Perfil em configuracao"}
              </p>
            </div>
            <form action={signOut}>
              <button
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#dfd7cc] px-4 text-sm font-medium transition hover:bg-[#f5f3e7]"
                type="submit"
              >
                <LogOut aria-hidden className="size-4" />
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      {children}

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

function navItemClassName(isActive: boolean) {
  const base =
    "inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition";

  if (isActive) {
    return `${base} bg-[#333333] text-[#f5f3e7]`;
  }

  return `${base} border border-[#dfd7cc] bg-white text-[#333333] hover:bg-[#f5f3e7]`;
}

function mobileNavItemClassName(isActive: boolean) {
  const base =
    "flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-[11px] font-semibold transition";

  if (isActive) {
    return `${base} bg-[#333333] text-[#f5f3e7]`;
  }

  return `${base} text-[#5d5248] hover:bg-[#f5f3e7]`;
}
