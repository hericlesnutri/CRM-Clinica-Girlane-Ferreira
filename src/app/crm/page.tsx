import { CalendarDays, DollarSign, PhoneCall, UsersRound } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { signOut } from "@/app/auth/actions";
import { requireUser } from "@/lib/auth/require-user";

type Profile = {
  full_name: string;
  email: string | null;
  role: "admin" | "recepcionista" | "comercial";
};

const roleLabels: Record<Profile["role"], string> = {
  admin: "Administrador",
  recepcionista: "Recepcionista",
  comercial: "Comercial",
};

export default async function CrmPage() {
  const { supabase, user } = await requireUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role")
    .eq("id", user.id)
    .single<Profile>();

  const [
    { count: patientsCount },
    { count: contactsCount },
    { count: pendingContactReturnsCount },
    { count: pendingOpportunityReturnsCount },
    { data: openOpportunities },
  ] = await Promise.all([
    supabase.from("patients").select("id", { count: "exact", head: true }),
    supabase.from("contact_logs").select("id", { count: "exact", head: true }),
    supabase
      .from("contact_logs")
      .select("id", { count: "exact", head: true })
      .not("next_contact_at", "is", null),
    supabase
      .from("opportunities")
      .select("id", { count: "exact", head: true })
      .in("status", ["aberta", "proposta_enviada", "aguardando_retorno"])
      .not("expected_return_at", "is", null),
    supabase
      .from("opportunities")
      .select("proposed_value")
      .in("status", ["aberta", "proposta_enviada", "aguardando_retorno"]),
  ]);

  const pendingReturnsCount =
    (pendingContactReturnsCount ?? 0) + (pendingOpportunityReturnsCount ?? 0);

  const openProposalValue =
    openOpportunities?.reduce((total, item) => {
      return total + Number(item.proposed_value ?? 0);
    }, 0) ?? 0;

  return (
    <main className="min-h-screen bg-[var(--brand-offwhite)] text-[var(--brand-dark)]">
      <header className="border-b border-[#dfd7cc] bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#9e7f60]">
              CRM Girlane Ferreira
            </p>
            <h1 className="mt-1 text-2xl font-semibold">Painel comercial</h1>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="text-sm sm:text-right">
              <p className="font-medium">{profile?.full_name ?? user.email}</p>
              <p className="text-[#5d5248]">
                {profile?.role ? roleLabels[profile.role] : "Perfil em configuracao"}
              </p>
            </div>
            <form action={signOut}>
              <button
                className="h-10 rounded-lg border border-[#dfd7cc] px-4 text-sm font-medium transition hover:bg-[#f5f3e7]"
                type="submit"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8">
        <div className="rounded-lg border border-[#dfd7cc] bg-white p-6">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#9e7f60]">
            Proxima etapa
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            Operacao comercial do dia.
          </h2>
          <p className="mt-3 max-w-3xl leading-7 text-[#5d5248]">
            Use a central comercial para registrar contatos e oportunidades em
            uma unica tela. A ficha completa do paciente continua disponivel
            para consulta detalhada.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              className="inline-flex h-10 items-center rounded-lg bg-[#333333] px-4 text-sm font-semibold text-[#f5f3e7] transition hover:bg-[#4a4037]"
              href="/crm/atendimento"
            >
              Abrir central comercial
            </Link>
            <Link
              className="inline-flex h-10 items-center rounded-lg border border-[#dfd7cc] px-4 text-sm font-semibold transition hover:bg-[#f5f3e7]"
              href="/crm/agenda"
            >
              Ver agenda de retornos
            </Link>
            <Link
              className="inline-flex h-10 items-center rounded-lg border border-[#dfd7cc] px-4 text-sm font-semibold transition hover:bg-[#f5f3e7]"
              href="/crm/oportunidades"
            >
              Ver funil de oportunidades
            </Link>
            <Link
              className="inline-flex h-10 items-center rounded-lg border border-[#dfd7cc] px-4 text-sm font-semibold transition hover:bg-[#f5f3e7]"
              href="/crm/pacientes"
            >
              Cadastrar pacientes
            </Link>
            {profile?.role === "admin" ? (
              <Link
                className="inline-flex h-10 items-center rounded-lg border border-[#dfd7cc] px-4 text-sm font-semibold transition hover:bg-[#f5f3e7]"
                href="/crm/admin"
              >
                Administrar equipe
              </Link>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            icon={<UsersRound aria-hidden className="size-5" />}
            label="Pacientes"
            value={String(patientsCount ?? 0)}
          />
          <MetricCard
            icon={<PhoneCall aria-hidden className="size-5" />}
            label="Contatos registrados"
            value={String(contactsCount ?? 0)}
          />
          <MetricCard
            icon={<CalendarDays aria-hidden className="size-5" />}
            label="Retornos pendentes"
            value={String(pendingReturnsCount ?? 0)}
          />
          <MetricCard
            icon={<DollarSign aria-hidden className="size-5" />}
            label="Propostas abertas"
            value={openProposalValue.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          />
        </div>
      </section>
    </main>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-lg border border-[#dfd7cc] bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-[#5d5248]">{label}</p>
        <div className="flex size-9 items-center justify-center rounded-lg bg-[#dfd7cc] text-[#333333]">
          {icon}
        </div>
      </div>
      <p className="mt-5 text-2xl font-semibold">{value}</p>
    </article>
  );
}
