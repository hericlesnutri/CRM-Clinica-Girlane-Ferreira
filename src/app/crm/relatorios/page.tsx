import Link from "next/link";
import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth/require-user";

type AppRole = "admin" | "recepcionista" | "comercial";

type Profile = {
  id: string;
  full_name: string;
  role: AppRole;
};

type Opportunity = {
  closed_at: string | null;
  closed_value: number | null;
  created_at: string;
  lost_at: string | null;
  owner_id: string | null;
  proposed_value: number | null;
  status: OpportunityStatus;
  updated_at: string;
};

type ContactLog = {
  channel: string;
  contacted_by: string | null;
  created_at: string;
  next_contact_at: string | null;
  return_type: string;
};

type OpportunityStatus =
  | "aberta"
  | "proposta_enviada"
  | "aguardando_retorno"
  | "fechada"
  | "perdida";

type PeriodKey = "month" | "90d" | "all";

type ReportsPageProps = {
  searchParams?: Promise<{ period?: string }> | { period?: string };
};

type UserPerformance = {
  averageTicket: number;
  closedCount: number;
  closedValue: number;
  contactsCount: number;
  conversionRate: number;
  createdOpportunitiesCount: number;
  lostCount: number;
  openValue: number;
  profile: Profile;
};

const opportunityStatusLabels: Record<OpportunityStatus, string> = {
  aberta: "Aberta",
  proposta_enviada: "Proposta enviada",
  aguardando_retorno: "Aguardando retorno",
  fechada: "Fechada",
  perdida: "Perdida",
};

