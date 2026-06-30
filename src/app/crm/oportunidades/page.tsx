import Link from "next/link";
import { EvolutionDialog } from "../agenda/evolution-dialog";
import { OpportunityStatusSelect } from "./status-select";
import { requireUser } from "@/lib/auth/require-user";

type Opportunity = {
  id: string;
  suggested_procedure: string;
  proposed_value: number | null;
  closed_value: number | null;
  status: OpportunityStatus;
  expected_return_at: string | null;
  notes: string | null;
  created_at: string;
  patients: {
    id: string;
    name: string;
    phone: string;
  } | null;
};

type OpportunityStatus =
  | "aberta"
  | "proposta_enviada"
  | "aguardando_retorno"
  | "fechada"
  | "perdida";

type FunnelColumn = {
  description: string;
  status: OpportunityStatus;
  title: string;
};

const funnelColumns: FunnelColumn[] = [
  {
    description: "Interesse identificado, mas ainda sem proposta final.",
    status: "aberta",
    title: "Aberta",
  },
  {
    description: "Proposta enviada para avaliacao da paciente.",
    status: "proposta_enviada",
    title: "Proposta enviada",
  },
  {
    description: "Precisa de retorno ativo do comercial.",
    status: "aguardando_retorno",
    title: "Aguardando retorno",
  },
  {
    description: "Negociacoes convertidas em agendamento ou venda.",
    status: "fechada",
    title: "Fechada",
  },
  {
    description: "Oportunidades que nao avancaram neste momento.",
    status: "perdida",
    title: "Perdida",
  },
];

