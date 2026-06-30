import Link from "next/link";
import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth/require-user";

type Opportunity = {
  closed_value: number | null;
  proposed_value: number | null;
  status: OpportunityStatus;
  created_at: string;
};

type ContactLog = {
  channel: string;
  return_type: string;
  created_at: string;
  next_contact_at: string | null;
};

type OpportunityStatus =
  | "aberta"
  | "proposta_enviada"
  | "aguardando_retorno"
  | "fechada"
  | "perdida";

const opportunityStatusLabels: Record<OpportunityStatus, string> = {
  aberta: "Aberta",
  proposta_enviada: "Proposta enviada",
  aguardando_retorno: "Aguardando retorno",
  fechada: "Fechada",
  perdida: "Perdida",
};

export default async function ReportsPage() {
  const { supabase } = await requireUser();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    { data: opportunities },
    { data: contacts },
    { count: patientsCount },
    { count: proceduresCount },
  ] = await Promise.all([
    supabase
      .from("opportunities")
      .select("closed_value, proposed_value, status, created_at")
      .returns<Opportunity[]>(),
    supabase
      .from("contact_logs")
      .select("channel, return_type, created_at, next_contact_at")
      .returns<ContactLog[]>(),
    supabase.from("patients").select("id", { count: "exact", head: true }),
    supabase.from("patient_procedures").select("id", { count: "exact", head: true }),
  ]);

  const opportunityItems = opportunities ?? [];
  const contactItems = contacts ?? [];
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
              Visao rapida de vendas, acompanhamentos e movimentacao do mes.
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