const periods: Array<{ href: string; key: PeriodKey; label: string }> = [
  { href: "/crm/relatorios?period=month", key: "month", label: "Este mes" },
  { href: "/crm/relatorios?period=90d", key: "90d", label: "90 dias" },
  { href: "/crm/relatorios?period=all", key: "all", label: "Tudo" },
];

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const { supabase, user } = await requireUser();
  const resolvedSearchParams = await searchParams;
  const selectedPeriod = normalizePeriod(resolvedSearchParams?.period);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const performanceStartDate = getPeriodStartDate(selectedPeriod, now);

  const [
    { data: currentProfile },
    { data: opportunities },
    { data: contacts },
    { count: patientsCount },
    { count: proceduresCount },
    { data: profiles },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("id", user.id)
      .single<Profile>(),
    supabase
      .from("opportunities")
      .select(
        "closed_at, closed_value, created_at, lost_at, owner_id, proposed_value, status, updated_at",
      )
      .returns<Opportunity[]>(),
    supabase
      .from("contact_logs")
      .select("channel, contacted_by, return_type, created_at, next_contact_at")
      .returns<ContactLog[]>(),
    supabase.from("patients").select("id", { count: "exact", head: true }),
    supabase.from("patient_procedures").select("id", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("id, full_name, role")
      .order("full_name", { ascending: true })
      .returns<Profile[]>(),
  ]);

  const isAdmin = currentProfile?.role === "admin";
  const opportunityItems = opportunities ?? [];
  const contactItems = contacts ?? [];
  const team = profiles ?? [];
  const userPerformance = isAdmin
    ? buildUserPerformance(team, opportunityItems, contactItems, performanceStartDate)
    : [];
  const topCloser = userPerformance[0];

  const openOpportunities = opportunityItems.filter(
    (opportunity) => !["fechada", "perdida"].includes(opportunity.status),
  );
  const wonOpportunities = opportunityItems.filter(
    (opportunity) => opportunity.status === "fechada",
  );
  const lostOpportunities = opportunityItems.filter(
    (opportunity) => opportunity.status === "perdida",
  );
  const monthOpportunities = opportunityItems.filter(
    (opportunity) => new Date(opportunity.created_at) >= startOfMonth,
  );
  const todayContacts = contactItems.filter(
    (contact) => new Date(contact.created_at) >= startOfToday,
  );
  const monthContacts = contactItems.filter(
    (contact) => new Date(contact.created_at) >= startOfMonth,
  );
  const overdueReturns = contactItems.filter((contact) => {
    return contact.next_contact_at && new Date(contact.next_contact_at) < startOfToday;
  });

  const openValue = sumOpportunityValue(openOpportunities);
  const wonValue = sumOpportunityValue(wonOpportunities);
  const conversionRate =
    wonOpportunities.length + lostOpportunities.length === 0
      ? 0
      : (wonOpportunities.length /
          (wonOpportunities.length + lostOpportunities.length)) *
        100;

  return (
    <main className="min-h-screen bg-[var(--brand-offwhite)] text-[var(--brand-dark)]">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Link className="text-sm font-medium text-[#9e7f60]" href="/crm">
              Voltar ao painel
            </Link>
            <h1 className="mt-2 text-3xl font-semibold">Relatorios comerciais</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5d5248]">
              Visao rapida de vendas, acompanhamentos e movimentacao da clinica.
            </p>
          </div>

          <Link
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[#c96f61] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#b85f52]"
            href="/crm/oportunidades"
          >
            Abrir vendas
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard label="Valor em aberto" value={formatCurrency(openValue)} />
          <MetricCard label="Valor fechado" value={formatCurrency(wonValue)} />
          <MetricCard
            label="Taxa de conversao"
            value={`${conversionRate.toLocaleString("pt-BR", {
              maximumFractionDigits: 1,
            })}%`}
          />
          <MetricCard label="Retornos atrasados" value={String(overdueReturns.length)} />
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard label="Pacientes" value={String(patientsCount ?? 0)} />
          <MetricCard label="Procedimentos registrados" value={String(proceduresCount ?? 0)} />
          <MetricCard label="Acompanhamentos hoje" value={String(todayContacts.length)} />
          <MetricCard label="Acompanhamentos no mes" value={String(monthContacts.length)} />
        </div>

        {isAdmin ? (
          <section className="rounded-lg border border-[#ead8c8] bg-[#fffdf8] shadow-sm">
            <div className="flex flex-col gap-4 border-b border-[#ead8c8] bg-[#fff0ea]/60 px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9e7f60]">
                  Administrador
                </p>
                <h2 className="mt-1 text-xl font-semibold">Performance por atendente</h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-[#5d5248]">
                  Compare contatos, vendas fechadas, valores e conversao por usuario.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {periods.map((period) => (
                  <Link
                    className={periodLinkClassName(period.key === selectedPeriod)}
                    href={period.href}
                    key={period.key}
                  >
                    {period.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-3">
              <MetricCard
                label="Melhor conversao"
                value={
                  topCloser
                    ? `${topCloser.profile.full_name} - ${formatPercent(
                        topCloser.conversionRate,
                      )}`
                    : "Sem dados"
                }
              />
              <MetricCard
                label="Maior valor fechado"
                value={formatCurrency(topCloser?.closedValue ?? 0)}
              />
              <MetricCard
                label="Vendas fechadas no periodo"
                value={String(
                  userPerformance.reduce((total, item) => total + item.closedCount, 0),
                )}
              />
            </div>

            <div className="overflow-x-auto px-5 pb-5">
              <table className="min-w-[58rem] w-full border-separate border-spacing-0 text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[0.12em] text-[#8a7665]">
                    <th className="border-b border-[#ead8c8] px-3 py-3">Atendente</th>
                    <th className="border-b border-[#ead8c8] px-3 py-3 text-right">Contatos</th>
                    <th className="border-b border-[#ead8c8] px-3 py-3 text-right">Oportunidades</th>
                    <th className="border-b border-[#ead8c8] px-3 py-3 text-right">Fechadas</th>
                    <th className="border-b border-[#ead8c8] px-3 py-3 text-right">Perdidas</th>
                    <th className="border-b border-[#ead8c8] px-3 py-3 text-right">Conversao</th>
                    <th className="border-b border-[#ead8c8] px-3 py-3 text-right">Valor fechado</th>
                    <th className="border-b border-[#ead8c8] px-3 py-3 text-right">Ticket medio</th>
                    <th className="border-b border-[#ead8c8] px-3 py-3 text-right">Em aberto</th>
                  </tr>
                </thead>
                <tbody>
                  {userPerformance.length ? (
                    userPerformance.map((item) => (
                      <tr className="odd:bg-[#fdf7f0] even:bg-white" key={item.profile.id}>
                        <td className="rounded-l-lg px-3 py-3 font-semibold">
                          <span>{item.profile.full_name}</span>
                          <span className="mt-1 block text-xs font-medium text-[#8a7665]">
                            {roleLabels[item.profile.role]}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right">{item.contactsCount}</td>
                        <td className="px-3 py-3 text-right">
                          {item.createdOpportunitiesCount}
                        </td>
                        <td className="px-3 py-3 text-right">{item.closedCount}</td>
                        <td className="px-3 py-3 text-right">{item.lostCount}</td>
                        <td className="px-3 py-3 text-right">
                          {formatPercent(item.conversionRate)}
                        </td>
                        <td className="px-3 py-3 text-right font-semibold">
                          {formatCurrency(item.closedValue)}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {formatCurrency(item.averageTicket)}
                        </td>
                        <td className="rounded-r-lg px-3 py-3 text-right">
                          {formatCurrency(item.openValue)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-3 py-10 text-center text-[#5d5248]" colSpan={9}>
                        Ainda nao ha movimentacao suficiente para este periodo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <section className="rounded-lg border border-[#ead8c8] bg-[#fffdf8] px-5 py-4 text-sm text-[#5d5248] shadow-sm">
            O relatorio de performance por atendente fica disponivel para administradores.
          </section>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          <ReportPanel title="Oportunidades / vendas por etapa">
            {Object.entries(opportunityStatusLabels).map(([status, label]) => {
              const statusItems = opportunityItems.filter(
                (opportunity) => opportunity.status === status,
              );

              return (
                <ReportLine
                  key={status}
                  label={label}
                  value={`${statusItems.length} - ${formatCurrency(
                    sumOpportunityValue(statusItems),
                  )}`}
                />
              );
            })}
          </ReportPanel>

          <ReportPanel title="Acompanhamentos por canal">
            {groupBy(contactItems, "channel").map((item) => (
              <ReportLine key={item.label} label={item.label} value={String(item.count)} />
            ))}
          </ReportPanel>

          <ReportPanel title="Movimento do mes">
            <ReportLine
              label="Oportunidades / vendas criadas"
              value={String(monthOpportunities.length)}
            />
            <ReportLine
              label="Valor criado"
              value={formatCurrency(sumOpportunityValue(monthOpportunities))}
            />
            <ReportLine label="Acompanhamentos realizados" value={String(monthContacts.length)} />
            <ReportLine
              label="Pos-venda"
              value={String(
                monthContacts.filter((contact) => contact.return_type === "pos_procedimento")
                  .length,
              )}
            />
          </ReportPanel>
        </div>
      </section>
    </main>
  );
}

const roleLabels: Record<AppRole, string> = {
  admin: "Administrador",
  recepcionista: "Recepcionista",
  comercial: "Comercial",
};

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border border-[#ead8c8] bg-[#fffdf8] p-5 shadow-sm">
      <p className="text-sm text-[#5d5248]">{label}</p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
    </article>
  );
}

function ReportPanel({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-lg border border-[#ead8c8] bg-[#fffdf8] shadow-sm">
      <div className="border-b border-[#ead8c8] bg-[#fff0ea]/60 px-5 py-4">
        <h2 className="font-semibold">{title}</h2>
      </div>
      <div className="grid gap-3 p-5">{children}</div>
    </section>
  );
}

function ReportLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-[#f4f8ef] px-4 py-3 text-sm">
      <span className="text-[#5d5248]">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function buildUserPerformance(
  profiles: Profile[],
  opportunities: Opportunity[],
  contacts: ContactLog[],
  startDate: Date | null,
) {
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
  const unknownProfile: Profile = {
    id: "sem-responsavel",
    full_name: "Sem responsavel",
    role: "comercial",
  };

  for (const opportunity of opportunities) {
    if (!opportunity.owner_id && !profileMap.has(unknownProfile.id)) {
      profileMap.set(unknownProfile.id, unknownProfile);
    }
  }

  const rows: UserPerformance[] = Array.from(profileMap.values()).map((profile) => {
    const profileId = profile.id === unknownProfile.id ? null : profile.id;
    const ownedOpportunities = opportunities.filter(
      (opportunity) => opportunity.owner_id === profileId,
    );
    const createdOpportunities = ownedOpportunities.filter((opportunity) =>
      isInPeriod(opportunity.created_at, startDate),
    );
    const closedOpportunities = ownedOpportunities.filter((opportunity) => {
      return (
        opportunity.status === "fechada" &&
        isInPeriod(opportunity.closed_at ?? opportunity.updated_at, startDate)
      );
    });
    const lostOpportunities = ownedOpportunities.filter((opportunity) => {
      return (
        opportunity.status === "perdida" &&
        isInPeriod(opportunity.lost_at ?? opportunity.updated_at, startDate)
      );
    });
    const contactsInPeriod = contacts.filter((contact) => {
      return contact.contacted_by === profileId && isInPeriod(contact.created_at, startDate);
    });
    const openValue = ownedOpportunities
      .filter((opportunity) => !["fechada", "perdida"].includes(opportunity.status))
      .reduce((total, opportunity) => total + Number(opportunity.proposed_value ?? 0), 0);
    const closedValue = sumOpportunityValue(closedOpportunities);
    const finishedCount = closedOpportunities.length + lostOpportunities.length;

    return {
      averageTicket:
        closedOpportunities.length === 0 ? 0 : closedValue / closedOpportunities.length,
      closedCount: closedOpportunities.length,
      closedValue,
      contactsCount: contactsInPeriod.length,
      conversionRate:
        finishedCount === 0 ? 0 : (closedOpportunities.length / finishedCount) * 100,
      createdOpportunitiesCount: createdOpportunities.length,
      lostCount: lostOpportunities.length,
      openValue,
      profile,
    };
  });

  return rows
    .filter((row) => {
      return (
        row.contactsCount > 0 ||
        row.createdOpportunitiesCount > 0 ||
        row.closedCount > 0 ||
        row.lostCount > 0 ||
        row.openValue > 0
      );
    })
    .sort((a, b) => {
      if (b.closedValue !== a.closedValue) {
        return b.closedValue - a.closedValue;
      }

      if (b.closedCount !== a.closedCount) {
        return b.closedCount - a.closedCount;
      }

      return b.conversionRate - a.conversionRate;
    });
}

function sumOpportunityValue(opportunities: Opportunity[]) {
  return opportunities.reduce((total, opportunity) => {
    if (opportunity.status === "fechada") {
      return total + Number(opportunity.closed_value ?? opportunity.proposed_value ?? 0);
    }

    return total + Number(opportunity.proposed_value ?? 0);
  }, 0);
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatPercent(value: number) {
  return `${value.toLocaleString("pt-BR", {
    maximumFractionDigits: 1,
  })}%`;
}

function groupBy<T extends Record<string, unknown>>(items: T[], key: keyof T) {
  const groups = new Map<string, number>();

  for (const item of items) {
    const label = String(item[key] ?? "Nao informado");
    groups.set(label, (groups.get(label) ?? 0) + 1);
  }

  return Array.from(groups.entries())
    .map(([label, count]) => ({ count, label }))
    .sort((a, b) => b.count - a.count);
}

function getPeriodStartDate(period: PeriodKey, now: Date) {
  if (period === "all") {
    return null;
  }

  if (period === "90d") {
    const date = new Date(now);
    date.setDate(date.getDate() - 90);
    return date;
  }

  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function isInPeriod(dateValue: string | null, startDate: Date | null) {
  if (!dateValue) {
    return false;
  }

  if (!startDate) {
    return true;
  }

  return new Date(dateValue) >= startDate;
}

function normalizePeriod(period?: string): PeriodKey {
  if (period === "90d" || period === "all") {
    return period;
  }

  return "month";
}

function periodLinkClassName(isActive: boolean) {
  const base =
    "inline-flex h-9 items-center justify-center rounded-lg px-3 text-sm font-semibold transition";

  if (isActive) {
    return `${base} bg-[#333333] text-white`;
  }

  return `${base} border border-[#ead8c8] bg-white text-[#5d5248] hover:bg-[#fff0ea]`;
}
