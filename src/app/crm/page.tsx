import { CalendarDays, DollarSign, PhoneCall, UsersRound } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth/require-user";

type Profile = {
  role: "admin" | "recepcionista" | "comercial";
};

export default async function CrmPage() {
  const { supabase, user: _user } = await requireUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", _user.id)
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
    <main>
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
            <Link
              className="inline-flex h-10 items-center rounded-lg border border-[#dfd7cc] px-4 text-sm font-semibold transition hover:bg-[#f5f3e7]"
              href="/crm/relatorios"
            >
              Ver relatorios
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
