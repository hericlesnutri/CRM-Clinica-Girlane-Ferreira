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
      <section className="flex w-full flex-col gap-5 py-5 lg:py-0">
        <div className="overflow-hidden rounded-lg border border-[#f1c9bf] bg-[linear-gradient(135deg,#fffdf8_0%,#fff0ea_58%,#eef6e9_100%)] p-5 shadow-sm lg:p-6">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#9e7f60]">
            Comece aqui
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            O que precisa ser feito hoje?
          </h2>
          <p className="mt-3 max-w-3xl leading-7 text-[#5d5248]">
            Use este painel como ponto de partida. Para registrar qualquer
            oportunidade de venda ou acompanhamento pos-venda, comece por
            Atender.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              className="inline-flex h-10 items-center rounded-lg bg-[#c96f61] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#b85f52]"
              href="/crm/atendimento"
            >
              Novo atendimento
            </Link>
            <Link
              className="inline-flex h-10 items-center rounded-lg border border-[#ead8c8] bg-white/70 px-4 text-sm font-semibold transition hover:bg-[#fff0ea]"
              href="/crm/agenda"
            >
              Ver retornos
            </Link>
            <Link
              className="inline-flex h-10 items-center rounded-lg border border-[#ead8c8] bg-white/70 px-4 text-sm font-semibold transition hover:bg-[#fff0ea]"
              href="/crm/oportunidades"
            >
              Ver vendas
            </Link>
            <Link
              className="inline-flex h-10 items-center rounded-lg border border-[#ead8c8] bg-white/70 px-4 text-sm font-semibold transition hover:bg-[#fff0ea]"
              href="/crm/pacientes"
            >
              Buscar paciente
            </Link>
            {profile?.role === "admin" ? (
              <Link
                className="inline-flex h-10 items-center rounded-lg border border-[#ead8c8] bg-white/70 px-4 text-sm font-semibold transition hover:bg-[#fff0ea]"
                href="/crm/admin"
              >
                Equipe
              </Link>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            tone="rose"
            icon={<UsersRound aria-hidden className="size-5" />}
            label="Pacientes"
            value={String(patientsCount ?? 0)}
          />
          <MetricCard
            tone="sage"
            icon={<PhoneCall aria-hidden className="size-5" />}
            label="Acompanhamentos"
            value={String(contactsCount ?? 0)}
          />
          <MetricCard
            tone="gold"
            icon={<CalendarDays aria-hidden className="size-5" />}
            label="Retornos pendentes"
            value={String(pendingReturnsCount ?? 0)}
          />
          <MetricCard
            tone="lavender"
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
  tone,
  value,
}: {
  icon: ReactNode;
  label: string;
  tone: "gold" | "lavender" | "rose" | "sage";
  value: string;
}) {
  return (
    <article className={metricCardClassName(tone)}>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-[#5d5248]">{label}</p>
        <div className={metricIconClassName(tone)}>
          {icon}
        </div>
      </div>
      <p className="mt-5 text-2xl font-semibold">{value}</p>
    </article>
  );
}

function metricCardClassName(tone: "gold" | "lavender" | "rose" | "sage") {
  const base = "rounded-lg border p-5 shadow-sm";
  const tones = {
    gold: "border-[#ead8a2] bg-[#fff7d9]",
    lavender: "border-[#dacced] bg-[#f5effc]",
    rose: "border-[#f1c9bf] bg-[#fff0ea]",
    sage: "border-[#cfe0c8] bg-[#eef6e9]",
  };

  return `${base} ${tones[tone]}`;
}

function metricIconClassName(tone: "gold" | "lavender" | "rose" | "sage") {
  const base = "flex size-9 items-center justify-center rounded-lg";
  const tones = {
    gold: "bg-[#e7c77d] text-[#5c4217]",
    lavender: "bg-[#d7c5ef] text-[#463059]",
    rose: "bg-[#f1b7ad] text-[#68342d]",
    sage: "bg-[#b8dcc8] text-[#244635]",
  };

  return `${base} ${tones[tone]}`;
}