export default async function OpportunitiesPage() {
  const { supabase } = await requireUser();

  const { data: opportunities } = await supabase
    .from("opportunities")
    .select(
      "id, suggested_procedure, proposed_value, closed_value, status, expected_return_at, notes, created_at, patients(id, name, phone)",
    )
    .order("created_at", { ascending: false })
    .returns<Opportunity[]>();

  const items = opportunities ?? [];
  const openValue = items
    .filter((opportunity) => !["fechada", "perdida"].includes(opportunity.status))
    .reduce((total, opportunity) => total + Number(opportunity.proposed_value ?? 0), 0);
  const wonValue = items
    .filter((opportunity) => opportunity.status === "fechada")
    .reduce((total, opportunity) => total + getOpportunityValue(opportunity), 0);

  return (
    <main className="min-h-screen bg-[var(--brand-offwhite)] text-[var(--brand-dark)]">
      <section className="flex w-full flex-col gap-5 py-5 lg:py-0">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Link className="text-sm font-medium text-[#9e7f60]" href="/crm">
              Voltar ao painel
            </Link>
            <h1 className="mt-2 text-3xl font-semibold">Oportunidades / vendas</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5d5248]">
              Veja leads, propostas, retornos e vendas em colunas simples.
            </p>
          </div>

          <Link
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[#c96f61] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#b85f52]"
            href="/crm/atendimento"
          >
            Nova venda
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard label="Oportunidades / vendas" value={String(items.length)} />
          <SummaryCard label="Valor em aberto" value={formatCurrency(openValue)} />
          <SummaryCard label="Valor fechado" value={formatCurrency(wonValue)} />
        </div>

        <div className="-mx-4 overflow-x-auto px-4 pt-2 [transform:rotateX(180deg)]">
          <div className="grid min-w-[92rem] grid-cols-5 gap-3 [transform:rotateX(180deg)]">
            {funnelColumns.map((column) => {
              const columnItems = items.filter(
                (opportunity) => opportunity.status === column.status,
              );
              const columnValue = columnItems.reduce((total, opportunity) => {
                return total + getOpportunityValue(opportunity);
              }, 0);

              return (
                <FunnelColumn
                  column={column}
                  items={columnItems}
                  key={column.status}
                  totalValue={columnValue}
                />
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border border-[#ead8c8] bg-[#fffdf8] p-5 shadow-sm">
      <p className="text-sm text-[#5d5248]">{label}</p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
    </article>
  );
}

function FunnelColumn({
  column,
  items,
  totalValue,
}: {
  column: FunnelColumn;
  items: Opportunity[];
  totalValue: number;
}) {
  return (
    <section className={funnelColumnClassName(column.status)}>
      <div className="shrink-0 border-b border-white/70 px-3 py-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">{column.title}</h2>
          <span className={countClassName(column.status)}>{items.length}</span>
        </div>
        <p className="mt-1 text-xs leading-5 text-[#5d5248]">{column.description}</p>
        <p className="mt-2 text-sm font-semibold text-[#9e7f60]">
          {formatCurrency(totalValue)}
        </p>
      </div>

      {items.length ? (
        <div className="crm-hidden-scrollbar flex flex-1 flex-col gap-2 overflow-y-auto bg-white/45 p-2">
          {items.map((opportunity) => (
            <OpportunityCard key={opportunity.id} opportunity={opportunity} />
          ))}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center bg-white/45 px-5 py-8 text-center text-sm text-[#5d5248]">
          Nenhuma oportunidade nesta etapa.
        </div>
      )}
    </section>
  );
}

function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  if (isFinalStatus(opportunity.status)) {
    return <FinalOpportunityCard opportunity={opportunity} />;
  }

  return (
    <article className={cardClassName(opportunity.status)}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <span className={badgeClassName(opportunity.status)}>
            {statusLabels[opportunity.status]}
          </span>
          <p className="mt-2 font-semibold leading-5">
            {opportunity.patients?.name ?? "Paciente removido"}
          </p>
          <h3 className="mt-1 text-sm font-medium leading-5">
            {opportunity.suggested_procedure}
          </h3>
        </div>
        <EvolutionDialog compact itemId={opportunity.id} itemType="opportunity" />
      </div>

      <p className="mt-1 text-xs leading-5 text-[#5d5248]">
        {opportunity.patients?.phone ?? "Telefone nao disponivel"}
      </p>

      <div className="mt-3 grid gap-1.5 text-sm">
        <InfoLine label="Valor" value={formatCurrency(opportunity.proposed_value)} />
        <InfoLine
          label="Retorno"
          value={
            opportunity.expected_return_at
              ? formatDateTime(opportunity.expected_return_at)
              : "Nao agendado"
          }
        />
      </div>

      {opportunity.notes ? (
        <p className="mt-3 line-clamp-3 whitespace-pre-line text-sm leading-5">
          {opportunity.notes}
        </p>
      ) : null}

      <div className="mt-3 grid gap-2">
        <OpportunityStatusSelect
          id={opportunity.id}
          proposedValue={opportunity.proposed_value}
          status={opportunity.status}
        />

        {opportunity.patients ? (
          <Link
            className="inline-flex h-8 w-fit items-center rounded-md border border-[#dfd7cc] bg-white px-2 text-xs font-medium transition hover:bg-[#f5f3e7]"
            href={`/crm/pacientes/${opportunity.patients.id}`}
          >
            Abrir ficha
          </Link>
        ) : null}
      </div>
    </article>
  );
}

function FinalOpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  return (
    <article className={finalCardClassName(opportunity.status)}>
      <p className="font-semibold leading-5">
        {opportunity.patients?.name ?? "Paciente removido"}
      </p>
      <p className="mt-1 text-xs leading-5 text-[#5d5248]">
        {opportunity.patients?.phone ?? "Telefone nao disponivel"}
      </p>
      <p className="mt-2 text-sm font-semibold">
        {formatCurrency(getOpportunityValue(opportunity))}
      </p>
    </article>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[#5d5248]">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function formatCurrency(value: number | null) {
  return Number(value ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getOpportunityValue(opportunity: Opportunity) {
  if (opportunity.status === "fechada") {
    return Number(opportunity.closed_value ?? opportunity.proposed_value ?? 0);
  }

  return Number(opportunity.proposed_value ?? 0);
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function cardClassName(status: OpportunityStatus) {
  const base = "rounded-lg border p-2.5 shadow-sm";

  if (status === "fechada") {
    return `${base} border-emerald-300 bg-emerald-50`;
  }

  if (status === "perdida") {
    return `${base} border-red-200 bg-red-50`;
  }

  if (status === "aguardando_retorno") {
    return `${base} border-sky-300 bg-sky-50`;
  }

  return `${base} border-amber-300 bg-amber-50`;
}

function funnelColumnClassName(status: OpportunityStatus) {
  const base =
    "flex h-[min(42rem,calc(100vh-16rem))] min-h-[28rem] flex-col overflow-hidden rounded-lg border shadow-sm";
  const tones: Record<OpportunityStatus, string> = {
    aberta: "border-[#ead8a2] bg-[#fff7d9]",
    proposta_enviada: "border-[#f1c9bf] bg-[#fff0ea]",
    aguardando_retorno: "border-sky-200 bg-sky-50",
    fechada: "border-[#b8dcc8] bg-[#eef6e9]",
    perdida: "border-red-200 bg-red-50",
  };

  return `${base} ${tones[status]}`;
}

function finalCardClassName(status: OpportunityStatus) {
  const base = "rounded-lg border p-2.5 shadow-sm";

  if (status === "fechada") {
    return `${base} border-emerald-300 bg-emerald-50`;
  }

  return `${base} border-red-200 bg-red-50`;
}

function badgeClassName(status: OpportunityStatus) {
  const base = "rounded-full px-2.5 py-0.5 text-xs font-medium";

  if (status === "fechada") {
    return `${base} bg-emerald-200 text-emerald-900`;
  }

  if (status === "perdida") {
    return `${base} bg-red-100 text-red-800`;
  }

  if (status === "aguardando_retorno") {
    return `${base} bg-sky-200 text-sky-900`;
  }

  return `${base} bg-amber-200 text-amber-900`;
}

function countClassName(status: OpportunityStatus) {
  const base = "rounded-full px-3 py-1 text-xs font-semibold";

  if (status === "fechada") {
    return `${base} bg-emerald-100 text-emerald-800`;
  }

  if (status === "perdida") {
    return `${base} bg-red-50 text-red-700`;
  }

  if (status === "aguardando_retorno") {
    return `${base} bg-sky-100 text-sky-800`;
  }

  return `${base} bg-amber-100 text-amber-800`;
}

const statusLabels: Record<OpportunityStatus, string> = {
  aberta: "Aberta",
  proposta_enviada: "Proposta enviada",
  aguardando_retorno: "Aguardando retorno",
  fechada: "Fechada",
  perdida: "Perdida",
};

function isFinalStatus(status: OpportunityStatus) {
  return status === "fechada" || status === "perdida";
}
